import React, { useState, useEffect } from 'react';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, MapPin, Edit, Trash2, Search, User } from 'lucide-react';
import { toast } from 'sonner';

const Restaurants = () => {
  const { restaurants, loading, deleteRestaurant, canEdit, canDelete, refetch } = useRestaurants();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Add comprehensive refresh mechanism
  useEffect(() => {
    const handleFocus = () => {
      refetch();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refetch();
      }
    };

    // Add storage event listener for cross-tab communication
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'restaurantUpdated') {
        refetch();
        // Clear the storage item after handling
        localStorage.removeItem('restaurantUpdated');
      }
    };

    // Add custom event listener for in-page updates
    const handleRestaurantUpdate = () => {
      refetch();
    };

    // Add popstate listener for browser navigation
    const handlePopState = () => {
      setTimeout(() => {
        refetch();
      }, 100);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('restaurantUpdated', handleRestaurantUpdate);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('restaurantUpdated', handleRestaurantUpdate);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [refetch]);

  // Add interval-based refresh to ensure data stays current
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      refetch();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [refetch]);

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    const { error } = await deleteRestaurant(id);
    if (error) {
      toast.error('Failed to delete restaurant');
    } else {
      toast.success('Restaurant deleted successfully');
    }
  };

  const isAdminRoute = location.pathname.startsWith('/admin');
  const addRestaurantPath = isAdminRoute ? '/admin/restaurants/add' : '/restaurants/add';
  const getEditPath = (id: string) => isAdminRoute ? `/admin/restaurants/edit/${id}` : `/restaurants/edit/${id}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Restaurants</h1>
              <p className="text-muted-foreground mt-1">
                Manage your restaurant locations for events
              </p>
            </div>
            
            <Button onClick={() => navigate(addRestaurantPath)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Restaurant
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search restaurants by name, city, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Restaurant Grid */}
          {filteredRestaurants.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? 'No restaurants found' : 'No restaurants yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Get started by adding your first restaurant location'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate(addRestaurantPath)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Restaurant
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <Card key={restaurant.id} className="group hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                          {restaurant.name}
                        </CardTitle>
                        <CardDescription className="flex items-center mt-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          {restaurant.city}, {restaurant.country}
                        </CardDescription>
                      </div>
                      
                      {(canEdit(restaurant) || canDelete(restaurant)) && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canEdit(restaurant) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(getEditPath(restaurant.id))}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {canDelete(restaurant) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Restaurant</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{restaurant.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(restaurant.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="text-sm">{restaurant.full_address}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-muted-foreground">Added By</p>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <p className="text-sm">
                            {restaurant.creator 
                              ? `${restaurant.creator.first_name || ''} ${restaurant.creator.last_name || ''}`.trim() || restaurant.creator.email
                              : 'Unknown'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Badge variant="secondary">{restaurant.state_province}</Badge>
                        {(restaurant.latitude && restaurant.longitude) && (
                          <Badge variant="outline">GPS Coordinates</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Restaurants;