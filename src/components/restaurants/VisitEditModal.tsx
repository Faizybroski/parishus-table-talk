import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Edit2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { RestaurantSearchDropdown } from '@/components/restaurants/RestaurantSearchDropdown';
import { useRestaurants, Restaurant } from '@/hooks/useRestaurants';
import { useRestaurantVisits } from '@/hooks/useRestaurantVisits';
import { supabase } from '@/integrations/supabase/client';

interface RestaurantVisit {
  id: string;
  restaurant_id?: string;
  restaurant_name: string;
  latitude: number;
  longitude: number;
  visited_at: string;
  created_at: string;
}

interface VisitEditModalProps {
  visit: RestaurantVisit;
  onVisitUpdated?: () => void;
}

const VisitEditModal: React.FC<VisitEditModalProps> = ({ visit, onVisitUpdated }) => {
  const [open, setOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [visitDate, setVisitDate] = useState(visit.visited_at.split('T')[0]);
  const [loading, setLoading] = useState(false);
  const { restaurants } = useRestaurants();
  const { trackVisit } = useRestaurantVisits();

  // Find the current restaurant if it exists
  React.useEffect(() => {
    if (visit.restaurant_id) {
      const restaurant = restaurants.find(r => r.id === visit.restaurant_id);
      if (restaurant) {
        setSelectedRestaurant(restaurant);
      }
    }
  }, [visit.restaurant_id, restaurants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurant) {
      toast({
        title: "Error",
        description: "Please select a restaurant",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Delete the old visit first
      const { error: deleteError } = await supabase
        .from('restaurant_visits')
        .delete()
        .eq('id', visit.id);

      if (deleteError) throw deleteError;

      // Create a new visit with updated data
      const visitDateTime = new Date(visitDate + 'T12:00:00.000Z');
      
      const result = await trackVisit({
        restaurant_id: selectedRestaurant.id,
        restaurant_name: selectedRestaurant.name,
        latitude: selectedRestaurant.latitude || 0,
        longitude: selectedRestaurant.longitude || 0,
        visited_at: visitDateTime.toISOString()
      });

      if (result.success) {
        setOpen(false);
        onVisitUpdated?.();
        toast({
          title: "Visit updated!",
          description: "Your restaurant visit has been updated.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update visit",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 w-8 p-0"
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Restaurant Visit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Restaurant</Label>
              <RestaurantSearchDropdown
                restaurants={restaurants}
                value={selectedRestaurant?.id}
                onSelect={setSelectedRestaurant}
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
                max={new Date().toISOString().split('T')[0]}
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
                disabled={loading || !selectedRestaurant}
                className="flex-1 bg-peach-gold hover:bg-peach-gold/90 text-background"
              >
                {loading ? 'Updating...' : 'Update Visit'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VisitEditModal;