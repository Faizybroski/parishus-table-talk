import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { RestaurantSearchDropdown } from '@/components/restaurants/RestaurantSearchDropdown';
import { useRestaurants, Restaurant } from '@/hooks/useRestaurants';
import { useRestaurantVisits } from '@/hooks/useRestaurantVisits';

interface RestaurantVisitTrackerProps {
  onVisitTracked?: () => void;
}

const RestaurantVisitTracker: React.FC<RestaurantVisitTrackerProps> = ({ onVisitTracked }) => {
  const [open, setOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const { user } = useAuth();
  const { restaurants, loading: restaurantsLoading } = useRestaurants();
  const { trackVisit, isTracking } = useRestaurantVisits();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRestaurant) {
      toast({
        title: "Error",
        description: "Please select a restaurant",
        variant: "destructive"
      });
      return;
    }

    // Fix date handling - ensure we're using the correct date
    const visitDateTime = new Date(visitDate + 'T12:00:00.000Z'); // Use noon UTC to avoid timezone issues
    
    const result = await trackVisit({
      restaurant_id: selectedRestaurant.id,
      restaurant_name: selectedRestaurant.name,
      latitude: selectedRestaurant.latitude || 0,
      longitude: selectedRestaurant.longitude || 0,
      visited_at: visitDateTime.toISOString()
    });

    if (result.success) {
      // Reset form
      setSelectedRestaurant(null);
      setVisitDate(new Date().toISOString().split('T')[0]);
      setOpen(false);
      onVisitTracked?.();
    }
  };

  const handleRestaurantSelect = (restaurant: Restaurant | null) => {
    setSelectedRestaurant(restaurant);
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
            <Label>Restaurant</Label>
            <RestaurantSearchDropdown
              restaurants={restaurants}
              value={selectedRestaurant?.id}
              onSelect={handleRestaurantSelect}
              placeholder="Select a restaurant..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visited_at">Visit Date</Label>
            <Input
              id="visited_at"
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]} // Can't select future dates
              required
            />
          </div>

          {selectedRestaurant && (
            <div className="space-y-2">
              <Label>Location (Auto-filled)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Latitude</Label>
                  <Input
                    value={selectedRestaurant.latitude?.toString() || 'N/A'}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Longitude</Label>
                  <Input
                    value={selectedRestaurant.longitude?.toString() || 'N/A'}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>
          )}

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
              disabled={isTracking || !selectedRestaurant || restaurantsLoading}
              className="flex-1 bg-peach-gold hover:bg-peach-gold/90 text-background"
            >
              {isTracking ? 'Tracking...' : 'Track Visit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RestaurantVisitTracker;