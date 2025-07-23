-- Add foreign key constraint from restaurants.creator_id to profiles.id
ALTER TABLE public.restaurants 
ADD CONSTRAINT restaurants_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE;