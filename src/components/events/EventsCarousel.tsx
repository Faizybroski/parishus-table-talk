import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAdminEvents } from '@/hooks/useAdminEvents';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const EventsCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 3 }
    }
  });
  const { events, loading } = useAdminEvents();
  const navigate = useNavigate();

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  if (loading) {
    return (
      <Card className="shadow-card border-border bg-gradient-mystery animate-pulse">
        <CardContent className="p-8">
          <div className="h-8 bg-white/20 rounded mb-4"></div>
          <div className="h-4 bg-white/20 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-white/20 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="shadow-card border-border bg-gradient-mystery">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Featured Events</h2>
          <p className="text-white/80 mb-6">No featured events available at the moment</p>
          <Button 
            className="bg-white text-mystery-purple hover:bg-white/90"
            onClick={() => navigate('/explore')}
          >
            Explore All Events
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card border-border bg-gradient-mystery">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Featured Admin Events</h2>
            <p className="text-white/80">Curated dining experiences from our team</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollPrev}
              className="text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={scrollNext}
              className="text-white hover:bg-white/20"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {events.map((event) => (
              <div 
                key={event.id} 
                className="flex-none w-full md:w-1/2 lg:w-1/3 min-w-0"
              >
                <Card 
                  className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 cursor-pointer hover-scale"
                  onClick={() => navigate(`/event/${event.id}/details`)}
                >
                  <CardContent className="p-6">
                    {event.cover_photo_url && (
                      <div className="mb-4 h-32 bg-cover bg-center rounded-lg overflow-hidden">
                        <img 
                          src={event.cover_photo_url} 
                          alt={event.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-white line-clamp-2 flex-1 mr-2">
                          {event.name}
                        </h3>
                        <Badge className="bg-peach-gold/20 text-peach-gold border-peach-gold/30 flex-shrink-0">
                          Featured
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-white/80 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {format(new Date(event.date_time), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {format(new Date(event.date_time), 'h:mm a')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{event.location_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">Up to {event.max_attendees} guests</span>
                        </div>
                      </div>
                      
                      {event.description && (
                        <p className="text-white/70 text-sm line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <Button 
            variant="outline"
            className="bg-white/10 text-white border-white/30 hover:bg-white/20"
            onClick={() => navigate('/explore')}
          >
            View All Events
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventsCarousel;