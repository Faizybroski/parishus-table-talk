-- Fix RLS policy for event_invitations to allow users to create invitations for events they have access to
DROP POLICY IF EXISTS "Users can create invitations for events they can access" ON public.event_invitations;

CREATE POLICY "Users can create invitations for events they can access" 
ON public.event_invitations 
FOR INSERT 
WITH CHECK (
  -- User can create invitations if they are the event creator
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_invitations.event_id 
    AND events.creator_id = auth.uid()
  )
);