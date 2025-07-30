import React, { useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

type Event = {
  id: string;
  name: string;
  description: string | null;
  date_time: string;
  location_name: string | null;
  location_address: string | null;
  max_attendees: number | null;
  cover_photo_url: string | null;
  creator_id: string;
  status: string;
};

type RSVP = {
  id: string;
  user_id: string;
  event_id: string;
  response_status: string;
};

const ModernEventsCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    align: 'center',
    slidesToScroll: 1
  });
  
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  useEffect(() => {
    fetchEvents();
    if (user) {
      fetchUserRSVPs();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id, name, description, date_time, location_name, location_address,
          max_attendees, cover_photo_url, creator_id, status
        `)
        .eq('status', 'active')
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .limit(10);

      if (error) throw error;
      
      setEvents(data || []);
      
      // Fetch attendee counts for each event
      if (data) {
        const counts: Record<string, number> = {};
        for (const event of data) {
        const { count } = await supabase
          .from('rsvps')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('response_status', 'yes');
          
          counts[event.id] = count || 0;
        }
        setAttendeeCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRSVPs = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setRsvps(data || []);
    } catch (error) {
      console.error('Error fetching RSVPs:', error);
    }
  };

  const handleRSVP = async (eventId: string) => {
    if (!user || !profile) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to RSVP to events.",
        variant: "destructive"
      });
      return;
    }

    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // For now, skip payment logic since we're rebuilding subscription system

    const existingRSVP = rsvps.find(r => r.event_id === eventId);
    
    try {
      if (existingRSVP) {
        // Update existing RSVP
        const newStatus = existingRSVP.response_status === 'yes' ? 'no' : 'yes';
        
        const { error } = await supabase
          .from('rsvps')
          .update({ response_status: newStatus })
          .eq('id', existingRSVP.id);

        if (error) throw error;
        
        setRsvps(prev => prev.map(r => 
          r.id === existingRSVP.id 
            ? { ...r, response_status: newStatus }
            : r
        ));
        
        // Update attendee count
        setAttendeeCounts(prev => ({
          ...prev,
          [eventId]: prev[eventId] + (newStatus === 'yes' ? 1 : -1)
        }));
        
        toast({
          title: newStatus === 'yes' ? "RSVP Confirmed!" : "RSVP Cancelled",
          description: newStatus === 'yes' 
            ? "You're now attending this event." 
            : "Your RSVP has been cancelled."
        });
      } else {
        // Create new RSVP
        const { data, error } = await supabase
          .from('rsvps')
          .insert({
            user_id: user.id,
            event_id: eventId,
            response_status: 'yes'
          })
          .select()
          .single();

        if (error) throw error;
        
        setRsvps(prev => [...prev, data]);
        setAttendeeCounts(prev => ({
          ...prev,
          [eventId]: (prev[eventId] || 0) + 1
        }));
        
        toast({
          title: "RSVP Confirmed!",
          description: "You're now attending this event."
        });
      }
    } catch (error) {
      console.error('Error handling RSVP:', error);
      toast({
        title: "Error",
        description: "Failed to update RSVP. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePaymentSuccess = () => {
    fetchEvents();
    fetchUserRSVPs();
    setPaymentModalOpen(false);
    setSelectedEvent(null);
  };

  const getRSVPStatus = (eventId: string) => {
    const rsvp = rsvps.find(r => r.event_id === eventId);
    return rsvp?.response_status || null;
  };

  const isEventCreator = (event: Event) => {
    return user && event.creator_id === user.id;
  };

  if (loading) {
    return (
      <div className="relative w-full h-96 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-8 w-48 bg-white/20 rounded mx-auto"></div>
            <div className="h-4 w-32 bg-white/20 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="relative w-full h-96 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 flex items-center justify-center h-full text-center text-white">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">No Events Available</h2>
            <p className="text-white/80">Check back soon for upcoming dining experiences</p>
            <Button 
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              onClick={() => navigate('/create-event')}
            >
              Create Your Own Event
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Featured Events</h2>
          <p className="text-muted-foreground">Discover amazing dining experiences</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {events.map((event) => {
            const rsvpStatus = getRSVPStatus(event.id);
            const isCreator = isEventCreator(event);
            const attendeeCount = attendeeCounts[event.id] || 0;
            
            return (
              <div 
                key={event.id} 
                className="flex-none w-full max-w-md"
              >
                <Card className="relative h-96 overflow-hidden cursor-pointer group hover:shadow-2xl transition-all duration-300">
                  {/* Background Image with Overlay */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                    style={{
                      backgroundImage: event.cover_photo_url 
                        ? `url(${event.cover_photo_url})` 
                        : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
                  
                  {/* Content Overlay */}
                  <CardContent className="relative z-10 h-full flex flex-col justify-between p-6 text-white">
                    {/* Top Section - Creator Badge */}
                    <div className="flex justify-between items-start">
                      {isCreator && (
                        <Badge className="bg-peach-gold/90 text-black font-semibold">
                          You're hosting
                        </Badge>
                      )}
                      <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    </div>

                    {/* Bottom Section - Event Details */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-2 line-clamp-2">
                          {event.name}
                        </h3>
                        {event.description && (
                          <p className="text-white/80 text-sm line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {format(new Date(event.date_time), 'MMM dd')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {format(new Date(event.date_time), 'h:mm a')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 col-span-2">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{event.location_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {attendeeCount}/{event.max_attendees} attending
                          </span>
                        </div>

                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-white/10 text-white border-white/30 hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/event/${event.id}/details`);
                          }}
                        >
                          View Details
                        </Button>
                        
                        <Button
                          size="sm"
                          className={`flex-1 ${
                            user
                              ? rsvpStatus === 'no'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-white text-black hover:bg-white/90'
                              : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (user) {
                              handleRSVP(event.id);
                            } else {
                              navigate('/auth');
                            }
                          }}
                        >
                          {user 
                            ? (rsvpStatus === 'yes' ? "You're Going" : "RSVP")
                            : "Sign in to RSVP"
                          }
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default ModernEventsCarousel;