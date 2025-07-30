import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOKS] ${step}${detailsStr}`);
};

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) throw new Error("No stripe signature found");

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Event verified", { type: event.type, id: event.id });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    // Log the webhook event
    await supabaseClient.from("webhook_logs").insert({
      event_id: event.id,
      event_type: event.type,
      processed: false,
      data: event.data,
      created_at: new Date().toISOString()
    });

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event, supabaseClient, stripe);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event, supabaseClient);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event, supabaseClient, stripe);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event, supabaseClient);
        break;
      
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    // Mark webhook as processed
    await supabaseClient
      .from("webhook_logs")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("event_id", event.id);

    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook handler", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});

async function handleSubscriptionChange(
  event: Stripe.Event, 
  supabaseClient: any, 
  stripe: Stripe
) {
  const subscription = event.data.object as Stripe.Subscription;
  logStep("Handling subscription change", { 
    subscriptionId: subscription.id, 
    status: subscription.status 
  });

  try {
    // Get customer details
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if (!customer || customer.deleted) {
      throw new Error("Customer not found or deleted");
    }

    const email = (customer as Stripe.Customer).email;
    if (!email) throw new Error("Customer email not found");

    // Get plan details
    let planName = 'Unknown Plan';
    if (subscription.items.data.length > 0) {
      const price = await stripe.prices.retrieve(subscription.items.data[0].price.id);
      const product = await stripe.products.retrieve(price.product as string);
      planName = (product as Stripe.Product).name;
    }

    // Update subscriber record
    await supabaseClient.from("subscribers").upsert({
      email: email,
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      status: subscription.status === 'active' ? 'active' : 'inactive',
      plan_name: planName,
      subscription_start: new Date(subscription.created * 1000).toISOString(),
      subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Subscriber record updated", { email, status: subscription.status });

  } catch (error) {
    logStep("Error handling subscription change", { error: error.message });
    throw error;
  }
}

async function handleSubscriptionDeleted(event: Stripe.Event, supabaseClient: any) {
  const subscription = event.data.object as Stripe.Subscription;
  logStep("Handling subscription deletion", { subscriptionId: subscription.id });

  try {
    await supabaseClient
      .from("subscribers")
      .update({
        status: 'canceled',
        subscription_end: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription.id);

    logStep("Subscription marked as canceled");
  } catch (error) {
    logStep("Error handling subscription deletion", { error: error.message });
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(
  event: Stripe.Event, 
  supabaseClient: any, 
  stripe: Stripe
) {
  const invoice = event.data.object as Stripe.Invoice;
  logStep("Handling successful payment", { invoiceId: invoice.id });

  try {
    if (invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      await handleSubscriptionChange({ 
        ...event, 
        data: { object: subscription } 
      }, supabaseClient, stripe);
    }
  } catch (error) {
    logStep("Error handling payment success", { error: error.message });
    throw error;
  }
}

async function handleInvoicePaymentFailed(event: Stripe.Event, supabaseClient: any) {
  const invoice = event.data.object as Stripe.Invoice;
  logStep("Handling failed payment", { invoiceId: invoice.id });

  try {
    if (invoice.subscription) {
      await supabaseClient
        .from("subscribers")
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", invoice.subscription);

      logStep("Subscription marked as past due");
    }
  } catch (error) {
    logStep("Error handling payment failure", { error: error.message });
    throw error;
  }
}