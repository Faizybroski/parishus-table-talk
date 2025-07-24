import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, MapPin, Clock, Utensils } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Restaurant {
  id: string;
  name: string;
  full_address: string;
}

interface CrossedPath {
  id: string;
  matched_user: {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
  };
  total_crosses: number;
  locations: string[];
  location_details?: Array<{
    name: string;
    address?: string;
    cross_count: number;
  }>;
}

interface InviteToPrivateDinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  crossedPath: CrossedPath | null;
  currentUserId: string;
}

const InviteToPrivateDinnerModal: React.FC<InviteToPrivateDinnerModalProps> = ({
  isOpen,
  onClose,
  crossedPath,
  currentUserId
}) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('19:00');
  const [loading, setLoading] = useState(false);
  const [showDateTime, setShowDateTime] = useState(false);

  // Set default date to next Thursday at 7 PM
  useEffect(() => {
    const today = new Date();
    const nextThursday = new Date(today);
    const daysUntilThursday = (4 - today.getDay() + 7) % 7;
    if (daysUntilThursday === 0 && today.getDay() === 4) {
      nextThursday.setDate(today.getDate() + 7); // Next week if today is Thursday
    } else {
      nextThursday.setDate(today.getDate() + daysUntilThursday);
    }
    setSelectedDate(nextThursday);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchRestaurants();
    }
  }, [isOpen]);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, full_address')
        .order('name');

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocationId(locationId);
    if (locationId === 'new') {
      setShowDateTime(true);
    } else {
      setShowDateTime(false);
    }
  };

  const handleSendInvite = async () => {
    if (!crossedPath || !selectedLocationId) return;
    
    // For new spots, require date selection
    if (selectedLocationId === 'new' && !selectedDate) return;

    setLoading(true);
    try {
      const eventDateTime = new Date(selectedDate || new Date());
      const [hours, minutes] = selectedTime.split(':');
      eventDateTime.setHours(parseInt(hours), parseInt(minutes));

      let restaurantName = '';
      let restaurantId = null;

      if (selectedLocationId === 'new' && selectedRestaurant) {
        const restaurant = restaurants.find(r => r.id === selectedRestaurant);
        restaurantName = restaurant?.name || '';
        restaurantId = selectedRestaurant;
      } else if (selectedLocationId !== 'new') {
        // Find the selected location from crossed paths
        const locationIndex = parseInt(selectedLocationId);
        if (crossedPath.location_details && crossedPath.location_details[locationIndex]) {
          restaurantName = crossedPath.location_details[locationIndex].name;
        } else if (crossedPath.locations[locationIndex]) {
          restaurantName = crossedPath.locations[locationIndex];
        }
      }

      // Create private event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          creator_id: currentUserId,
          name: `Private Dinner: ${crossedPath.matched_user.first_name} & You`,
          description: `You and ${crossedPath.matched_user.first_name} crossed paths ${crossedPath.total_crosses} times! Let's meet up for dinner.`,
          date_time: eventDateTime.toISOString(),
          location_name: restaurantName,
          restaurant_id: restaurantId,
          max_attendees: 2,
          tags: ['private', 'crossed-paths'],
          is_mystery_dinner: true
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Create invitation record
      const { error: invitationError } = await supabase
        .from('event_invitations')
        .insert({
          event_id: eventData.id,
          user_id: crossedPath.matched_user.user_id,
          invitation_status: 'sent'
        });

      if (invitationError) throw invitationError;

      // Send notification to invited user (using auth user_id)
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: crossedPath.matched_user.user_id, // Use auth user_id, not profile id
          type: 'crossed_paths_match',
          title: 'Private Dinner Invitation!',
          message: `You've been invited to a private dinner at ${restaurantName} on ${format(eventDateTime, 'EEEE, MMMM do')} at ${format(eventDateTime, 'h:mm a')}`,
          data: {
            event_id: eventData.id,
            inviter_name: 'Someone',
            restaurant_name: restaurantName,
            date: eventDateTime.toISOString()
          }
        });

      if (notificationError) throw notificationError;

      toast({
        title: "Invitation sent!",
        description: `Your private dinner invitation has been sent to ${crossedPath.matched_user.first_name}.`,
      });

      onClose();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const timeOptions = [
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', 
    '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {crossedPath && (
              <>
                You and {crossedPath.matched_user.first_name} visited{' '}
                {crossedPath.locations.length > 0 ? crossedPath.locations[0] : 'restaurants'}{' '}
                {crossedPath.total_crosses} time{crossedPath.total_crosses !== 1 ? 's' : ''}!
                <br />
                <span className="text-peach-gold">
                  We've set up an event for you on {selectedDate ? format(selectedDate, 'EEEE') : 'Thursday'} at {format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')}!
                </span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Step 1: Location Selection */}
          <div>
            <Label className="text-lg font-semibold mb-4 block">
              Step 1: Where would you like to meet?
            </Label>
            
            <RadioGroup value={selectedLocationId} onValueChange={handleLocationSelect}>
              {/* Display all crossed-path restaurants as radio cards */}
              {crossedPath?.location_details?.map((locationDetail, index) => (
                <Card key={index} className={`cursor-pointer transition-colors ${selectedLocationId === index.toString() ? 'ring-2 ring-peach-gold' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={index.toString()} id={`location-${index}`} />
                      <Label htmlFor={`location-${index}`} className="cursor-pointer flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Utensils className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{locationDetail.name}</p>
                            {locationDetail.address && (
                              <p className="text-sm text-muted-foreground">{locationDetail.address}</p>
                            )}
                            <p className="text-sm text-green-600 font-medium">
                              Crossed {locationDetail.cross_count} time{locationDetail.cross_count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              )) || 
              /* Fallback to basic locations if location_details not available */
              crossedPath?.locations.map((location, index) => (
                <Card key={index} className={`cursor-pointer transition-colors ${selectedLocationId === index.toString() ? 'ring-2 ring-peach-gold' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={index.toString()} id={`location-${index}`} />
                      <Label htmlFor={`location-${index}`} className="cursor-pointer flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Utensils className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{location}</p>
                            <p className="text-sm text-green-600 font-medium">
                              Crossed {crossedPath.total_crosses} time{crossedPath.total_crosses !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Select a New Spot option */}
              <Card className={`cursor-pointer transition-colors ${selectedLocationId === 'new' ? 'ring-2 ring-peach-gold' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="new" id="new-spot" />
                    <Label htmlFor="new-spot" className="cursor-pointer flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold">🔄 Select a New Spot</p>
                          <p className="text-sm text-muted-foreground">Choose from available restaurants</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>
          </div>

          {/* Restaurant Dropdown for New Spot */}
          {selectedLocationId === 'new' && (
            <div>
              <Label htmlFor="restaurant">Select Restaurant</Label>
              <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a restaurant..." />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      <div>
                        <p className="font-medium">{restaurant.name}</p>
                        <p className="text-sm text-muted-foreground">{restaurant.full_address}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 2: Date and Time Selection */}
          <div>
            <Label className="text-lg font-semibold mb-4 block">
              Step 2: Select Date & Time {selectedLocationId === 'new' ? '(Required)' : '(Optional)'}
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Picker */}
              <div>
                <Label>Select Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Picker */}
              <div>
                <Label>Select Time</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <Clock className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {format(new Date(`2000-01-01T${time}`), 'h:mm a')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Step 3: Send Invite Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendInvite}
              disabled={loading || !selectedLocationId || (selectedLocationId === 'new' && !selectedRestaurant)}
              className="bg-peach-gold hover:bg-peach-gold/90 text-background"
            >
              {loading ? 'Sending...' : '✉️ Send Invite'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteToPrivateDinnerModal;