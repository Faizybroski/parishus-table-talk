import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import GooglePlacesRestaurantForm from '@/components/restaurants/GooglePlacesRestaurantForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRestaurants } from '@/hooks/useRestaurants';

const EditRestaurant = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { restaurants, updateRestaurant } = useRestaurants();
  
  const restaurant = restaurants.find(r => r.id === id);

  const handleSubmit = async (data: any) => {
    if (!id) return;
    await updateRestaurant(id, {
      name: data.name,
      full_address: data.address,
      city: data.city,
      state_province: data.state,
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
    });
    navigate('/restaurants');
  };

  const handleCancel = () => {
    navigate('/restaurants');
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Restaurant not found</h1>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="mt-4"
            >
              Back to Restaurants
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="mb-4 flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Restaurants</span>
          </Button>
          <h1 className="text-3xl font-bold">Edit Restaurant</h1>
          <p className="text-muted-foreground mt-2">
            Update restaurant information using Google Places
          </p>
        </div>

        <GooglePlacesRestaurantForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          initialData={{
            name: restaurant.name,
            address: restaurant.full_address,
            city: restaurant.city,
            state: restaurant.state_province,
            country: restaurant.country,
            latitude: restaurant.latitude || 0,
            longitude: restaurant.longitude || 0,
          }}
        />
      </div>
    </div>
  );
};

export default EditRestaurant;