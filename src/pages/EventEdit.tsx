import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurants } from '@/hooks/useRestaurants';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Calendar as CalendarIcon, MapPin, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const EventEdit = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  
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
    rsvp_deadline_time: ''
  });
  const { restaurants } = useRestaurants();

  useEffect(() => {
    const getUserProfile = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        setUserProfileId(profile?.id || null);
      }
    };
    
    getUserProfile().then(() => {
      if (eventId) {
        fetchEvent();
      }
    });
  }, [eventId, user]);

  const fetchEvent = async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;

      // Populate form with existing data
      const eventDate = new Date(data.date_time);
      const rsvpDeadline = data.rsvp_deadline ? new Date(data.rsvp_deadline) : null;

      setFormData({
        name: data.name || '',
        description: data.description || '',
        date: eventDate.toISOString().split('T')[0],
        time: eventDate.toTimeString().slice(0, 5),
        location_name: data.location_name || '',
        location_address: data.location_address || '',
        restaurant_id: data.restaurant_id || '',
        max_attendees: data.max_attendees || 10,
        dining_style: data.dining_style || '',
        dietary_theme: data.dietary_theme || '',
        rsvp_deadline_date: rsvpDeadline ? rsvpDeadline.toISOString().split('T')[0] : '',
        rsvp_deadline_time: rsvpDeadline ? rsvpDeadline.toTimeString().slice(0, 5) : ''
      });
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      });
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      const rsvpDeadline = formData.rsvp_deadline_date && formData.rsvp_deadline_time 
        ? new Date(`${formData.rsvp_deadline_date}T${formData.rsvp_deadline_time}`)
        : null;

      const updateData = {
        name: formData.name,
        description: formData.description,
        date_time: dateTime.toISOString(),
        location_name: formData.location_name,
        location_address: formData.location_address,
        restaurant_id: formData.restaurant_id || null,
        max_attendees: formData.max_attendees,
        dining_style: formData.dining_style as any || null,
        dietary_theme: formData.dietary_theme as any || null,
        rsvp_deadline: rsvpDeadline?.toISOString() || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId);

      if (error) throw error;

      toast({ 
        title: "Event updated successfully!",
        description: "Your changes have been saved."
      });
      
      // Trigger refresh for Events page via localStorage
      localStorage.setItem('eventUpdated', Date.now().toString());
      
      // Also trigger a custom event for in-page refresh
      window.dispatchEvent(new CustomEvent('eventUpdated'));
      
      navigate(`/event/${eventId}/details`);
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast({ 
        title: "Error updating event", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin mx-auto border-4 border-peach-gold border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/event/${eventId}/details`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event Details
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Event</h1>
            <p className="text-muted-foreground mt-1">Update your event details</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Event Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Event Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter event name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="max_attendees">Max Attendees *</Label>
                  <Input
                    id="max_attendees"
                    type="number"
                    value={formData.max_attendees}
                    onChange={(e) => handleInputChange('max_attendees', parseInt(e.target.value))}
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your event..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Date & Time</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Event Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="time">Event Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rsvp_deadline_date">RSVP Deadline Date</Label>
                  <Input
                    id="rsvp_deadline_date"
                    type="date"
                    value={formData.rsvp_deadline_date}
                    onChange={(e) => handleInputChange('rsvp_deadline_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="rsvp_deadline_time">RSVP Deadline Time</Label>
                  <Input
                    id="rsvp_deadline_time"
                    type="time"
                    value={formData.rsvp_deadline_time}
                    onChange={(e) => handleInputChange('rsvp_deadline_time', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="restaurant_id">Restaurant (Optional)</Label>
                <Select value={formData.restaurant_id} onValueChange={(value) => handleInputChange('restaurant_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a restaurant or leave blank for custom venue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Custom Venue (No Restaurant)</SelectItem>
                    {restaurants.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name} - {restaurant.city}, {restaurant.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="location_name">Venue Name *</Label>
                <Input
                  id="location_name"
                  value={formData.location_name}
                  onChange={(e) => handleInputChange('location_name', e.target.value)}
                  placeholder="e.g., The Grand Restaurant"
                  required
                />
              </div>
              <div>
                <Label htmlFor="location_address">Address</Label>
                <Input
                  id="location_address"
                  value={formData.location_address}
                  onChange={(e) => handleInputChange('location_address', e.target.value)}
                  placeholder="Full address including city, state"
                />
              </div>
            </CardContent>
          </Card>

          {/* Event Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Event Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
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
                <div>
                  <Label htmlFor="dietary_theme">Dietary Theme</Label>
                  <Select value={formData.dietary_theme} onValueChange={(value) => handleInputChange('dietary_theme', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select dietary theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="omnivore">Omnivore</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="gluten_free">Gluten Free</SelectItem>
                      <SelectItem value="keto">Keto</SelectItem>
                      <SelectItem value="paleo">Paleo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(`/event/${eventId}/details`)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={saving}
              className="bg-peach-gold hover:bg-peach-gold/90 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventEdit;