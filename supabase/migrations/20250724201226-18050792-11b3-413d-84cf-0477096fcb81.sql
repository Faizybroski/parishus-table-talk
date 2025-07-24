-- Fix security issue: Drop trigger first, then recreate function with proper search_path
DROP TRIGGER IF EXISTS update_crossed_paths_log_updated_at ON public.crossed_paths_log;
DROP FUNCTION IF EXISTS public.update_crossed_paths_log();

-- Recreate function with proper search_path
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

-- Recreate trigger
CREATE TRIGGER update_crossed_paths_log_updated_at
BEFORE UPDATE ON public.crossed_paths_log
FOR EACH ROW
EXECUTE FUNCTION public.update_crossed_paths_log();