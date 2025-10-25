-- Create seller_categories table
CREATE TABLE IF NOT EXISTS public.seller_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create seller_types table
CREATE TABLE IF NOT EXISTS public.seller_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create seller_stores table
CREATE TABLE IF NOT EXISTS public.seller_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  type_id UUID REFERENCES public.seller_types(id),
  category_id UUID REFERENCES public.seller_categories(id),
  location_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id, name)
);

-- Enable RLS
ALTER TABLE public.seller_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_stores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read for seller_categories"
  ON public.seller_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read for seller_types"
  ON public.seller_types FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow sellers to manage their own stores"
  ON public.seller_stores
  FOR ALL
  USING (auth.uid() = seller_id);

CREATE POLICY "Allow admins to manage all stores"
  ON public.seller_stores
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Insert default seller types
INSERT INTO public.seller_types (name, description) VALUES
  ('pasar_malam', 'Night Market Vendor'),
  ('pasar_tani', 'Farmers Market Vendor'),
  ('kuih_raya', 'Festive Cookie/Snack Maker'),
  ('home_based', 'Home-based Business'),
  ('food_truck', 'Food Truck Vendor'),
  ('other', 'Other Types of Business')
ON CONFLICT (name) DO NOTHING;

-- Insert default categories
INSERT INTO public.seller_categories (name, description) VALUES
  ('food_beverage', 'Food and Beverages'),
  ('grocery', 'Groceries and Fresh Produce'),
  ('snacks', 'Snacks and Light Bites'),
  ('clothing', 'Clothing and Apparel'),
  ('accessories', 'Accessories and Fashion Items'),
  ('home_living', 'Home and Living Products'),
  ('electronics', 'Electronics and Gadgets'),
  ('services', 'Services'),
  ('other', 'Other Categories');