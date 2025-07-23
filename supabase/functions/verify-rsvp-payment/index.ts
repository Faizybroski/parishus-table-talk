import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-RSVP-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

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

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Session ID is required");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Session retrieved", { 
      sessionId, 
      paymentStatus: session.payment_status,
      metadata: session.metadata 
    });

    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    const { eventId, userId } = session.metadata;
    if (!eventId || !userId || userId !== user.id) {
      throw new Error("Invalid session metadata");
    }

    // Get user's profile ID
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError) throw profileError;

    // Check if RSVP already exists
    const { data: existingRsvp } = await supabaseClient
      .from('rsvps')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', profile.id)
      .single();

    if (existingRsvp) {
      logStep("RSVP already exists", { rsvpId: existingRsvp.id });
      return new Response(JSON.stringify({ 
        success: true, 
        message: "RSVP already exists",
        rsvpId: existingRsvp.id 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create RSVP
    const { data: rsvpData, error: rsvpError } = await supabaseClient
      .from('rsvps')
      .insert({
        event_id: eventId,
        user_id: profile.id,
        response_status: 'yes'
      })
      .select()
      .single();

    if (rsvpError) throw rsvpError;
    logStep("RSVP created", { rsvpId: rsvpData.id });

    // Record payment
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        amount: session.amount_total,
        currency: session.currency,
        status: 'completed',
        stripe_customer_id: session.customer,
        plan: 'rsvp_payment'
      });

    if (paymentError) {
      logStep("Warning: Payment record failed", { error: paymentError.message });
    } else {
      logStep("Payment recorded successfully");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "RSVP created successfully after payment verification",
      rsvpId: rsvpData.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-rsvp-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});