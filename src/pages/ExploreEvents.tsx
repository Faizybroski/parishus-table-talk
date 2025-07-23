import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Search, 
  Plus,
  Heart,
  UserCheck,
  Edit,
  Trash2,
  Eye,
  CreditCard
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import PaymentModal from '@/components/payment/PaymentModal';

interface Event {
  id: string;
  name: string;
  description: string;
  date_time: string;
  location_name: string;
  location_address?: string;
  cover_photo_url?: string;
  tags?: string[];
  max_attendees: number;
  creator_id: string;
  is_mystery_dinner: boolean;
  profiles?: {
    first_name?: string;
    last_name?: string;
    profile_photo_url?: string;
  };
  rsvps?: {
    id: string;
    status: string;
    user_id: string;
  }[];
  rsvp_count?: number;
  user_rsvp?: {
    id: string;
    status: string;
  }[];
}

const ExploreEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const getUserProfile = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        setUserProfileId(profile?.id || null);
        return profile?.id || null;
      } else {
        setUserProfileId(null);
        return null;
      }
    };
    
    getUserProfile().then((profileId) => {
      if (profileId) {
        fetchEvents(profileId);
      }
    });
  }, [user]);

  useEffect(() => {
    if (userProfileId) {
      fetchEvents(userProfileId);
    }
  }, [userProfileId]);

  const fetchEvents = async (profileId?: string) => {
    const currentProfileId = profileId || userProfileId;
    if (!currentProfileId) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles:creator_id (
            first_name,
            last_name,
            profile_photo_url
          ),
          rsvps (
            id,
            status,
            user_id
          )
        `)
        .eq('status', 'active')
        .order('date_time', { ascending: true });

      if (error) throw error;

      // Filter out events that user has already RSVPed to
      const eventsWithCounts = data?.map(event => ({
        ...event,
        rsvp_count: event.rsvps?.filter(r => r.status === 'confirmed').length || 0,
        user_rsvp: event.rsvps?.filter(r => r.user_id === currentProfileId) || []
      })).filter(event => {
        // Show only events that user has NOT RSVPed to
        const hasRSVP = event.rsvps?.some(r => r.user_id === currentProfileId && r.status === 'confirmed');
        return !hasRSVP;
      }) || [];

      setEvents(eventsWithCounts);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (eventId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to RSVP for events",
        variant: "destructive"
      });
      return;
    }

    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const hasRSVP = event?.user_rsvp && event.user_rsvp.length > 0;

    if (hasRSVP) {
      // Remove existing RSVP
      const confirmed = window.confirm("Are you sure you want to remove your RSVP?");
      if (!confirmed) return;

      try {
        if (!userProfileId) {
          throw new Error('Profile not found');
        }

        const { error } = await supabase
          .from('rsvps')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', userProfileId);

        if (error) throw error;

        toast({
          title: "RSVP removed",
          description: "You're no longer attending this event",
        });

        fetchEvents();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to remove RSVP",
          variant: "destructive"
        });
      }
    } else {
      // Open payment modal for new RSVP
      setSelectedEvent(event);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment successful!",
      description: "Your RSVP has been confirmed. Check your email for details.",
    });
    
    // Refresh events data
    setTimeout(() => {
      fetchEvents();
    }, 2000);
  };

  const deleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('creator_id', userProfileId);

      if (error) throw error;

      toast({
        title: "Event deleted",
        description: "Your event has been deleted successfully",
      });

      fetchEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive"
      });
    }
  };

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const EventCards = ({ events }: { events: Event[] }) => {
    if (events.length === 0) {
      return (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground mb-4">
            No events available at the moment
          </p>
          <Button 
            onClick={() => navigate('/create-event')}
            className="bg-peach-gold hover:bg-peach-gold/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          const eventDate = new Date(event.date_time);
          const isCreator = event.creator_id === userProfileId;
          const rsvps = event.rsvps || [];
          const hasRSVP = rsvps.some(rsvp => rsvp.user_id === userProfileId);
          const confirmedRSVPs = rsvps.filter(rsvp => rsvp.status === 'confirmed');
          const spotsLeft = event.max_attendees - confirmedRSVPs.length;
          const isUpcoming = eventDate > new Date();

          return (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {event.cover_photo_url && (
                <div className="aspect-video w-full overflow-hidden">
                  <img 
                    src={event.cover_photo_url} 
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{event.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {event.description}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {event.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {event.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{event.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant={isUpcoming ? "default" : "secondary"}>
                    {isUpcoming ? 'Upcoming' : 'Past'}
                  </Badge>
                  {isCreator && (
                    <Badge variant="outline" className="text-xs">
                      Creator
                    </Badge>
                  )}
                  {hasRSVP && !isCreator && (
                    <Badge variant="default" className="text-xs bg-sage-green">
                      Going
                    </Badge>
                  )}
                  {spotsLeft > 0 && spotsLeft <= 3 && (
                    <Badge variant="outline" className="text-xs">
                      {spotsLeft} spots left
                    </Badge>
                  )}
                  {spotsLeft === 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Full
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="py-0">
                {/* Date and Time */}
                <div className="flex items-center space-x-2 mb-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{eventDate.toLocaleDateString()}</span>
                  <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                  <span className="text-sm">{eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Location */}
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{event.location_name}</span>
                </div>

                {/* Host */}
                <div className="flex items-center space-x-2 mb-3">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={event.profiles?.profile_photo_url} />
                    <AvatarFallback className="text-xs">
                      {event.profiles?.first_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {event.profiles?.first_name} {event.profiles?.last_name}
                  </span>
                </div>

                {/* Attendees */}
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{event.rsvp_count}/{event.max_attendees} attendees</span>
                </div>
              </CardContent>

              <CardFooter className="pt-4">
                <div className="flex space-x-2 w-full">
                  {/* Details Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/event/${event.id}/details`)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Details
                  </Button>

                  {/* Edit Button (only for creators) */}
                  {isCreator && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/event/${event.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Delete Button (only for creators) */}
                  {isCreator && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteEvent(event.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}

                  {/* RSVP Button (for all events with available spots) */}
                  {spotsLeft > 0 && (
                    <Button
                      onClick={() => handleRSVP(event.id)}
                      variant={hasRSVP ? "default" : "outline"}
                      size="sm"
                      className={hasRSVP ? "bg-sage-green hover:bg-sage-green/90" : ""}
                    >
                      {hasRSVP ? (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Going
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay & RSVP
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin mx-auto border-4 border-peach-gold border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Explore Events</h1>
              <p className="text-muted-foreground mt-1">
                Discover and join dining experiences
              </p>
            </div>
            <Button 
              onClick={() => navigate('/create-event')}
              className="bg-peach-gold hover:bg-peach-gold/90 mt-4 sm:mt-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-6">
            <EventCards events={filteredEvents} />
          </div>
        </div>

        {/* Payment Modal */}
        {selectedEvent && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            event={selectedEvent}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}

      </div>
    </div>
  );
};

export default ExploreEvents;
