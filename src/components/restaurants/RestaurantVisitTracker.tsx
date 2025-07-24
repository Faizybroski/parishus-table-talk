import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Clock, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface RestaurantVisitTrackerProps {
  onVisitTracked?: () => void;
}

const RestaurantVisitTracker: React.FC<RestaurantVisitTrackerProps> = ({ onVisitTracked }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    restaurant_name: '',
    latitude: '',
    longitude: '',
    visited_at: new Date().toISOString().split('T')[0] // Today's date
  });
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('track-restaurant-visit', {
        body: {
          restaurant_name: formData.restaurant_name,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          visited_at: new Date(formData.visited_at).toISOString()
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Visit tracked!",
        description: `Your visit to ${formData.restaurant_name} has been recorded.`,
      });

      setFormData({
        restaurant_name: '',
        latitude: '',
        longitude: '',
        visited_at: new Date().toISOString().split('T')[0]
      });
      setOpen(false);
      onVisitTracked?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to track visit",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
          toast({
            title: "Location detected",
            description: "Your current location has been added.",
          });
        },
        (error) => {
          toast({
            title: "Location error",
            description: "Unable to get your current location. Please enter coordinates manually.",
            variant: "destructive"
          });
        }
      );
    } else {
      toast({
        title: "Location not supported",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-peach-gold hover:bg-peach-gold/90 text-background">
          <Plus className="h-4 w-4 mr-2" />
          Track Visit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Track Restaurant Visit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="restaurant_name">Restaurant Name</Label>
            <Input
              id="restaurant_name"
              value={formData.restaurant_name}
              onChange={(e) => setFormData(prev => ({ ...prev, restaurant_name: e.target.value }))}
              placeholder="Enter restaurant name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visited_at">Visit Date</Label>
            <Input
              id="visited_at"
              type="date"
              value={formData.visited_at}
              onChange={(e) => setFormData(prev => ({ ...prev, visited_at: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Location</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={getCurrentLocation}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Use Current
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="latitude" className="text-xs">Latitude</Label>
                <Input
                  id="latitude"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                  placeholder="40.7128"
                  type="number"
                  step="any"
                  required
                />
              </div>
              <div>
                <Label htmlFor="longitude" className="text-xs">Longitude</Label>
                <Input
                  id="longitude"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                  placeholder="-74.0060"
                  type="number"
                  step="any"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-peach-gold hover:bg-peach-gold/90 text-background"
            >
              {loading ? 'Tracking...' : 'Track Visit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RestaurantVisitTracker;