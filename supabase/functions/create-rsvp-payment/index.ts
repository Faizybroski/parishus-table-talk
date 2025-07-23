import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-RSVP-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { eventId, billingInfo } = await req.json();
    if (!eventId) throw new Error("Event ID is required");
    logStep("Request data received", { eventId, billingEmail: billingInfo?.email });

    // Get event details
    const { data: eventData, error: eventError } = await supabaseClient
      .from('events')
      .select('id, name, date_time, max_attendees')
      .eq('id', eventId)
      .single();

    if (eventError) throw new Error(`Event not found: ${eventError.message}`);
    logStep("Event found", { eventName: eventData.name });

    // Check if user already has RSVP
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      const { data: existingRsvp } = await supabaseClient
        .from('rsvps')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', profile.id)
        .single();

      if (existingRsvp) {
        throw new Error("You already have an RSVP for this event");
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: billingInfo?.email || user.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: billingInfo?.email || user.email,
        name: billingInfo?.fullName,
        address: billingInfo ? {
          line1: billingInfo.address,
          city: billingInfo.city,
          country: billingInfo.country,
          postal_code: billingInfo.zipCode,
        } : undefined,
      });
      customerId = customer.id;
      logStep("New customer created", { customerId });
    }

    // Create checkout session for RSVP payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `RSVP: ${eventData.name}`,
              description: `Event on ${new Date(eventData.date_time).toLocaleDateString()}`,
            },
            unit_amount: 2500, // $25.00 in cents - you can make this configurable
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/event-rsvp/${eventId}?payment=success`,
      cancel_url: `${req.headers.get("origin")}/event-rsvp/${eventId}?payment=cancelled`,
      metadata: {
        eventId,
        userId: user.id,
        userEmail: user.email,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-rsvp-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});