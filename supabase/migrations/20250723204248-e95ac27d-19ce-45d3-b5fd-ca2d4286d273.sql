-- Update RLS policy for restaurants to allow all authenticated users to view restaurants
-- This is needed for the restaurant dropdown in the create event form

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own restaurants" ON restaurants;

-- Create a new policy that allows all authenticated users to view all restaurants
CREATE POLICY "Authenticated users can view all restaurants" 
ON restaurants 
FOR SELECT 
USING (auth.uid() IS NOT NULL);