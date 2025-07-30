import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionStatus {
  subscribed: boolean;
  plan_name?: string;
  subscription_end?: string;
  status?: 'active' | 'inactive' | 'canceled' | 'past_due';
  loading: boolean;
}

export const useSubscription = () => {
  const { user, session } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    loading: true
  });

  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      setSubscriptionStatus({ subscribed: false, loading: false });
    }
  }, [user]);

  const checkSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        }
      });

      if (error) throw error;

      setSubscriptionStatus({
        subscribed: data.subscribed || false,
        plan_name: data.plan_name,
        subscription_end: data.subscription_end,
        status: data.subscribed ? 'active' : 'inactive',
        loading: false
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionStatus({
        subscribed: false,
        loading: false
      });
    }
  };

  const canAttendEvent = async (eventCreatorRole?: string): Promise<boolean> => {
    // If user is subscribed, they can attend unlimited events
    if (subscriptionStatus.subscribed) {
      return true;
    }

    // For non-subscribers, check if this is an admin-hosted event
    if (eventCreatorRole === 'admin' || eventCreatorRole === 'superadmin') {
      // Check how many admin-hosted events they've attended this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data: rsvpCount, error } = await supabase
        .from('rsvps')
        .select(`
          id,
          events!inner(creator_id, profiles!inner(role))
        `)
        .eq('user_id', user?.id)
        .gte('created_at', startOfMonth.toISOString())
        .in('events.profiles.role', ['admin', 'superadmin']);

      if (error) {
        console.error('Error checking RSVP count:', error);
        return false;
      }

      // Non-subscribers can only attend 1 admin-hosted event per month
      return (rsvpCount?.length || 0) < 1;
    }

    // For user-hosted events, no restrictions
    return true;
  };

  return {
    ...subscriptionStatus,
    refetch: checkSubscription,
    canAttendEvent
  };
};