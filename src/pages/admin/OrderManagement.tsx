import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Order {
  id: string;
  total_amount: number;
  status: string;
  pickup_date: string;
  pickup_time: string;
  customer_notes: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data: stall } = await supabase
        .from("seller_stalls")
        .select("id")
        .eq("seller_id", user.id)
        .single();

      if (!stall) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("pre_orders")
        .select(
          `
          id,
          total_amount,
          status,
          pickup_date,
          pickup_time,
          customer_notes,
          created_at,
          profiles ( full_name )
        `,
        )
        .eq("stall_id", stall.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("pre_orders")
        .update({ status })
        .eq("id", orderId);

      if (error) throw error;

      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Management</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading orders...</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border rounded"
              >
                <div>
                  <h3 className="font-semibold">
                    Order #{order.id.slice(0, 8)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Customer: {order.profiles.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Date: {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  <p className="font-semibold">
                    Total: RM {order.total_amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <Select
                    value={order.status}
                    onValueChange={(value) =>
                      updateOrderStatus(order.id, value)
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="ready">Ready for Pickup</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderManagement;
