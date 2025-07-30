import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import SubscriptionForm from '@/components/subscriptions/SubscriptionForm';

interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  interval: 'monthly' | 'yearly';
  stripe_price_id?: string;
  features: string[];
  is_active: boolean;
}

interface UserSubscription {
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  plan_name?: string;
  subscription_end?: string;
}

// We'll get the publishable key from settings
const stripePromise = loadStripe('pk_test_placeholder');

const Subscriptions = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchUserSubscription();
  }, [user]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subscription plans",
        variant: "destructive"
      });
    }
  };

  const fetchUserSubscription = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        }
      });

      if (error) throw error;
      
      if (data.subscribed) {
        setUserSubscription({
          status: 'active',
          plan_name: data.plan_name || 'Unknown Plan',
          subscription_end: data.subscription_end
        });
      } else {
        setUserSubscription({ status: 'inactive' });
      }
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      setUserSubscription({ status: 'inactive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (plan: SubscriptionPlan) => {
    if (!plan.stripe_price_id) {
      toast({
        title: "Error",
        description: "This plan is not properly configured for payments",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedPlan(plan);
    setShowPaymentForm(true);
  };

  const handleSubscriptionSuccess = () => {
    setShowPaymentForm(false);
    setSelectedPlan(null);
    fetchUserSubscription();
    toast({
      title: "Success!",
      description: "Your subscription has been activated"
    });
  };

  const handleCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        }
      });

      if (error) throw error;
      
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open customer portal",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'canceled':
        return 'destructive';
      case 'past_due':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (showPaymentForm && selectedPlan) {
    return (
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setShowPaymentForm(false)}
            className="mb-4"
          >
            ← Back to Plans
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>{selectedPlan.name}</CardTitle>
              <CardDescription>
                ${selectedPlan.price}/{selectedPlan.interval}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Elements stripe={stripePromise}>
          <SubscriptionForm 
            plan={selectedPlan}
            onSuccess={handleSubscriptionSuccess}
            onCancel={() => setShowPaymentForm(false)}
          />
        </Elements>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground">
          Unlock unlimited access to exclusive dining experiences
        </p>
      </div>

      {userSubscription?.status === 'active' && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{userSubscription.plan_name}</p>
                <p className="text-sm text-muted-foreground">
                  {userSubscription.subscription_end && (
                    <>Renews on {new Date(userSubscription.subscription_end).toLocaleDateString()}</>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant={getStatusBadgeVariant(userSubscription.status)}>
                  {userSubscription.status}
                </Badge>
                <Button variant="outline" onClick={handleCustomerPortal}>
                  Manage Subscription
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan, index) => (
          <Card 
            key={plan.id} 
            className={`relative ${
              index === 1 ? 'border-primary shadow-lg scale-105' : ''
            }`}
          >
            {index === 1 && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="space-y-1">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/{plan.interval}</span>
              </div>
              {plan.description && (
                <CardDescription>{plan.description}</CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full" 
                variant={index === 1 ? "default" : "outline"}
                onClick={() => handleSubscribe(plan)}
                disabled={userSubscription?.status === 'active'}
              >
                {userSubscription?.status === 'active' 
                  ? 'Currently Subscribed' 
                  : 'Subscribe Now'
                }
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              No subscription plans available at the moment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Subscriptions;