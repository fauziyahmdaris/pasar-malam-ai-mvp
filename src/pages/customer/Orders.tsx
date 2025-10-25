import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, Calendar, Clock, MapPin, CreditCard } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";
import PaymentQR from "@/components/PaymentQR";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Order {
  id: string;
  total_amount: number;
  status: string;
  pickup_date: string;
  pickup_time: string;
  customer_notes: string;
  seller_notes: string;
  payment_status: string;
  created_at: string;
  tracking_code?: string;
  stall: {
    stall_name: string;
  };
  items: {
    quantity: number;
    unit_price: number;
    product: {
      name: string;
    };
  }[];
}

const Orders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    checkAuth();
    fetchOrders();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const fetchOrders = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to view your orders",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Verify user has customer role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "customer");

      if (!roleData || roleData.length === 0) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view customer orders",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      // Use RLS policies to ensure customers only see their own orders
      const { data, error } = await supabase
        .from("pre_orders")
        .select(`
          *,
          stall:seller_stalls (
            stall_name,
            id
          ),
          items:order_items (
            quantity,
            unit_price,
            product:products (
              name
            )
          )
        `)
        .eq("customer_id", user.id) // Explicit filter by customer_id for added security
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Additional client-side verification that all orders belong to this customer
      const filteredOrders = data?.filter(order => order.customer_id === user.id) || [];
      setOrders(filteredOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      preparing: "bg-purple-500",
      ready: "bg-green-500",
      completed: "bg-gray-500",
      cancelled: "bg-red-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const handlePayment = (order: Order) => {
    setSelectedOrder(order);
    setPaymentDialogOpen(true);
  };

  const handlePaymentComplete = async () => {
    if (!selectedOrder) return;
    
    try {
      // Get current user for authorization check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to complete payment",
          variant: "destructive",
        });
        return;
      }
      
      // Verify this order belongs to the current user
      const { data: orderData } = await supabase
        .from('pre_orders')
        .select('customer_id')
        .eq('id', selectedOrder.id)
        .single();
        
      if (!orderData || orderData.customer_id !== user.id) {
        toast({
          title: "Authorization Error",
          description: "You don't have permission to update this order",
          variant: "destructive",
        });
        return;
      }
      
      // Update payment status in database with customer_id check for added security
      const { error } = await supabase
        .from('pre_orders')
        .update({ 
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id)
        .eq('customer_id', user.id); // Extra security check
      
      if (error) throw error;
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, payment_status: 'paid' } 
          : order
      ));
      
      toast({
        title: "Payment Successful",
        description: "Your payment has been confirmed",
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    } finally {
      setPaymentDialogOpen(false);
      setSelectedOrder(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <p className="text-lg">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <WhatsAppButton message="Hi, I have a question about my order" />
        </div>

        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              Start pre-ordering from your favorite sellers!
            </p>
            <Button onClick={() => navigate("/products")}>
              Browse Products
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{order.stall.stall_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {order.tracking_code || `Order #${order.id.slice(0, 8)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.toUpperCase()}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4 bg-secondary/20 p-4 rounded-lg">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.product.name}
                      </span>
                      <span>RM {(item.quantity * item.unit_price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(order.pickup_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{order.pickup_time}</span>
                  </div>
                </div>

                {order.customer_notes && (
                  <div className="mb-4 text-sm">
                    <p className="font-medium">Your notes:</p>
                    <p className="text-muted-foreground">{order.customer_notes}</p>
                  </div>
                )}

                {order.seller_notes && (
                  <div className="mb-4 text-sm bg-blue-500/10 p-3 rounded">
                    <p className="font-medium">Seller's message:</p>
                    <p className="text-muted-foreground">{order.seller_notes}</p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold">RM {order.total_amount.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
                      Payment: {order.payment_status}
                    </Badge>
                    {order.payment_status !== "paid" && (
                      <Button 
                        size="sm" 
                        onClick={() => handlePayment(order)}
                      >
                        <CreditCard className="w-4 h-4 mr-2" /> Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedOrder && (
            <PaymentQR
              orderId={selectedOrder.id}
              amount={selectedOrder.total_amount}
              onPaymentComplete={handlePaymentComplete}
              onCancel={() => setPaymentDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;