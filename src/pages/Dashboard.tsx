import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, Store, ShoppingBag, Shield, Package, DollarSign, Users, Video } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      await fetchUserData(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      } else if (session) {
        setUser(session.user);
        fetchUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserData = async (userId: string) => {
    try {
      const [rolesResult, profileResult] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("*").eq("id", userId).single(),
      ]);

      if (rolesResult.error) throw rolesResult.error;
      if (profileResult.error) throw profileResult.error;

      if (rolesResult.data) {
        // Verify roles exist
        if (rolesResult.data.length === 0) {
          // If no roles found, assign default customer role
          const { error: insertError } = await supabase
            .from("user_roles")
            .insert({ user_id: userId, role: "customer" });
            
          if (insertError) throw insertError;
          setRoles(["customer"]);
        } else {
          setRoles(rolesResult.data.map((r) => r.role));
        }
      }

      if (profileResult.data) {
        setProfile(profileResult.data);
      }
    } catch (error: any) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data");
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error: any) {
      toast.error("Failed to log out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const isAdmin = roles.includes("admin");
  const isSeller = roles.includes("seller");
  const isCustomer = roles.includes("customer");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">PasarMalamAI</h1>
          <div className="flex gap-2">
            <WhatsAppButton />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome, {profile?.full_name}!</CardTitle>
              <CardDescription>Email: {user?.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {roles.map((role) => (
                  <span
                    key={role}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Quick Access</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate("/tutorials")} className="w-full">
                <Video className="w-4 h-4 mr-2" />
                Help & Tutorials
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isCustomer && (
              <>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/products")}>
                  <CardHeader>
                    <ShoppingBag className="w-8 h-8 mb-2 text-primary" />
                    <CardTitle>Browse Products</CardTitle>
                    <CardDescription>Discover amazing items from local sellers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Shop Now</Button>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/customer/orders")}>
                  <CardHeader>
                    <Package className="w-8 h-8 mb-2 text-primary" />
                    <CardTitle>My Orders</CardTitle>
                    <CardDescription>View your pre-orders and order status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">View Orders</Button>
                  </CardContent>
                </Card>
              </>
            )}

            {isSeller && (
              <>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/seller/subscription")}>
                  <CardHeader>
                    <Store className="w-8 h-8 mb-2 text-primary" />
                    <CardTitle>Subscription</CardTitle>
                    <CardDescription>Manage your seller subscription</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">View Details</Button>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <Package className="w-8 h-8 mb-2 text-primary" />
                    <CardTitle>My Products</CardTitle>
                    <CardDescription>View your product listings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Coming Soon</Button>
                  </CardContent>
                </Card>
              </>
            )}

            {isAdmin && (
              <>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/products")}>
                  <CardHeader>
                    <Package className="w-8 h-8 mb-2 text-primary" />
                    <CardTitle>Product Management</CardTitle>
                    <CardDescription>Manage all product listings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Manage Products</Button>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/subscriptions")}>
                  <CardHeader>
                    <Users className="w-8 h-8 mb-2 text-primary" />
                    <CardTitle>Seller Subscriptions</CardTitle>
                    <CardDescription>Track seller payments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">View Sellers</Button>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/admin/payouts")}>
                  <CardHeader>
                    <DollarSign className="w-8 h-8 mb-2 text-primary" />
                    <CardTitle>Payout Management</CardTitle>
                    <CardDescription>Manage seller payouts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Manage Payouts</Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
