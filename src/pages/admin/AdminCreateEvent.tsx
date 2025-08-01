import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useRestaurants, Restaurant } from '@/hooks/useRestaurants';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, MapPin, Upload, Plus, X, Users, ArrowLeft, Save, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { RestaurantSearchDropdown } from '@/components/restaurants/RestaurantSearchDropdown';

const AdminCreateEvent = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location_name: '',
    location_address: '',
    restaurant_id: '',
    max_attendees: 10,
    dining_style: '',
    dietary_theme: '',
    rsvp_deadline_date: '',
    rsvp_deadline_time: '',
    tags: [] as string[],
    cover_photo_url: '',
    is_mystery_dinner: false,
    is_paid: false,
    event_fee: 0
  });
  const [newTag, setNewTag] = useState('');
  const { user } = useAuth();
  const { profile } = useProfile();
  const { restaurants } = useRestaurants();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `event-photos/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('event-photos')
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('event-photos')
        .getPublicUrl(filePath);
      handleInputChange('cover_photo_url', publicUrl);
      toast({
        title: "Photo uploaded!",
        description: "Your event cover photo has been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      toast({
        title: "Error",
        description: "Please ensure you are logged in and your profile is complete.",
        variant: "destructive"
      });
      return;
    }

    // Validate required image upload
    if (!formData.cover_photo_url) {
      toast({
        title: "Image required",
        description: "Please upload an event photo",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      const rsvpDeadline = formData.rsvp_deadline_date && formData.rsvp_deadline_time 
        ? new Date(`${formData.rsvp_deadline_date}T${formData.rsvp_deadline_time}`)
        : null;
      const { data, error } = await supabase
        .from('events')
        .insert({
          creator_id: profile.id,
          name: formData.name,
          description: formData.description,
          date_time: dateTime.toISOString(),
          location_name: formData.location_name,
          location_address: formData.location_address,
          restaurant_id: formData.restaurant_id || null,
          max_attendees: formData.max_attendees,
          dining_style: formData.dining_style || null,
          dietary_theme: formData.dietary_theme || null,
          rsvp_deadline: rsvpDeadline?.toISOString() || null,
          tags: formData.tags,
          cover_photo_url: formData.cover_photo_url || null,
          is_mystery_dinner: formData.is_mystery_dinner,
          status: 'active',
          is_paid: formData.is_paid,
          event_fee: formData.is_paid ? formData.event_fee : null
        } as any)
        .select()
        .single();
      if (error) throw error;

      const { error: rsvpError } = await supabase
        .from('rsvps')
        .insert({
          event_id: data.id,
          user_id: profile.id,
          status: 'confirmed'
        });
      if (rsvpError) {
        toast({
          title: 'RSVP Error',
          description: rsvpError.message,
          variant: 'destructive'
        });
        return false;
      }

      const { error: reservationError } = await supabase
        .from('reservations')
        .insert({
          event_id: data.id,
          user_id: profile.id,
          reservation_type: 'standard',
          reservation_status: 'confirmed'
        });
      if (reservationError) {
        toast({
          title: 'Reservation Error',
          description: reservationError.message,
          variant: 'destructive'
        });
        return false;
      }

      toast({
        title: "Event created!",
        description: "Your event has been created successfully and you're automatically attending.",
      });
      navigate('/admin/events');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to create events.</p>
        </div>
      </div>
    );
  }

  const isFormValid = formData.name && formData.description && formData.date && 
                      formData.time && formData.location_name && formData.cover_photo_url;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/admin/events')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Events</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create New Event</h1>
              <p className="text-muted-foreground mt-1">
                Plan your next dining experience and invite others to join
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Event Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Wine Tasting Social"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your event, what to expect, dress code, etc."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Time *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => handleInputChange('time', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restaurant">Choose Restaurant (Optional)</Label>
                  <RestaurantSearchDropdown
                    restaurants={restaurants}
                    value={formData.restaurant_id}
                    onSelect={(restaurant: Restaurant | null) => {
                      if (restaurant) {
                        handleInputChange('restaurant_id', restaurant.id);
                        handleInputChange('location_name', restaurant.name);
                        handleInputChange('location_address', restaurant.full_address);
                      } else {
                        handleInputChange('restaurant_id', '');
                        handleInputChange('location_name', '');
                        handleInputChange('location_address', '');
                      }
                    }}
                    placeholder="Search and select a restaurant..."
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="location_name">Venue Name *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location_name"
                        placeholder="e.g., The Garden Cafe"
                        value={formData.location_name}
                        onChange={(e) => handleInputChange('location_name', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location_address">Address</Label>
                    <Input
                      id="location_address"
                      placeholder="123 Main St, City, State"
                      value={formData.location_address}
                      onChange={(e) => handleInputChange('location_address', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_attendees">Maximum Attendees *</Label>
                    <Input
                      id="max_attendees"
                      type="number"
                      min="2"
                      max="50"
                      value={formData.max_attendees}
                      onChange={(e) => handleInputChange('max_attendees', parseInt(e.target.value))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rsvp_deadline_date">RSVP Deadline Date</Label>
                    <Input
                      id="rsvp_deadline_date"
                      type="date"
                      value={formData.rsvp_deadline_date}
                      onChange={(e) => handleInputChange('rsvp_deadline_date', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rsvp_deadline_time">RSVP Deadline Time</Label>
                  <Input
                    id="rsvp_deadline_time"
                    type="time"
                    value={formData.rsvp_deadline_time}
                    onChange={(e) => handleInputChange('rsvp_deadline_time', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle>Event Photo *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.cover_photo_url && (
                  <div className="relative">
                    <img
                      src={formData.cover_photo_url}
                      alt="Event cover"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleInputChange('cover_photo_url', '')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="photo-upload"
                  disabled={uploading}
                />
                
                <label htmlFor="photo-upload">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    className="w-full cursor-pointer"
                    asChild
                  >
                    <span>
                      {uploading ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {formData.cover_photo_url ? 'Change Photo' : 'Upload Cover Photo'}
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Event Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dining_style">Dining Style</Label>
                    <Select value={formData.dining_style} onValueChange={(value) => handleInputChange('dining_style', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dining style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adventurous">Adventurous</SelectItem>
                        <SelectItem value="foodie_enthusiast">Foodie Enthusiast</SelectItem>
                        <SelectItem value="local_lover">Local Lover</SelectItem>
                        <SelectItem value="comfort_food">Comfort Food</SelectItem>
                        <SelectItem value="health_conscious">Health Conscious</SelectItem>
                        <SelectItem value="social_butterfly">Social Butterfly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dietary_theme">Dietary Preferences</Label>
                    <Select value={formData.dietary_theme} onValueChange={(value) => handleInputChange('dietary_theme', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select dietary preferences" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_restrictions">No Restrictions</SelectItem>
                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="vegan">Vegan</SelectItem>
                        <SelectItem value="gluten_free">Gluten Free</SelectItem>
                        <SelectItem value="dairy_free">Dairy Free</SelectItem>
                        <SelectItem value="keto">Keto</SelectItem>
                        <SelectItem value="paleo">Paleo</SelectItem>
                        <SelectItem value="kosher">Kosher</SelectItem>
                        <SelectItem value="halal">Halal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Settings Card */}
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Payment Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_paid"
                    checked={formData.is_paid}
                    onCheckedChange={(checked) => handleInputChange('is_paid', checked)}
                  />
                  <Label htmlFor="is_paid">This is a paid event</Label>
                </div>
                
                {formData.is_paid && (
                  <div className="space-y-2">
                    <Label htmlFor="event_fee">Event Fee (USD) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="event_fee"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.event_fee}
                        onChange={(e) => handleInputChange('event_fee', parseFloat(e.target.value) || 0)}
                        className="pl-10"
                        required={formData.is_paid}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Users will need to pay this amount to RSVP to your event
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a tag (e.g., wine, vegan, casual)"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive/20"
                        onClick={() => removeTag(tag)}
                      >
                        {tag}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/admin/events')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !isFormValid}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Creating...' : 'Create Event'}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCreateEvent;