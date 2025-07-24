import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import AdminLayout from '@/components/layout/AdminLayout';
import { RestaurantSearchDropdown } from '@/components/restaurants/RestaurantSearchDropdown';
import { useRestaurants } from '@/hooks/useRestaurants';

const AdminEditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { restaurants } = useRestaurants();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [fetchingEvent, setFetchingEvent] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date_time: '',
    location_name: '',
    location_address: '',
    max_attendees: 10,
    restaurant_id: '',
    cover_photo_url: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          restaurants (
            id,
            name,
            full_address
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setEventData(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        date_time: data.date_time ? format(new Date(data.date_time), "yyyy-MM-dd'T'HH:mm") : '',
        location_name: data.location_name || '',
        location_address: data.location_address || '',
        max_attendees: data.max_attendees || 10,
        restaurant_id: data.restaurant_id || '',
        cover_photo_url: data.cover_photo_url || ''
      });
      setPreviewUrl(data.cover_photo_url || '');
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive"
      });
      navigate('/admin/events');
    } finally {
      setFetchingEvent(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive"
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) return formData.cover_photo_url;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `event-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-photos')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload image if new file selected
      const imageUrl = await uploadImage();
      if (selectedFile && !imageUrl) {
        setLoading(false);
        return;
      }

      const updateData = {
        name: formData.name,
        description: formData.description,
        date_time: formData.date_time,
        location_name: formData.location_name,
        location_address: formData.location_address,
        max_attendees: formData.max_attendees,
        restaurant_id: formData.restaurant_id || null,
        cover_photo_url: imageUrl
      };

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event updated successfully",
      });
      navigate('/admin/events');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantSelect = (restaurant: any) => {
    setFormData(prev => ({
      ...prev,
      restaurant_id: restaurant.id,
      location_name: restaurant.name,
      location_address: restaurant.full_address
    }));
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData(prev => ({ ...prev, cover_photo_url: '' }));
  };

  if (fetchingEvent) {
    return (
      <AdminLayout>
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-8">Loading event...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/admin/events')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Events</span>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Edit Event</CardTitle>
                  <CardDescription>Update event details and settings</CardDescription>
                </div>
                {eventData?.status && (
                  <Badge variant={eventData.status === 'active' ? 'default' : 'secondary'}>
                    {eventData.status}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="image">Event Image *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    {previewUrl ? (
                      <div className="relative">
                        <img
                          src={previewUrl}
                          alt="Event preview"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeImage}
                          className="absolute top-2 right-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <Label htmlFor="image-upload" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Click to upload an image
                            </span>
                          </Label>
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Event Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter event name"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Event description..."
                    rows={4}
                  />
                </div>

                {/* Date and Time */}
                <div className="space-y-2">
                  <Label htmlFor="date_time">Date & Time *</Label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date_time"
                      type="datetime-local"
                      required
                      value={formData.date_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, date_time: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Restaurant Selection */}
                <div className="space-y-2">
                  <Label>Restaurant</Label>
                  <RestaurantSearchDropdown
                    restaurants={restaurants}
                    value={formData.restaurant_id}
                    onSelect={handleRestaurantSelect}
                    placeholder="Search restaurants..."
                  />
                  <p className="text-sm text-muted-foreground">
                    Search and select a restaurant to auto-fill venue details
                  </p>
                </div>

                {/* Venue Name */}
                <div className="space-y-2">
                  <Label htmlFor="location_name">Venue Name *</Label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location_name"
                      type="text"
                      required
                      value={formData.location_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                      placeholder="Venue name"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="location_address">Full Address *</Label>
                  <Input
                    id="location_address"
                    type="text"
                    required
                    value={formData.location_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, location_address: e.target.value }))}
                    placeholder="Complete address"
                  />
                </div>

                {/* Max Attendees */}
                <div className="space-y-2">
                  <Label htmlFor="max_attendees">Maximum Attendees *</Label>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="max_attendees"
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={formData.max_attendees}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_attendees: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-4 pt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/admin/events')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || uploading}
                    className="min-w-[120px]"
                  >
                    {loading || uploading ? 'Updating...' : 'Update Event'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEditEvent;