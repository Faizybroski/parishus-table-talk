import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Calendar, MapPin, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Event {
  id: string;
  name: string;
  date_time: string;
  location_name: string;
  max_attendees: number;
}

interface BillingInfo {
  fullName: string;
  email: string;
  address: string;
  city: string;
  country: string;
  zipCode: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  onPaymentSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  event, 
  onPaymentSuccess 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    fullName: '',
    email: user?.email || '',
    address: '',
    city: '',
    country: 'US',
    zipCode: '',
  });

  const ticketPrice = 25.00; // You can make this configurable
  const quantity = 1;
  const total = ticketPrice * quantity;

  const handleInputChange = (field: keyof BillingInfo, value: string) => {
    setBillingInfo(prev => ({ ...prev, [field]: value }));
  };

  const handlePayment = async () => {
    if (!user) {
      toast({ title: "Please log in to continue", variant: "destructive" });
      return;
    }

    // Validate billing info
    const requiredFields: (keyof BillingInfo)[] = ['fullName', 'email', 'address', 'city', 'zipCode'];
    const missingFields = requiredFields.filter(field => !billingInfo[field].trim());
    
    if (missingFields.length > 0) {
      toast({ 
        title: "Please fill in all required fields", 
        description: `Missing: ${missingFields.join(', ')}`,
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-rsvp-payment', {
        body: {
          eventId: event.id,
          billingInfo,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        onClose();
        
        // Show success message
        toast({
          title: "Redirecting to payment",
          description: "Complete your payment in the new tab to confirm your RSVP",
        });
        
        onPaymentSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Complete Payment to RSVP</span>
          </DialogTitle>
          <DialogDescription>
            Complete your payment to confirm your RSVP for this event
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Billing Information Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Billing Information</h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={billingInfo.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={billingInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label htmlFor="address">Billing Address *</Label>
                <Input
                  id="address"
                  value={billingInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter your address"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={billingInfo.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">Zip/Postal Code *</Label>
                  <Input
                    id="zipCode"
                    value={billingInfo.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="Zip code"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={billingInfo.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Country"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Order Summary</h3>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{event.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(event.date_time), 'PPP p')}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location_name}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Max {event.max_attendees} attendees</span>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>RSVP Ticket</span>
                    <span>${ticketPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quantity</span>
                    <span>{quantity}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground">
              <p>* Payment will be processed securely through Stripe</p>
              <p>* You will be redirected to complete payment</p>
              <p>* RSVP will be confirmed after successful payment</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={loading}>
            {loading ? 'Processing...' : `Pay $${total.toFixed(2)} & RSVP`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;