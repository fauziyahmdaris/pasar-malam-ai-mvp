import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PayoutManagement = () => {
  const navigate = useNavigate();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
    fetchPayouts();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (!roles?.some(r => r.role === "admin")) {
      toast.error("Access denied");
      navigate("/dashboard");
    }
  };

  const fetchPayouts = async () => {
    try {
      const { data: orders } = await supabase
        .from("pre_orders")
        .select(`
          *,
          seller_stalls(
            stall_name,
            seller_id,
            profiles(full_name, phone_number)
          )
        `)
        .eq("payment_status", "paid");

      if (orders) {
        const payoutSummary = orders.reduce((acc: any, order: any) => {
          const sellerId = order.seller_stalls?.seller_id;
          if (!sellerId) return acc;

          if (!acc[sellerId]) {
            acc[sellerId] = {
              seller_name: order.seller_stalls?.profiles?.full_name,
              phone: order.seller_stalls?.profiles?.phone_number,
              stall_name: order.seller_stalls?.stall_name,
              total_amount: 0,
              order_count: 0,
            };
          }

          acc[sellerId].total_amount += parseFloat(order.total_amount);
          acc[sellerId].order_count += 1;

          return acc;
        }, {});

        setPayouts(Object.values(payoutSummary));
      }
    } catch (error: any) {
      toast.error("Failed to load payouts");
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
          <h1 className="text-2xl font-bold">Payout Management</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Bank Transfer Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Payouts will be processed via direct bank transfer to registered seller accounts.
              Current status: Manual processing (automation in progress).
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {payouts.map((payout, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{payout.seller_name}</span>
                  <DollarSign className="w-5 h-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Stall:</strong> {payout.stall_name}</p>
                  <p><strong>Phone:</strong> {payout.phone || "N/A"}</p>
                  <p><strong>Total Amount:</strong> RM {payout.total_amount.toFixed(2)}</p>
                  <p><strong>Orders:</strong> {payout.order_count}</p>
                  <Badge variant="secondary" className="mt-2">Pending Payout</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {payouts.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No payouts pending at this time
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default PayoutManagement;
