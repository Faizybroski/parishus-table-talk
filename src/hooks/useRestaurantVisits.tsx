import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface TrackVisitParams {
  restaurant_name: string;
  latitude: number;
  longitude: number;
  restaurant_id?: string;
  visited_at?: string;
}

export const useRestaurantVisits = () => {
  const [isTracking, setIsTracking] = useState(false);
  const { user } = useAuth();

  const trackVisit = async (params: TrackVisitParams) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to track restaurant visits",
        variant: "destructive"
      });
      return { success: false, error: 'Not authenticated' };
    }

    setIsTracking(true);
    try {
      const response = await supabase.functions.invoke('track-restaurant-visit', {
        body: {
          restaurant_name: params.restaurant_name,
          latitude: params.latitude,
          longitude: params.longitude,
          restaurant_id: params.restaurant_id,
          visited_at: params.visited_at || new Date().toISOString()
        }
      });

      if (response.error) throw response.error;

      const result = response.data;
      toast({
        title: "Visit tracked!",
        description: `Your visit to ${params.restaurant_name} has been recorded.${
          result.crossed_paths_found > 0 
            ? ` Found ${result.crossed_paths_found} potential crossed paths!` 
            : ''
        }`,
      });

      return { success: true, data: result };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to track visit",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setIsTracking(false);
    }
  };

  const trackCurrentLocation = async (restaurantName: string) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      if (!navigator.geolocation) {
        toast({
          title: "Location not supported",
          description: "Geolocation is not supported by this browser",
          variant: "destructive"
        });
        resolve({ success: false, error: 'Geolocation not supported' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const result = await trackVisit({
            restaurant_name: restaurantName,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          resolve(result);
        },
        (error) => {
          toast({
            title: "Location error",
            description: "Unable to get your current location",
            variant: "destructive"
          });
          resolve({ success: false, error: 'Location access denied' });
        }
      );
    });
  };

  return {
    trackVisit,
    trackCurrentLocation,
    isTracking
  };
};