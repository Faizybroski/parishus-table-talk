-- Fix security issue: Set search_path for functions
DROP FUNCTION IF EXISTS public.update_crossed_paths_log();

CREATE OR REPLACE FUNCTION public.update_crossed_paths_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;