-- First, update existing restaurants to use profile IDs instead of auth user IDs
UPDATE public.restaurants 
SET creator_id = profiles.id
FROM public.profiles 
WHERE restaurants.creator_id = profiles.user_id;

-- Delete any restaurants that don't have matching profiles
DELETE FROM public.restaurants 
WHERE creator_id NOT IN (SELECT id FROM public.profiles);

-- Now add the foreign key constraint
ALTER TABLE public.restaurants 
ADD CONSTRAINT restaurants_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES public.profiles(id) ON DELETE CASCADE;