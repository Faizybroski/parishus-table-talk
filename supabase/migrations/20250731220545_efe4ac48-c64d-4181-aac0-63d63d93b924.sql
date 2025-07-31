-- Add paid event functionality to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS event_fee DECIMAL(10,2);

-- Add payment-related columns to rsvps table
ALTER TABLE public.rsvps 
ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none';

-- Create stripe_settings table for admin-managed Stripe keys
CREATE TABLE IF NOT EXISTS public.stripe_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_public_key TEXT,
  stripe_secret_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on stripe_settings
ALTER TABLE public.stripe_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage Stripe settings
CREATE POLICY "Super admins can manage stripe settings" ON public.stripe_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'superadmin'
  )
);

-- Create trigger for stripe_settings updated_at
CREATE TRIGGER update_stripe_settings_updated_at
  BEFORE UPDATE ON public.stripe_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();