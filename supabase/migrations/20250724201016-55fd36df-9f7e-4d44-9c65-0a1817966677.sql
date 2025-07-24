-- Add privacy settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN allow_crossed_paths_tracking boolean DEFAULT true;

-- Create restaurant visits tracking table
CREATE TABLE public.restaurant_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  restaurant_id uuid,
  restaurant_name text,
  latitude double precision,
  longitude double precision,
  visited_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for restaurant visits
ALTER TABLE public.restaurant_visits ENABLE ROW LEVEL SECURITY;

-- Create policies for restaurant visits
CREATE POLICY "Users can insert their own visits" 
ON public.restaurant_visits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own visits" 
ON public.restaurant_visits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all visits" 
ON public.restaurant_visits 
FOR ALL 
USING (true);

-- Create crossed paths log table for better tracking
CREATE TABLE public.crossed_paths_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a_id uuid NOT NULL,
  user_b_id uuid NOT NULL,
  restaurant_id uuid,
  restaurant_name text,
  date_crossed timestamp with time zone NOT NULL DEFAULT now(),
  cross_count integer DEFAULT 1,
  location_lat double precision,
  location_lng double precision,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for crossed paths log
ALTER TABLE public.crossed_paths_log ENABLE ROW LEVEL SECURITY;

-- Create policies for crossed paths log
CREATE POLICY "Users can view their crossed paths log" 
ON public.crossed_paths_log 
FOR SELECT 
USING ((auth.uid() = user_a_id) OR (auth.uid() = user_b_id));

CREATE POLICY "Service role can manage all crossed paths log" 
ON public.crossed_paths_log 
FOR ALL 
USING (true);

CREATE POLICY "System can insert crossed paths log" 
ON public.crossed_paths_log 
FOR INSERT 
WITH CHECK (true);

-- Add guest invitation type to events table
ALTER TABLE public.events 
ADD COLUMN guest_invitation_type text DEFAULT 'manual',
ADD COLUMN auto_suggest_crossed_paths boolean DEFAULT false;

-- Create indexes for better performance
CREATE INDEX idx_restaurant_visits_user_restaurant ON public.restaurant_visits(user_id, restaurant_id);
CREATE INDEX idx_restaurant_visits_location ON public.restaurant_visits(latitude, longitude);
CREATE INDEX idx_restaurant_visits_timestamp ON public.restaurant_visits(visited_at);
CREATE INDEX idx_crossed_paths_log_users ON public.crossed_paths_log(user_a_id, user_b_id);
CREATE INDEX idx_crossed_paths_log_restaurant ON public.crossed_paths_log(restaurant_id);

-- Create function to update crossed paths log
CREATE OR REPLACE FUNCTION public.update_crossed_paths_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_crossed_paths_log_updated_at
BEFORE UPDATE ON public.crossed_paths_log
FOR EACH ROW
EXECUTE FUNCTION public.update_crossed_paths_log();