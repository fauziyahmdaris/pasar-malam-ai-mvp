import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the auth callback
    const handleAuthCallback = async () => {
      const { hash, searchParams } = new URL(window.location.href);
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        console.error('Auth error:', errorDescription);
        navigate('/auth?error=' + encodeURIComponent(errorDescription));
        return;
      }

      // Get session after OAuth or email confirmation callback
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError.message);
        navigate('/auth?error=' + encodeURIComponent(sessionError.message));
        return;
      }

      if (session?.user) {
        // Check for admin role
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (roles?.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (roles?.role === 'seller') {
          navigate('/seller/dashboard');
        } else {
          navigate('/customer/browse');
        }
      } else {
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  );
};

export default AuthCallback;