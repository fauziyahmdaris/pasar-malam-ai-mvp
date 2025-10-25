-- Create product categories table
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.seller_stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.product_categories(id),
  name VARCHAR NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
  stock_quantity INTEGER DEFAULT 0,
  is_bundle BOOLEAN DEFAULT false,
  bundle_components JSONB,
  fulfillment_lead_time_days INTEGER DEFAULT 0,
  min_order_quantity INTEGER DEFAULT 1,
  max_order_quantity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_bundle_config CHECK (
    NOT is_bundle OR (
      is_bundle AND bundle_components IS NOT NULL AND
      jsonb_typeof(bundle_components) = 'array'
    )
  )
);

-- Ensure seller_id column exists for legacy tables
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create inventory transactions table for stock tracking
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  transaction_type VARCHAR NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  reference_type VARCHAR, -- 'order', 'manual', etc.
  reference_id UUID,     -- ID of the order or other reference
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create orders table with bulk order support
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id),
  seller_id UUID REFERENCES auth.users(id),
  store_id UUID REFERENCES public.seller_stores(id),
  order_type VARCHAR NOT NULL CHECK (order_type IN ('standard', 'bulk')),
  status VARCHAR NOT NULL CHECK (status IN ('pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled')),
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  requested_fulfillment_date DATE,
  estimated_fulfillment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order items table with bundle support
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  bundle_id UUID REFERENCES public.products(id), -- If this item is part of a bundle
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Product Categories (readable by all, manageable by admins)
CREATE POLICY "Allow public read access to product categories"
  ON public.product_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin manage product categories"
  ON public.product_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Products (sellers can manage their own, customers can view active ones)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
DROP POLICY IF EXISTS "Allow sellers to manage their products" ON public.products;
CREATE POLICY "Allow sellers to manage their products"
  ON public.products
  FOR ALL
  USING (seller_id = auth.uid());

CREATE POLICY "Allow customers to view active products"
  ON public.products
  FOR SELECT
  TO public
  USING (is_active = true);

-- Orders (sellers see their orders, customers see their own)
CREATE POLICY "Allow sellers to view their orders"
  ON public.orders
  FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "Allow customers to view their orders"
  ON public.orders
  FOR SELECT
  USING (customer_id = auth.uid());

-- Insert default product categories
INSERT INTO public.product_categories (name, description) VALUES
  ('kuih_raya', 'Traditional Festive Cookies and Snacks'),
  ('cookies', 'Regular Cookies and Biscuits'),
  ('savoury_snacks', 'Savoury Snacks and Crackers'),
  ('traditional_sweets', 'Traditional Malaysian Sweets'),
  ('modern_pastries', 'Modern Pastries and Confections'),
  ('gift_sets', 'Pre-packaged Gift Sets'),
  ('custom_bundles', 'Customizable Product Bundles')
ON CONFLICT DO NOTHING;
