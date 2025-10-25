-- Add geolocation support for seller stalls
ALTER TABLE IF EXISTS public.seller_stalls 
ADD COLUMN IF NOT EXISTS geolocation JSONB;

-- Create RLS policy for geolocation data
ALTER TABLE public.seller_stalls ENABLE ROW LEVEL SECURITY;

-- Everyone can view stall geolocation
CREATE POLICY "Anyone can view stall geolocation" 
ON public.seller_stalls
FOR SELECT 
USING (true);

-- Only sellers can update their own stall geolocation
CREATE POLICY "Sellers can update their own stall geolocation" 
ON public.seller_stalls
FOR UPDATE
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

-- Add sample geolocation data for Taiping night market stalls
-- Patch: Use stall_name instead of non-existent location column
UPDATE public.seller_stalls
SET geolocation = '{"latitude": 4.8526, "longitude": 100.7395}'
WHERE stall_name = 'Taiping, Perak - Pasar Malam Batu 2 1/2'
AND geolocation IS NULL;