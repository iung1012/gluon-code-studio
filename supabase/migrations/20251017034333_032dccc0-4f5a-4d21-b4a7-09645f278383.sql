-- Add subscription fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN is_subscribed boolean DEFAULT false,
ADD COLUMN subscription_product_id text,
ADD COLUMN subscription_end timestamp with time zone;