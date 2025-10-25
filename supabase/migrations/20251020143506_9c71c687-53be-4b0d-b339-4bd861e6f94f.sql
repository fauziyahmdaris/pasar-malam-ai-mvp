-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'seller', 'customer');

-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'ready', 'completed', 'cancelled');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Create pasar_malam_locations table
CREATE TABLE public.pasar_malam_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    operating_days TEXT[] NOT NULL,
    operating_hours TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create seller_stalls table
CREATE TABLE public.seller_stalls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.pasar_malam_locations(id) ON DELETE CASCADE,
    stall_name TEXT NOT NULL,
    stall_number TEXT,
    description TEXT,
    category TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stall_id UUID NOT NULL REFERENCES public.seller_stalls(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    category TEXT NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    min_preorder_quantity INTEGER DEFAULT 1,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pre_orders table
CREATE TABLE public.pre_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stall_id UUID NOT NULL REFERENCES public.seller_stalls(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL,
    status public.order_status DEFAULT 'pending',
    pickup_date DATE NOT NULL,
    pickup_time TEXT NOT NULL,
    customer_notes TEXT,
    seller_notes TEXT,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.pre_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pasar_malam_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_stalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
    ON public.user_roles FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for pasar_malam_locations (public read, admin write)
CREATE POLICY "Anyone can view active locations"
    ON public.pasar_malam_locations FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage locations"
    ON public.pasar_malam_locations FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for seller_stalls
CREATE POLICY "Anyone can view active stalls"
    ON public.seller_stalls FOR SELECT
    USING (is_active = true);

CREATE POLICY "Sellers can manage own stalls"
    ON public.seller_stalls FOR ALL
    USING (auth.uid() = seller_id AND public.has_role(auth.uid(), 'seller'));

CREATE POLICY "Admins can manage all stalls"
    ON public.seller_stalls FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for products
CREATE POLICY "Anyone can view available products"
    ON public.products FOR SELECT
    USING (
        is_available = true 
        AND EXISTS (
            SELECT 1 FROM public.seller_stalls 
            WHERE id = stall_id AND is_active = true
        )
    );

CREATE POLICY "Sellers can manage own products"
    ON public.products FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.seller_stalls 
            WHERE id = stall_id 
            AND seller_id = auth.uid()
            AND public.has_role(auth.uid(), 'seller')
        )
    );

-- RLS Policies for pre_orders
CREATE POLICY "Customers can view own orders"
    ON public.pre_orders FOR SELECT
    USING (auth.uid() = customer_id);

CREATE POLICY "Sellers can view stall orders"
    ON public.pre_orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.seller_stalls 
            WHERE id = stall_id AND seller_id = auth.uid()
        )
    );

CREATE POLICY "Customers can create orders"
    ON public.pre_orders FOR INSERT
    WITH CHECK (auth.uid() = customer_id AND public.has_role(auth.uid(), 'customer'));

CREATE POLICY "Sellers can update stall orders"
    ON public.pre_orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.seller_stalls 
            WHERE id = stall_id AND seller_id = auth.uid()
        )
    );

-- RLS Policies for order_items
CREATE POLICY "Users can view order items for their orders"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.pre_orders 
            WHERE id = order_id 
            AND (customer_id = auth.uid() OR stall_id IN (
                SELECT id FROM public.seller_stalls WHERE seller_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Customers can insert order items"
    ON public.order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pre_orders 
            WHERE id = order_id AND customer_id = auth.uid()
        )
    );

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pasar_malam_locations_updated_at
    BEFORE UPDATE ON public.pasar_malam_locations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seller_stalls_updated_at
    BEFORE UPDATE ON public.seller_stalls
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pre_orders_updated_at
    BEFORE UPDATE ON public.pre_orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone_number)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        NEW.raw_user_meta_data->>'phone_number'
    );
    
    -- Auto-assign customer role by default
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();