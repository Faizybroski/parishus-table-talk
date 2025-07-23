import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type Restaurant = Database['public']['Tables']['restaurants']['Row'] & {
  creator?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
};
export type RestaurantInsert = Database['public']['Tables']['restaurants']['Insert'];
export type RestaurantUpdate = Database['public']['Tables']['restaurants']['Update'];

export const useRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    console.log('useRestaurants useEffect triggered');
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    console.log('fetchRestaurants called');
    console.log('Starting restaurant fetch...');
    try {
      let query = supabase
        .from('restaurants')
        .select(`
          *,
          creator:profiles!restaurants_creator_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // Role-based filtering happens at the database level via RLS
      const { data, error } = await query;
      console.log('Restaurant query executed', { data, error });

      if (error) throw error;
      // Transform the data to match our type expectations
      const transformedData = data?.map(restaurant => ({
        ...restaurant,
        creator: Array.isArray(restaurant.creator) ? restaurant.creator[0] : restaurant.creator
      })) || [];
      
      console.log('Transformed restaurant data', transformedData);
      setRestaurants(transformedData);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const createRestaurant = async (restaurant: Omit<RestaurantInsert, 'creator_id'>) => {
    if (!user || !profile) return { data: null, error: new Error('User not authenticated or profile not found') };

    try {
      // Double check that the profile exists in the database
      const { data: profileCheck, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', profile.id)
        .single();

      if (profileError || !profileCheck) {
        throw new Error('Profile not found in database. Please try refreshing the page.');
      }

      const { data, error } = await supabase
        .from('restaurants')
        .insert({
          ...restaurant,
          creator_id: profile.id  // Use profile.id instead of user.id
        })
        .select(`
          *,
          creator:profiles!restaurants_creator_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .single();

      if (error) throw error;
      
      // Trigger refresh events for immediate UI update
      localStorage.setItem('restaurantUpdated', Date.now().toString());
      window.dispatchEvent(new CustomEvent('restaurantUpdated'));
      
      // Refresh the list immediately
      await fetchRestaurants();
      
      return { data, error: null };
    } catch (error) {
      console.error('Error creating restaurant:', error);
      return { data: null, error };
    }
  };

  const updateRestaurant = async (id: string, updates: RestaurantUpdate) => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          creator:profiles!restaurants_creator_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .single();

      if (error) throw error;
      
      // Trigger refresh events for immediate UI update
      localStorage.setItem('restaurantUpdated', Date.now().toString());
      window.dispatchEvent(new CustomEvent('restaurantUpdated'));
      
      // Refresh the list immediately
      await fetchRestaurants();
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const deleteRestaurant = async (id: string) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Trigger refresh events for immediate UI update
      localStorage.setItem('restaurantUpdated', Date.now().toString());
      window.dispatchEvent(new CustomEvent('restaurantUpdated'));
      
      // Refresh the list immediately
      await fetchRestaurants();
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const canEdit = (restaurant: Restaurant) => {
    if (!profile) return false;
    return profile.role === 'superadmin' || profile.role === 'admin' || restaurant.creator_id === profile.id;
  };

  const canDelete = (restaurant: Restaurant) => {
    if (!profile) return false;
    return profile.role === 'superadmin' || profile.role === 'admin' || restaurant.creator_id === profile.id;
  };

  return {
    restaurants,
    loading,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    refetch: fetchRestaurants,
    canEdit,
    canDelete
  };
};