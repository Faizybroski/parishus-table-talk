-- Add foreign key constraints for crossed_paths_log to properly join with profiles
ALTER TABLE public.crossed_paths_log 
ADD CONSTRAINT crossed_paths_log_user_a_id_fkey 
FOREIGN KEY (user_a_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.crossed_paths_log 
ADD CONSTRAINT crossed_paths_log_user_b_id_fkey 
FOREIGN KEY (user_b_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Also add foreign key constraint for crossed_paths table for consistency
ALTER TABLE public.crossed_paths 
ADD CONSTRAINT crossed_paths_user1_id_fkey 
FOREIGN KEY (user1_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.crossed_paths 
ADD CONSTRAINT crossed_paths_user2_id_fkey 
FOREIGN KEY (user2_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;