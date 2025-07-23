import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Users, 
  MapPin, 
  Calendar,
  Plus,
  Star,
  Heart,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EventsCarousel from '@/components/events/EventsCarousel';

const Dashboard = () => {
  const navigate = useNavigate();

  // Mock data - this will be replaced with real data from Supabase
  const nextMysteryDinner = {
    id: 1,
    name: "Thursday Mystery Dinner",
    date: "2024-01-25",
    time: "7:00 PM",
    location: "Downtown District",
    seatsLeft: 3,
    totalSeats: 8
  };

  const upcomingEvents = [
    {
      id: 1,
      name: "Wine & Dine Social",
      date: "2024-01-22",
      time: "6:30 PM",
      location: "Vineyard Terrace",
      attendees: 6,
      isCreator: false
    },
    {
      id: 2,
      name: "Foodie Adventure",
      date: "2024-01-28",
      time: "7:30 PM",
      location: "Local Market",
      attendees: 4,
      isCreator: true
    }
  ];

  const crossedPaths = [
    {
      id: 1,
      name: "Sarah Chen",
      location: "Coffee District",
      matchedAt: "2 hours ago",
      avatar: null
    },
    {
      id: 2,
      name: "Michael Rodriguez",
      location: "Art Gallery",
      matchedAt: "1 day ago",
      avatar: null
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
              <p className="text-muted-foreground mt-1">
                Ready for your next dining adventure?
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

          {/* Featured Admin Events Carousel */}
          <EventsCarousel />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Events */}
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Upcoming Events
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/events')}
                  >
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center space-x-4 p-4 bg-dark-surface rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{event.name}</h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {event.date}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {event.time}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {event.location}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={event.isCreator ? "default" : "secondary"}>
                        {event.isCreator ? "Creator" : "Attending"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {event.attendees} attending
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Crossed Paths */}
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Heart className="h-5 w-5 mr-2 text-sage-green" />
                    Crossed Paths
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/crossed-paths')}
                  >
                    View All
                  </Button>
                </CardTitle>
                <CardDescription>
                  People you've encountered at similar places
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {crossedPaths.map((match) => (
                  <div key={match.id} className="flex items-center space-x-4 p-4 bg-dark-surface rounded-lg">
                    <div className="h-10 w-10 bg-sage-green/20 rounded-full flex items-center justify-center">
                      <span className="text-sage-green font-semibold">
                        {match.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{match.name}</h3>
                      <div className="flex items-center space-x-2 mt-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{match.location}</span>
                        <span>•</span>
                        <span>{match.matchedAt}</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-sage-green text-sage-green hover:bg-sage-green/10"
                    >
                      Invite
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-card border-border cursor-pointer hover:shadow-glow transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 bg-peach-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-6 w-6 text-peach-gold" />
                </div>
                <h3 className="font-semibold mb-2">Create Event</h3>
                <p className="text-sm text-muted-foreground">Host your own dining experience</p>
              </CardContent>
            </Card>

            <Card 
              className="shadow-card border-border cursor-pointer hover:shadow-glow transition-shadow"
              onClick={() => navigate('/explore')}
            >
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 bg-sage-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-sage-green" />
                </div>
                <h3 className="font-semibold mb-2">Explore Events</h3>
                <p className="text-sm text-muted-foreground">Find dining events near you</p>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border cursor-pointer hover:shadow-glow transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 bg-mystery-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-mystery-purple" />
                </div>
                <h3 className="font-semibold mb-2">Give Feedback</h3>
                <p className="text-sm text-muted-foreground">Rate your recent experiences</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;