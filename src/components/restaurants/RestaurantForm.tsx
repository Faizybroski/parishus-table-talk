import React, { useState } from 'react';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface RestaurantFormProps {
  restaurant?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const RestaurantForm: React.FC<RestaurantFormProps> = ({
  restaurant,
  onSuccess,
  onCancel
}) => {
  const { createRestaurant, updateRestaurant } = useRestaurants();
  const { profile, loading: profileLoading } = useProfile();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: restaurant?.name || '',
    country: restaurant?.country || '',
    state_province: restaurant?.state_province || '',
    city: restaurant?.city || '',
    full_address: restaurant?.full_address || '',
    latitude: restaurant?.latitude || '',
    longitude: restaurant?.longitude || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.country || !formData.state_province || 
        !formData.city || !formData.full_address) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!profile) {
      toast.error('Profile not loaded. Please try refreshing the page.');
      return;
    }

    setLoading(true);

    try {
      const restaurantData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      };

      let result;
      if (restaurant) {
        result = await updateRestaurant(restaurant.id, restaurantData);
      } else {
        result = await createRestaurant(restaurantData);
      }

      if (result.error) {
        if (result.error.message) {
          toast.error(result.error.message);
        } else {
          toast.error('Failed to save restaurant. Please try again.');
        }
        return;
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving restaurant:', error);
      toast.error(error.message || 'Failed to save restaurant');
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="name">Restaurant Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter restaurant name"
            required
          />
        </div>

        <div>
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            placeholder="Enter country"
            required
          />
        </div>

        <div>
          <Label htmlFor="state_province">State/Province *</Label>
          <Input
            id="state_province"
            value={formData.state_province}
            onChange={(e) => handleInputChange('state_province', e.target.value)}
            placeholder="Enter state or province"
            required
          />
        </div>

        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder="Enter city"
            required
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="full_address">Full Address *</Label>
          <Input
            id="full_address"
            value={formData.full_address}
            onChange={(e) => handleInputChange('full_address', e.target.value)}
            placeholder="Enter complete address"
            required
          />
        </div>

        <div>
          <Label htmlFor="latitude">Latitude (Optional)</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            value={formData.latitude}
            onChange={(e) => handleInputChange('latitude', e.target.value)}
            placeholder="e.g., 40.7128"
          />
        </div>

        <div>
          <Label htmlFor="longitude">Longitude (Optional)</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            value={formData.longitude}
            onChange={(e) => handleInputChange('longitude', e.target.value)}
            placeholder="e.g., -74.0060"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : restaurant ? 'Update Restaurant' : 'Create Restaurant'}
        </Button>
      </div>
    </form>
  );
};

export default RestaurantForm;