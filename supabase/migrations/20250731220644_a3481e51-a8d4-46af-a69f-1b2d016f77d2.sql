-- Enable RLS on tables that need it
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscription_plans
CREATE POLICY "Everyone can view active subscription plans" ON public.subscription_plans
FOR SELECT USING (is_active = true);

CREATE POLICY "Admin users can manage subscription plans" ON public.subscription_plans
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Create RLS policies for subscribers
CREATE POLICY "Users can view their own subscription" ON public.subscribers
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage all subscribers" ON public.subscribers
FOR ALL USING (true);

-- Create RLS policies for webhook_logs  
CREATE POLICY "Admin users can view webhook logs" ON public.webhook_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "System can insert webhook logs" ON public.webhook_logs
FOR INSERT WITH CHECK (true);

-- Create RLS policies for plans
CREATE POLICY "Everyone can view active plans" ON public.plans
FOR SELECT USING (true);

CREATE POLICY "Admin users can manage plans" ON public.plans
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Create RLS policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin users can view all subscriptions" ON public.subscriptions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
  )
);

CREATE POLICY "System can manage all subscriptions" ON public.subscriptions
FOR ALL USING (true);