-- Enable RLS

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR NOT NULL CHECK (role IN ('admin', 'seller', 'customer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Admins can do everything" ON public.user_roles
  FOR ALL USING (
    auth.uid() IN (
      SELECT ur.user_id 
      FROM public.user_roles ur 
      WHERE ur.role = 'admin'
    )
  );

CREATE POLICY "Users can read their own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Function to set up initial admin
CREATE OR REPLACE FUNCTION setup_initial_admin()
RETURNS void AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Create admin user if not exists
  INSERT INTO auth.users (
    email,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmed_at
  )
  VALUES (
    'g8fauziyah@gmail.com',
    '{"name": "System Administrator"}',
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE
  SET raw_user_meta_data = EXCLUDED.raw_user_meta_data
  RETURNING id INTO admin_user_id;

  -- Grant admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE
  SET role = 'admin';
END;
$$ LANGUAGE plpgsql;