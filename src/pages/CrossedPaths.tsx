import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Calendar, Users, User, Utensils, Heart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import InviteToPrivateDinnerModal from '@/components/invitations/InviteToPrivateDinnerModal';

interface CrossedPath {
  id: string;
  matched_at: string;
  location_name: string;
  is_active: boolean;
  user1_id: string;
  user2_id: string;
  total_crosses: number;
  locations: string[];
  location_details?: Array<{
    name: string;
    address?: string;
    cross_count: number;
  }>;
  matched_user: {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    profile_photo_url: string;
    job_title: string;
    location_city: string;
    dining_style: string;
    dietary_preferences: string[];
    gender_identity: string;
  };
}

const CrossedPaths = () => {
  const [crossedPaths, setCrossedPaths] = useState<CrossedPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<CrossedPath['matched_user'] | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedCrossedPath, setSelectedCrossedPath] = useState<CrossedPath | null>(null);
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
      // First get basic crossed paths using proper foreign key joins
      const { data: crossedPathsData, error } = await supabase
        .from('crossed_paths')
        .select(`
          *,
          user1:profiles!crossed_paths_user1_id_fkey(
            id, user_id, first_name, last_name, profile_photo_url, job_title, 
            location_city, dining_style, dietary_preferences, gender_identity
          ),
          user2:profiles!crossed_paths_user2_id_fkey(
            id, user_id, first_name, last_name, profile_photo_url, job_title, 
            location_city, dining_style, dietary_preferences, gender_identity
          )
        `)
        .or(`user1_id.eq.${profile.user_id},user2_id.eq.${profile.user_id}`)
        .eq('is_active', true)
        .order('matched_at', { ascending: false });

      if (error) {
        console.error('Error fetching crossed paths:', error);
        setCrossedPaths([]);
        return;
      }

      // Now get aggregated data from crossed_paths_log for each pair
      const enrichedPaths = await Promise.all(
        (crossedPathsData || []).map(async (path: any) => {
          const otherUserId = path.user1_id === profile.user_id ? path.user2.user_id : path.user1.user_id;
          const userAId = profile.user_id < otherUserId ? profile.user_id : otherUserId;
          const userBId = profile.user_id < otherUserId ? otherUserId : profile.user_id;

          // Get all crossed path logs for this user pair
          const { data: logData } = await supabase
            .from('crossed_paths_log')
            .select('restaurant_name, cross_count')
            .eq('user_a_id', userAId)
            .eq('user_b_id', userBId);

          const locations = logData?.map(log => log.restaurant_name).filter(Boolean) || [];
          const totalCrosses = logData?.reduce((sum, log) => sum + (log.cross_count || 1), 0) || 1;

          // Create location_details array with proper structure
          const locationDetails = logData?.reduce((acc, log) => {
            if (!log.restaurant_name) return acc;
            
            const existing = acc.find(item => item.name === log.restaurant_name);
            if (existing) {
              existing.cross_count += log.cross_count || 1;
            } else {
              acc.push({
                name: log.restaurant_name,
                cross_count: log.cross_count || 1
              });
            }
            return acc;
          }, [] as Array<{ name: string; cross_count: number }>) || [];

          return {
            ...path,
            matched_user: path.user1_id === profile.user_id ? path.user2 : path.user1,
            total_crosses: totalCrosses,
            locations: [...new Set(locations)], // Remove duplicates
            location_details: locationDetails
          };
        })
      );

      setCrossedPaths(enrichedPaths);
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

  const handleInviteToDinner = (path: CrossedPath) => {
    setSelectedCrossedPath(path);
    setShowInviteModal(true);
  };

  const viewProfile = (user: CrossedPath['matched_user']) => {
    setSelectedUserProfile(user);
    setShowProfileModal(true);
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
              People you've crossed paths with at restaurants within the last 14 days
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
                  Visit restaurants to discover people you've crossed paths with. Enable tracking in your Profile settings.
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
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(path.matched_at).toLocaleDateString()}
                            </div>
                          </div>
                           
                           {/* Show crossing count and locations */}
                           <div className="mt-3 space-y-2">
                             <Badge variant="outline" className="text-xs font-medium">
                               Crossed paths {path.total_crosses}x
                             </Badge>
                             {path.locations.length > 0 && (
                               <div className="flex items-start space-x-1">
                                 <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                 <div className="text-sm text-muted-foreground">
                                   <span className="font-medium">Locations:</span>{' '}
                                   {path.locations.join(', ')}
                                 </div>
                               </div>
                             )}
                           </div>
                          {path.matched_user.location_city && (
                            <Badge variant="secondary" className="mt-2">
                              {path.matched_user.location_city}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Button
                          onClick={() => viewProfile(path.matched_user)}
                          variant="outline"
                          size="sm"
                        >
                          View Profile
                        </Button>
                        <Button
                          onClick={() => handleInviteToDinner(path)}
                          className="bg-peach-gold hover:bg-peach-gold/90 text-background"
                          size="sm"
                        >
                          Invite to Dinner
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Profile Modal */}
        <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">User Profile</DialogTitle>
            </DialogHeader>
            {selectedUserProfile && (
              <div className="space-y-6">
                {/* Header Section with Photo and Basic Info */}
                <div className="flex flex-col items-center space-y-4 p-6 bg-gradient-to-br from-peach-gold/10 to-background rounded-lg border">
                  <Avatar className="h-24 w-24 ring-4 ring-peach-gold/20">
                    <AvatarImage src={selectedUserProfile.profile_photo_url} />
                    <AvatarFallback className="bg-peach-gold text-background text-2xl font-bold">
                      {selectedUserProfile.first_name?.[0]}
                      {selectedUserProfile.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-foreground">
                      {selectedUserProfile.first_name} {selectedUserProfile.last_name}
                    </h3>
                    {selectedUserProfile.job_title && (
                      <p className="text-lg text-muted-foreground font-medium mt-1">
                        {selectedUserProfile.job_title}
                      </p>
                    )}
                    {selectedUserProfile.location_city && (
                      <div className="flex items-center justify-center text-muted-foreground mt-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="text-sm">{selectedUserProfile.location_city}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Detailed Information Cards */}
                <div className="grid gap-4">
                  {selectedUserProfile.dining_style && (
                    <Card className="p-4 bg-card border-border">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-peach-gold/10 rounded-lg">
                          <Utensils className="h-5 w-5 text-peach-gold" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground text-sm uppercase tracking-wide">
                            Dining Style
                          </p>
                          <p className="text-foreground text-lg font-medium capitalize mt-1">
                            {selectedUserProfile.dining_style.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {selectedUserProfile.dietary_preferences && selectedUserProfile.dietary_preferences.length > 0 && (
                    <Card className="p-4 bg-card border-border">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-peach-gold/10 rounded-lg">
                          <Heart className="h-5 w-5 text-peach-gold" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground text-sm uppercase tracking-wide mb-2">
                            Dietary Preferences
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedUserProfile.dietary_preferences.map((pref, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                className="bg-peach-gold/10 text-peach-gold border-peach-gold/20 hover:bg-peach-gold/20 px-3 py-1"
                              >
                                {pref.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

                  {selectedUserProfile.gender_identity && (
                    <Card className="p-4 bg-card border-border">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-peach-gold/10 rounded-lg">
                          <User className="h-5 w-5 text-peach-gold" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground text-sm uppercase tracking-wide">
                            Gender Identity
                          </p>
                          <p className="text-foreground text-lg font-medium capitalize mt-1">
                            {selectedUserProfile.gender_identity.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-3 pt-4">
                  <Button 
                    onClick={() => {
                      setShowProfileModal(false);
                      const path = crossedPaths.find(p => p.matched_user.user_id === selectedUserProfile?.user_id);
                      if (path) handleInviteToDinner(path);
                    }}
                    className="w-full bg-peach-gold hover:bg-peach-gold/90 text-background font-semibold py-3 text-lg"
                    size="lg"
                  >
                    <Utensils className="h-5 w-5 mr-2" />
                    Invite to Private Dinner
                  </Button>
                  <Button 
                    onClick={() => setShowProfileModal(false)}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Close Profile
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Invite to Private Dinner Modal */}
        <InviteToPrivateDinnerModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          crossedPath={selectedCrossedPath}
          currentUserId={user?.id || ''}
        />
      </div>
    </div>
  );
};

export default CrossedPaths;