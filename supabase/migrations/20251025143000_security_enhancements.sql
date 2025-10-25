
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'seller', 'customer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = $1
        AND user_roles.role = $2
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can manage all roles" ON public.user_roles;
CREATE POLICY "Admin can manage all roles"
    ON public.user_roles FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Sellers can view stall orders" ON public.pre_orders;
DROP POLICY IF EXISTS "Sellers can view stall orders" ON public.pre_orders;
CREATE POLICY "Sellers can view stall orders"
    ON public.pre_orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.seller_stalls 
            WHERE id = stall_id 
            AND seller_id = auth.uid()
            AND public.has_role(auth.uid(), 'seller')
        )
    );

DROP POLICY IF EXISTS "Customers can view own orders" ON public.pre_orders;
DROP POLICY IF EXISTS "Customers can view own orders" ON public.pre_orders;
CREATE POLICY "Customers can view own orders"
    ON public.pre_orders FOR SELECT
    USING (
        auth.uid() = customer_id 
        AND public.has_role(auth.uid(), 'customer')
    );

DROP POLICY IF EXISTS "Customers can create orders" ON public.pre_orders;
DROP POLICY IF EXISTS "Customers can create orders" ON public.pre_orders;
CREATE POLICY "Customers can create orders"
    ON public.pre_orders FOR INSERT
    WITH CHECK (
        auth.uid() = customer_id 
        AND public.has_role(auth.uid(), 'customer')
    );

DROP POLICY IF EXISTS "Sellers can update stall orders" ON public.pre_orders;
DROP POLICY IF EXISTS "Sellers can update stall orders" ON public.pre_orders;
CREATE POLICY "Sellers can update stall orders"
    ON public.pre_orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.seller_stalls 
            WHERE id = stall_id 
            AND seller_id = auth.uid()
            AND public.has_role(auth.uid(), 'seller')
        )
    );

DROP POLICY IF EXISTS "Users can view order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Users can view order items for their orders" ON public.order_items;
CREATE POLICY "Users can view order items for their orders"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.pre_orders 
            WHERE id = order_id 
            AND (
                (customer_id = auth.uid() AND public.has_role(auth.uid(), 'customer'))
                OR 
                (stall_id IN (
                    SELECT id FROM public.seller_stalls 
                    WHERE seller_id = auth.uid() 
                    AND public.has_role(auth.uid(), 'seller')
                ))
                OR
                public.has_role(auth.uid(), 'admin')
            )
        )
    );

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS encrypted_phone BOOLEAN DEFAULT false;

CREATE OR REPLACE FUNCTION public.mask_phone_number(phone TEXT)
RETURNS TEXT AS $$
BEGIN
    IF phone IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN SUBSTRING(phone, 1, 3) || REPEAT('*', GREATEST(LENGTH(phone) - 5, 0)) || SUBSTRING(phone, LENGTH(phone) - 1, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE VIEW public.masked_customer_profiles AS
SELECT 
    id AS user_id,
    full_name,
    public.mask_phone_number(phone_number) as phone_number,
    created_at,
    updated_at
FROM public.profiles;

GRANT SELECT ON public.masked_customer_profiles TO authenticated;

ALTER VIEW public.masked_customer_profiles OWNER TO postgres;

DROP POLICY IF EXISTS "Sellers see masked customer data" ON public.profiles;
CREATE POLICY "Sellers see masked customer data"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'seller') 
        AND id IN (
            SELECT customer_id FROM public.pre_orders
            WHERE stall_id IN (
                SELECT id FROM public.seller_stalls
                WHERE seller_id = auth.uid()
            )
        )
    );