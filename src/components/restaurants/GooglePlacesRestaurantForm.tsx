import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface RestaurantData {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface GooglePlacesRestaurantFormProps {
  onSubmit: (data: RestaurantData) => void;
  onCancel?: () => void;
  initialData?: Partial<RestaurantData>;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const GooglePlacesRestaurantForm: React.FC<GooglePlacesRestaurantFormProps> = ({
  onSubmit,
  onCancel,
  initialData = {}
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [formData, setFormData] = useState<RestaurantData>({
    name: initialData.name || '',
    address: initialData.address || '',
    city: initialData.city || '',
    state: initialData.state || '',
    country: initialData.country || '',
    latitude: initialData.latitude || 0,
    longitude: initialData.longitude || 0,
  });

  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      if (window.google && window.google.maps) {
        setIsApiLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDMyPeHRZWHMc89UEzXgHPqk0mjTmwCrMY&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsApiLoaded(true);
      script.onerror = () => toast.error('Failed to load Google Maps API');
      document.head.appendChild(script);
    };

    loadGoogleMapsAPI();
  }, []);

  useEffect(() => {
    if (isApiLoaded && inputRef.current && !autocompleteRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['establishment'],
          fields: ['name', 'formatted_address', 'address_components', 'geometry', 'place_id']
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        // Debug alert to check if function is running and what data we get
        alert(`Function is running! Place name: ${place?.name || 'No name found'}, Has geometry: ${!!place?.geometry}, Has address components: ${!!place?.address_components}`);
        
        console.log('Place selected:', place); // Debug log
        
        if (!place || !place.geometry || !place.address_components) {
          toast.error('Please select a valid place from the dropdown');
          return;
        }

        const addressComponents = place.address_components;
        
        let city = '';
        let state = '';
        let country = '';

        // Extract address components with more comprehensive mapping
        addressComponents.forEach((component: any) => {
          const types = component.types;
          
          if (types.includes('locality') || types.includes('sublocality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.long_name;
          } else if (types.includes('country')) {
            country = component.long_name;
          }
          
          // Fallback for city if locality not found
          if (!city && types.includes('administrative_area_level_2')) {
            city = component.long_name;
          }
        });

        const newFormData = {
          name: place.name || place.formatted_address?.split(',')[0] || '',
          address: place.formatted_address || '',
          city: city || '',
          state: state || '',
          country: country || '',
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        };

        console.log('Setting form data:', newFormData); // Debug log
        setFormData(newFormData);
        
        // Also update the input value to show the selected place name
        if (inputRef.current) {
          inputRef.current.value = newFormData.name;
        }
      });

      autocompleteRef.current = autocomplete;
    }
  }, [isApiLoaded]);

  const handleInputChange = (field: keyof RestaurantData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Restaurant name is required');
      return false;
    }
    if (!formData.address.trim()) {
      toast.error('Address is required');
      return false;
    }
    if (!formData.city.trim()) {
      toast.error('City is required');
      return false;
    }
    if (!formData.state.trim()) {
      toast.error('State/Province is required');
      return false;
    }
    if (!formData.country.trim()) {
      toast.error('Country is required');
      return false;
    }
    if (!formData.latitude || !formData.longitude) {
      toast.error('Please select a place from the autocomplete suggestions');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await onSubmit(formData);
      toast.success('Restaurant saved successfully');
    } catch (error) {
      toast.error('Failed to save restaurant');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isApiLoaded) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading Google Places...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add Restaurant</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="place-search">Search Restaurant</Label>
            <Input
              ref={inputRef}
              id="place-search"
              type="text"
              placeholder="Start typing restaurant name or address..."
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Select a restaurant from the dropdown to auto-fill details
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Restaurant Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Restaurant name"
                required
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Full Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Complete address"
                required
                readOnly
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City"
                required
                readOnly
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="State or Province"
                required
                readOnly
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="Country"
                required
                readOnly
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="coordinates">Coordinates</Label>
              <Input
                id="coordinates"
                value={formData.latitude && formData.longitude ? `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}` : ''}
                placeholder="Latitude, Longitude"
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || !formData.name || !formData.latitude}
            >
              {isLoading ? 'Saving...' : 'Save Restaurant'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default GooglePlacesRestaurantForm;