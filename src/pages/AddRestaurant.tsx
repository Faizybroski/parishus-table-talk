import React from 'react';
import { useNavigate } from 'react-router-dom';
import GooglePlacesRestaurantForm from '@/components/restaurants/GooglePlacesRestaurantForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRestaurants } from '@/hooks/useRestaurants';

const AddRestaurant = () => {
  const navigate = useNavigate();
  const { createRestaurant } = useRestaurants();

  const handleSubmit = async (data: any) => {
    await createRestaurant(data);
    navigate('/restaurants');
  };

  const handleCancel = () => {
    navigate('/restaurants');
  };

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
          <h1 className="text-3xl font-bold">Add New Restaurant</h1>
          <p className="text-muted-foreground mt-2">
            Search and add a restaurant using Google Places
          </p>
        </div>

        <GooglePlacesRestaurantForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default AddRestaurant;