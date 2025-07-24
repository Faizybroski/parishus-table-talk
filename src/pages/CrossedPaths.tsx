import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CrossedPath {
  id: string;
  matched_at: string;
  location_name: string;
  is_active: boolean;
  user1_id: string;
  user2_id: string;
  cross_count?: number;
  matched_user: {
    id: string;
    first_name: string;
    last_name: string;
    profile_photo_url: string;
    job_title: string;
    location_city: string;
  };
}

const CrossedPaths = () => {
  const [crossedPaths, setCrossedPaths] = useState<CrossedPath[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    if (profile) {
      fetchCrossedPaths();
    }
  }, [profile]);

  const fetchCrossedPaths = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('crossed_paths')
        .select(`
          *,
          user1:profiles!crossed_paths_user1_id_fkey(id, first_name, last_name, profile_photo_url, job_title, location_city),
          user2:profiles!crossed_paths_user2_id_fkey(id, first_name, last_name, profile_photo_url, job_title, location_city)
        `)
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
        .eq('is_active', true)
        .order('matched_at', { ascending: false });

      if (error) {
        console.error('Error fetching crossed paths:', error);
        setCrossedPaths([]);
        return;
      }

      const formattedPaths = data?.map((path: any) => ({
        ...path,
        matched_user: path.user1_id === profile.id ? path.user2 : path.user1
      })) || [];

      setCrossedPaths(formattedPaths);
    } catch (error: any) {
      console.error('Error in fetchCrossedPaths:', error);
      setCrossedPaths([]);
      toast({
        title: "Error",
        description: "Failed to load crossed paths",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createPrivateEvent = async (matchedUserId: string) => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          creator_id: profile.id,
          name: "Private Dinner Invitation",
          description: "A private dinner between crossed paths",
          date_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
          location_name: "TBD",
          max_attendees: 2,
          tags: ['private', 'crossed-paths'],
          is_mystery_dinner: true
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-RSVP both users
      await supabase.from('rsvps').insert([
        { event_id: data.id, user_id: profile.id, status: 'confirmed' },
        { event_id: data.id, user_id: matchedUserId, status: 'confirmed' }
      ]);

      toast({
        title: "Private event created!",
        description: "Your private dinner invitation has been sent.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create private event",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-card rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Crossed Paths</h1>
            <p className="text-muted-foreground mt-1">
              People you've crossed paths with at events
            </p>
          </div>

          {crossedPaths.length === 0 ? (
            <Card className="shadow-card border-border">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No crossed paths yet
                </h3>
                <p className="text-muted-foreground">
                  Attend events to discover people you've crossed paths with
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {crossedPaths.map((path) => (
                <Card key={path.id} className="shadow-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={path.matched_user.profile_photo_url} />
                          <AvatarFallback className="bg-peach-gold text-background">
                            {path.matched_user.first_name?.[0]}
                            {path.matched_user.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground">
                            {path.matched_user.first_name} {path.matched_user.last_name}
                          </h3>
                          {path.matched_user.job_title && (
                            <p className="text-muted-foreground">
                              {path.matched_user.job_title}
                            </p>
                          )}
                           <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-1" />
                              {path.location_name || 'Unknown location'}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(path.matched_at).toLocaleDateString()}
                            </div>
                          </div>
                           {/* Show crossing count */}
                           <div className="mt-2">
                             <Badge variant="outline" className="text-xs">
                               Crossed paths {path.cross_count || 1} time{(path.cross_count || 1) !== 1 ? 's' : ''}
                             </Badge>
                           </div>
                          {path.matched_user.location_city && (
                            <Badge variant="secondary" className="mt-2">
                              {path.matched_user.location_city}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => createPrivateEvent(path.matched_user.id)}
                        className="bg-peach-gold hover:bg-peach-gold/90 text-background"
                      >
                        Invite to Dinner
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrossedPaths;