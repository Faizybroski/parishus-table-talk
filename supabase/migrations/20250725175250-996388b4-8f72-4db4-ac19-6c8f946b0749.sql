-- Add unique constraint on profiles.user_id to enable foreign key references
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Add foreign key constraints for crossed_paths_log to properly join with profiles
ALTER TABLE public.crossed_paths_log 
ADD CONSTRAINT crossed_paths_log_user_a_id_fkey 
FOREIGN KEY (user_a_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.crossed_paths_log 
ADD CONSTRAINT crossed_paths_log_user_b_id_fkey 
FOREIGN KEY (user_b_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;