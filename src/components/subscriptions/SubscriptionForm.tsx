import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  stripe_price_id?: string;
}

interface SubscriptionFormProps {
  plan: SubscriptionPlan;
  onSuccess: () => void;
  onCancel: () => void;
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  plan,
  onSuccess,
  onCancel
}) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  React.useEffect(() => {
    if (plan.stripe_price_id) {
      createSubscription();
    }
  }, [plan.stripe_price_id]);

  const createSubscription = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          price_id: plan.stripe_price_id
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        }
      });

      if (error) throw error;
      setClientSecret(data.client_secret);
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to initialize payment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/subscriptions?success=true`,
      },
      redirect: 'if_required'
    });

    if (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong with your payment",
        variant: "destructive"
      });
    } else {
      // Payment succeeded
      onSuccess();
    }

    setLoading(false);
  };

  if (!clientSecret) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Initializing payment...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />
          
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!stripe || loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `Subscribe for $${plan.price}/${plan.interval}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SubscriptionForm;