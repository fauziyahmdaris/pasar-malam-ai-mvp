-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('admin', 'seller', 'customer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;


DROP POLICY IF EXISTS "Admins can do everything" ON public.user_roles;
CREATE POLICY "Admins can do everything" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can read their own role" ON public.user_roles;
CREATE POLICY "Users can read their own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = $1 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;