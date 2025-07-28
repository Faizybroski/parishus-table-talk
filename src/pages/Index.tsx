import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Users } from 'lucide-react';
import ModernEventsCarousel from '@/components/events/ModernEventsCarousel';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold text-foreground">
              Discover Amazing <span className="text-primary">Dining Experiences</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with fellow food lovers and create unforgettable culinary memories
            </p>
          </div>

          {/* Modern Events Carousel */}
          <ModernEventsCarousel />
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Card className="shadow-card border-border cursor-pointer hover:shadow-glow transition-all duration-300 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Create Event</h3>
                <p className="text-muted-foreground">Host your own dining experience and bring people together</p>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border cursor-pointer hover:shadow-glow transition-all duration-300 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Explore Events</h3>
                <p className="text-muted-foreground">Find amazing dining events happening near you</p>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border cursor-pointer hover:shadow-glow transition-all duration-300 hover:scale-105">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Connect</h3>
                <p className="text-muted-foreground">Meet like-minded food enthusiasts in your area</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
