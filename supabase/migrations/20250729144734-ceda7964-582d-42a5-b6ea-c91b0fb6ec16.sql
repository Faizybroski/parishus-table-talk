-- Enable RLS on the admins table (this was missing)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;