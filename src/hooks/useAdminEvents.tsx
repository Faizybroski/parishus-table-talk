import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type Event = Database['public']['Tables']['events']['Row'];

export const useAdminEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminEvents();
  }, []);

  const fetchAdminEvents = async () => {
    try {
      // First get all admin/superadmin profile IDs
      const { data: adminProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'superadmin']);

      if (profileError) throw profileError;

      const adminIds = adminProfiles?.map(p => p.id) || [];

      if (adminIds.length === 0) {
        setEvents([]);
        return;
      }

      // Then fetch events created by these admins
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('creator_id', adminIds)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching admin events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    events,
    loading,
    refetch: fetchAdminEvents
  };
};