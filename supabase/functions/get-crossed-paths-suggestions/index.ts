import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuggestionRequest {
  restaurant_id?: string;
  location_lat?: number;
  location_lng?: number;
  dining_style?: string;
  dietary_theme?: string;
  limit?: number;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { restaurant_id, location_lat, location_lng, dining_style, dietary_theme, limit = 10 }: SuggestionRequest = await req.json();

    console.log('Getting crossed paths suggestions for user:', user.id);

    // Get the user's profile to ensure they have opted in
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile?.allow_crossed_paths_tracking) {
      return new Response(JSON.stringify({ suggestions: [], message: 'Crossed paths tracking disabled' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get crossed paths suggestions
    let suggestions = [];

    // Priority 1: Users who visited the same restaurant
    if (restaurant_id) {
      const { data: sameRestaurantUsers } = await supabase
        .from('crossed_paths_log')
        .select(`
          user_a_id,
          user_b_id,
          cross_count,
          restaurant_name,
          date_crossed,
          profiles_a:profiles!crossed_paths_log_user_a_id_fkey(
            id, user_id, first_name, last_name, profile_photo_url, job_title, 
            location_city, dining_style, dietary_preferences, allow_crossed_paths_tracking
          ),
          profiles_b:profiles!crossed_paths_log_user_b_id_fkey(
            id, user_id, first_name, last_name, profile_photo_url, job_title, 
            location_city, dining_style, dietary_preferences, allow_crossed_paths_tracking
          )
        `)
        .eq('restaurant_id', restaurant_id)
        .or(`user_a_id.eq.${profile.id},user_b_id.eq.${profile.id}`)
        .order('cross_count', { ascending: false })
        .limit(limit);

      if (sameRestaurantUsers) {
        suggestions = sameRestaurantUsers
          .filter((path: any) => {
            const otherProfile = path.user_a_id === profile.id ? path.profiles_b : path.profiles_a;
            return otherProfile?.allow_crossed_paths_tracking === true;
          })
          .map((path: any) => {
            const otherProfile = path.user_a_id === profile.id ? path.profiles_b : path.profiles_a;
            return {
              user_id: otherProfile.user_id,
              profile: otherProfile,
              cross_count: path.cross_count,
              restaurant_name: path.restaurant_name,
              last_crossed: path.date_crossed,
              suggestion_type: 'same_restaurant'
            };
          });
      }
    }

    // Priority 2: Users with similar preferences who have crossed paths nearby
    if (suggestions.length < limit && location_lat && location_lng) {
      const { data: nearbyUsers } = await supabase
        .from('crossed_paths_log')
        .select(`
          user_a_id,
          user_b_id,
          cross_count,
          restaurant_name,
          date_crossed,
          location_lat,
          location_lng,
          profiles_a:profiles!crossed_paths_log_user_a_id_fkey(
            id, user_id, first_name, last_name, profile_photo_url, job_title, 
            location_city, dining_style, dietary_preferences, allow_crossed_paths_tracking
          ),
          profiles_b:profiles!crossed_paths_log_user_b_id_fkey(
            id, user_id, first_name, last_name, profile_photo_url, job_title, 
            location_city, dining_style, dietary_preferences, allow_crossed_paths_tracking
          )
        `)
        .or(`user_a_id.eq.${profile.id},user_b_id.eq.${profile.id}`)
        .order('cross_count', { ascending: false })
        .limit(50); // Get more to filter by distance and preferences

      if (nearbyUsers) {
        const filteredNearby = nearbyUsers
          .filter((path: any) => {
            const otherProfile = path.user_a_id === profile.id ? path.profiles_b : path.profiles_a;
            if (!otherProfile?.allow_crossed_paths_tracking) return false;

            // Filter by distance (within 5km)
            if (path.location_lat && path.location_lng) {
              const distance = calculateDistance(location_lat, location_lng, path.location_lat, path.location_lng);
              if (distance > 5) return false;
            }

            // Filter by preferences compatibility
            let compatibilityScore = 0;
            if (dining_style && otherProfile.dining_style === dining_style) {
              compatibilityScore += 2;
            }
            if (dietary_theme && otherProfile.dietary_preferences?.includes(dietary_theme)) {
              compatibilityScore += 1;
            }

            return compatibilityScore > 0;
          })
          .map((path: any) => {
            const otherProfile = path.user_a_id === profile.id ? path.profiles_b : path.profiles_a;
            return {
              user_id: otherProfile.user_id,
              profile: otherProfile,
              cross_count: path.cross_count,
              restaurant_name: path.restaurant_name,
              last_crossed: path.date_crossed,
              suggestion_type: 'nearby_compatible'
            };
          })
          .slice(0, limit - suggestions.length);

        suggestions = [...suggestions, ...filteredNearby];
      }
    }

    // Remove duplicates based on user_id
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => s.user_id === suggestion.user_id)
    );

    return new Response(JSON.stringify({ 
      suggestions: uniqueSuggestions.slice(0, limit),
      total_found: uniqueSuggestions.length 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in get-crossed-paths-suggestions function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

serve(handler);