import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RestaurantVisitRequest {
  restaurant_id?: string;
  restaurant_name: string;
  latitude: number;
  longitude: number;
  visited_at?: string;
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

    const { restaurant_id, restaurant_name, latitude, longitude, visited_at }: RestaurantVisitRequest = await req.json();

    console.log('Tracking restaurant visit for user:', user.id);

    // Check if user has opted in to crossed paths tracking
    const { data: profile } = await supabase
      .from('profiles')
      .select('allow_crossed_paths_tracking')
      .eq('user_id', user.id)
      .single();

    if (!profile?.allow_crossed_paths_tracking) {
      console.log('User has not opted in to crossed paths tracking');
      return new Response(JSON.stringify({ message: 'Tracking disabled by user preference' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Record the restaurant visit
    const { data: visit, error: visitError } = await supabase
      .from('restaurant_visits')
      .insert({
        user_id: user.id,
        restaurant_id,
        restaurant_name,
        latitude,
        longitude,
        visited_at: visited_at || new Date().toISOString()
      })
      .select()
      .single();

    if (visitError) {
      console.error('Error recording visit:', visitError);
      throw visitError;
    }

    console.log('Visit recorded:', visit);

    // Find potential crossed paths - users who visited the same or nearby restaurants within 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Look for visits to the same restaurant
    let potentialMatches = [];
    if (restaurant_id) {
      const { data: sameRestaurantVisits } = await supabase
        .from('restaurant_visits')
        .select(`
          user_id,
          visited_at,
          profiles!inner(
            user_id,
            first_name,
            last_name,
            allow_crossed_paths_tracking
          )
        `)
        .eq('restaurant_id', restaurant_id)
        .neq('user_id', user.id)
        .gte('visited_at', fourteenDaysAgo.toISOString())
        .eq('profiles.allow_crossed_paths_tracking', true);

      if (sameRestaurantVisits) {
        potentialMatches = sameRestaurantVisits;
      }
    }

    // Also look for visits to nearby locations (within ~100 meters)
    const { data: nearbyVisits } = await supabase
      .from('restaurant_visits')
      .select(`
        user_id,
        visited_at,
        latitude,
        longitude,
        restaurant_name,
        profiles!inner(
          user_id,
          first_name,
          last_name,
          allow_crossed_paths_tracking
        )
      `)
      .neq('user_id', user.id)
      .gte('visited_at', fourteenDaysAgo.toISOString())
      .eq('profiles.allow_crossed_paths_tracking', true);

    if (nearbyVisits) {
      // Filter by distance (approximately 100 meters)
      const nearby = nearbyVisits.filter(visit => {
        if (!visit.latitude || !visit.longitude) return false;
        const distance = calculateDistance(latitude, longitude, visit.latitude, visit.longitude);
        return distance <= 0.1; // 0.1 km = 100 meters
      });
      potentialMatches = [...potentialMatches, ...nearby];
    }

    console.log('Found potential matches:', potentialMatches.length);

    // Process crossed paths
    for (const match of potentialMatches) {
      const otherUserId = match.user_id;
      
      // Ensure consistent ordering for user pairs
      const userAId = user.id < otherUserId ? user.id : otherUserId;
      const userBId = user.id < otherUserId ? otherUserId : user.id;

      // Check if this crossed path already exists
      const { data: existingCrossedPath } = await supabase
        .from('crossed_paths_log')
        .select('*')
        .eq('user_a_id', userAId)
        .eq('user_b_id', userBId)
        .eq('restaurant_id', restaurant_id || '')
        .gte('date_crossed', fourteenDaysAgo.toISOString())
        .single();

      if (existingCrossedPath) {
        // Update cross count
        await supabase
          .from('crossed_paths_log')
          .update({ 
            cross_count: existingCrossedPath.cross_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCrossedPath.id);
      } else {
        // Create new crossed path log
        await supabase
          .from('crossed_paths_log')
          .insert({
            user_a_id: userAId,
            user_b_id: userBId,
            restaurant_id: restaurant_id || null,
            restaurant_name,
            location_lat: latitude,
            location_lng: longitude,
            cross_count: 1
          });

        // Also create/update the main crossed_paths table for the UI
        const { data: existingPath } = await supabase
          .from('crossed_paths')
          .select('*')
          .eq('user1_id', userAId)
          .eq('user2_id', userBId)
          .single();

        if (!existingPath) {
          await supabase
            .from('crossed_paths')
            .insert({
              user1_id: userAId,
              user2_id: userBId,
              location_name: restaurant_name,
              location_lat: latitude,
              location_lng: longitude,
              is_active: true
            });
        }
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Restaurant visit tracked successfully',
      crossed_paths_found: potentialMatches.length 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in track-restaurant-visit function:', error);
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