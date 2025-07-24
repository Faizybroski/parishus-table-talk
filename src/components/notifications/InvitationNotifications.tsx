import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Check, X, Utensils } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface EventInvitation {
  id: string;
  event_id: string;
  invitation_status: string;
  invited_at: string;
  event: {
    id: string;
    name: string;
    description: string;
    date_time: string;
    location_name: string;
    creator_id: string;
  };
  notification: {
    id: string;
    title: string;
    message: string;
    data: any;
    is_read: boolean;
  };
}

interface InvitationNotificationsProps {
  onInvitationUpdate?: () => void;
}

const InvitationNotifications: React.FC<InvitationNotificationsProps> = ({ onInvitationUpdate }) => {
  const [invitations, setInvitations] = useState<EventInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchInvitations();
      subscribeToInvitations();
    }
  }, [user]);

  const fetchInvitations = async () => {
    if (!user) return;

    try {
      // Get event invitations with notification data
      const { data: invitationData, error } = await supabase
        .from('event_invitations')
        .select(`
          *,
          event:events(
            id, name, description, date_time, location_name, creator_id
          )
        `)
        .eq('user_id', user.id)
        .eq('invitation_status', 'sent')
        .order('invited_at', { ascending: false });

      if (error) throw error;

      // Get corresponding notifications
      const invitationsWithNotifications = await Promise.all(
        (invitationData || []).map(async (invitation) => {
          const { data: notificationData } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'crossed_paths_match')
            .contains('data', { event_id: invitation.event_id })
            .order('created_at', { ascending: false })
            .limit(1);

          return {
            ...invitation,
            notification: notificationData?.[0] || null
          };
        })
      );

      setInvitations(invitationsWithNotifications.filter(inv => inv.notification));
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const subscribeToInvitations = () => {
    if (!user) return;

    const channel = supabase
      .channel('invitation-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'event_invitations',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchInvitations();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'event_invitations',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchInvitations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleInvitationResponse = async (invitationId: string, eventId: string, response: 'accepted' | 'declined') => {
    setLoading(true);
    try {
      // Update invitation status
      const { error: invitationError } = await supabase
        .from('event_invitations')
        .update({ invitation_status: response })
        .eq('id', invitationId);

      if (invitationError) throw invitationError;

      // If accepted, create RSVP
      if (response === 'accepted') {
        const { error: rsvpError } = await supabase
          .from('rsvps')
          .insert({
            event_id: eventId,
            user_id: user!.id,
            status: 'confirmed',
            response_status: 'yes'
          });

        if (rsvpError) throw rsvpError;
      }

      // Mark notification as read
      const invitation = invitations.find(inv => inv.id === invitationId);
      if (invitation?.notification) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', invitation.notification.id);
      }

      toast({
        title: response === 'accepted' ? "Invitation accepted!" : "Invitation declined",
        description: response === 'accepted' 
          ? "You've been added to the event. Looking forward to seeing you there!" 
          : "You've declined the invitation.",
      });

      // Refresh invitations
      fetchInvitations();
      onInvitationUpdate?.();
    } catch (error) {
      console.error('Error responding to invitation:', error);
      toast({
        title: "Error",
        description: "Failed to respond to invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        🔔 Pending Invitations
      </h3>
      
      {invitations.map((invitation) => (
        <Card key={invitation.id} className="shadow-card border-border bg-peach-gold/5 border-peach-gold/20">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Invitation Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-peach-gold/10 rounded-lg">
                    <Utensils className="h-5 w-5 text-peach-gold" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-foreground">
                      Private Dinner Invitation
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {invitation.notification?.message}
                    </p>
                  </div>
                </div>
                <Badge className="bg-peach-gold text-background">
                  New
                </Badge>
              </div>

              {/* Event Details */}
              <div className="bg-background/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {format(new Date(invitation.event.date_time), 'EEEE, MMMM do, yyyy')}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    at {format(new Date(invitation.event.date_time), 'h:mm a')}
                  </span>
                </div>
                
                {invitation.event.location_name && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {invitation.event.location_name}
                    </span>
                  </div>
                )}

                {invitation.event.description && (
                  <p className="text-sm text-muted-foreground italic">
                    "{invitation.event.description}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  onClick={() => handleInvitationResponse(invitation.id, invitation.event_id, 'accepted')}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept
                </Button>
                <Button
                  onClick={() => handleInvitationResponse(invitation.id, invitation.event_id, 'declined')}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              </div>

              {/* Timestamp */}
              <p className="text-xs text-muted-foreground text-center">
                Invited {format(new Date(invitation.invited_at), 'MMM do, yyyy')} at{' '}
                {format(new Date(invitation.invited_at), 'h:mm a')}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default InvitationNotifications;