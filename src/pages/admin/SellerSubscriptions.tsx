import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

const SellerSubscriptions = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
    fetchSubscriptions();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (!user) {
        toast.error("Authentication required");
        navigate("/auth");
        return;
      }

      // Verify admin role with secure query
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
        
      if (rolesError) throw rolesError;

      // Strict role verification
      if (!roles || !roles.some(r => r.role === "admin")) {
        toast.error("Access denied: Admin privileges required");
        navigate("/dashboard");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Security verification error:", error);
      toast.error("Security verification failed");
      navigate("/dashboard");
      return false;
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const { data: sellers } = await supabase
        .from("user_roles")
        .select("user_id, profiles(full_name, phone_number)")
        .eq("role", "seller");

      if (sellers) {
        setSubscriptions(sellers);
      }
    } catch (error: any) {
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Seller Subscriptions</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((sub) => (
            <Card key={sub.user_id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {sub.profiles?.full_name}
                  <Badge variant="default">Active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Phone:</strong> {sub.profiles?.phone_number || "N/A"}</p>
                  <p><strong>Status:</strong> Paid (RM50 - 2 months)</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SellerSubscriptions;
