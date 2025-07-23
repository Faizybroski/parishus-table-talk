-- Create restaurants table
CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  state_province TEXT NOT NULL,
  city TEXT NOT NULL,
  full_address TEXT NOT NULL,
  longitude DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  creator_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Add restaurant_id to events table
ALTER TABLE public.events 
ADD COLUMN restaurant_id UUID REFERENCES public.restaurants(id);

-- RLS Policies for restaurants
-- Superadmin and Admin can view all restaurants
CREATE POLICY "Admin users can view all restaurants" 
ON public.restaurants 
FOR SELECT 
USING (get_current_user_role() IN ('admin', 'superadmin'));

-- Users can view their own restaurants
CREATE POLICY "Users can view their own restaurants" 
ON public.restaurants 
FOR SELECT 
USING (auth.uid() = creator_id);

-- Superadmin and Admin can manage all restaurants
CREATE POLICY "Admin users can manage all restaurants" 
ON public.restaurants 
FOR ALL 
USING (get_current_user_role() IN ('admin', 'superadmin'));

-- Users can create restaurants
CREATE POLICY "Users can create restaurants" 
ON public.restaurants 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

-- Users can update their own restaurants
CREATE POLICY "Users can update their own restaurants" 
ON public.restaurants 
FOR UPDATE 
USING (auth.uid() = creator_id);

-- Users can delete their own restaurants
CREATE POLICY "Users can delete their own restaurants" 
ON public.restaurants 
FOR DELETE 
USING (auth.uid() = creator_id);

-- Service role can manage all restaurants
CREATE POLICY "Service role can manage all restaurants" 
ON public.restaurants 
FOR ALL 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_restaurants_updated_at
BEFORE UPDATE ON public.restaurants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();