import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type Restaurant = Database['public']['Tables']['restaurants']['Row'];
export type RestaurantInsert = Database['public']['Tables']['restaurants']['Insert'];
export type RestaurantUpdate = Database['public']['Tables']['restaurants']['Update'];

export const useRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    if (user && profile) {
      fetchRestaurants();
    } else {
      setRestaurants([]);
      setLoading(false);
    }
  }, [user, profile]);

  const fetchRestaurants = async () => {
    if (!user || !profile) return;

    try {
      let query = supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      // Role-based filtering happens at the database level via RLS
      const { data, error } = await query;

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const createRestaurant = async (restaurant: Omit<RestaurantInsert, 'creator_id'>) => {
    if (!user) return { data: null, error: new Error('User not authenticated') };

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .insert({
          ...restaurant,
          creator_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      // Refresh the list
      await fetchRestaurants();
      
      return { data, error: null };
    } catch (error) {
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
        .select()
        .single();

      if (error) throw error;
      
      // Refresh the list
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
      
      // Refresh the list
      await fetchRestaurants();
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const canEdit = (restaurant: Restaurant) => {
    if (!profile) return false;
    return profile.role === 'superadmin' || profile.role === 'admin' || restaurant.creator_id === user?.id;
  };

  const canDelete = (restaurant: Restaurant) => {
    if (!profile) return false;
    return profile.role === 'superadmin' || profile.role === 'admin' || restaurant.creator_id === user?.id;
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