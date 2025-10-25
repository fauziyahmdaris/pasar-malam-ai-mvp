import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { supabase } from "../../integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  fulfillment_lead_time_days: number | null;
  is_available: boolean;
}

interface ProductionDeadline {
  product_name: string;
  order_date: string;
  fulfillment_date: string;
  lead_time: number;
  days_remaining: number;
  status: "urgent" | "warning" | "normal";
}

const LeadTimeManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [deadlines, setDeadlines] = useState<ProductionDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [leadTimeInput, setLeadTimeInput] = useState("");

  useEffect(() => {
    fetchProducts();
    fetchProductionDeadlines();
  }, []);

  const fetchProducts = async () => {
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
        setProducts([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("id, name, fulfillment_lead_time_days, is_available")
        .eq("stall_id", stall.id)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductionDeadlines = async () => {
    try {
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
        setDeadlines([]);
        return;
      }

      const { data: orders, error } = await supabase
        .from("pre_orders")
        .select(
          `
          created_at,
          estimated_fulfillment_date,
          order_items(
            quantity,
            products(name, fulfillment_lead_time_days)
          )
        `,
        )
        .eq("status", "pending")
        .eq("stall_id", stall.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const deadlineList: ProductionDeadline[] = [];
      const today = new Date();

      orders?.forEach((order) => {
        order.order_items?.forEach((item: any) => {
          if (item.products?.fulfillment_lead_time_days) {
            const orderDate = new Date(order.created_at);
            const fulfillmentDate = new Date(
              order.estimated_fulfillment_date || orderDate,
            );
            const leadTime = item.products.fulfillment_lead_time_days;
            const productionStartDate = new Date(fulfillmentDate);
            productionStartDate.setDate(
              productionStartDate.getDate() - leadTime,
            );

            const daysRemaining = Math.ceil(
              (productionStartDate.getTime() - today.getTime()) /
                (1000 * 60 * 60 * 24),
            );

            let status: "urgent" | "warning" | "normal" = "normal";
            if (daysRemaining <= 0) status = "urgent";
            else if (daysRemaining <= 3) status = "warning";

            deadlineList.push({
              product_name: item.products.name,
              order_date: order.created_at,
              fulfillment_date: order.estimated_fulfillment_date || "TBD",
              lead_time: leadTime,
              days_remaining: daysRemaining,
              status,
            });
          }
        });
      });

      setDeadlines(deadlineList);
    } catch (error) {
      console.error("Error fetching production deadlines:", error);
    }
  };

  const updateLeadTime = async (productId: string, leadTime: number) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ fulfillment_lead_time_days: leadTime })
        .eq("id", productId);

      if (error) throw error;

      setEditingProduct(null);
      setLeadTimeInput("");
      fetchProducts();
    } catch (error) {
      console.error("Error updating lead time:", error);
    }
  };

  const startEditing = (product: Product) => {
    setEditingProduct(product.id);
    setLeadTimeInput(product.fulfillment_lead_time_days?.toString() || "");
  };

  const cancelEditing = () => {
    setEditingProduct(null);
    setLeadTimeInput("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "warning":
        return <Badge variant="secondary">Warning</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const urgentDeadlines = deadlines.filter((d) => d.status === "urgent").length;
  const warningDeadlines = deadlines.filter(
    (d) => d.status === "warning",
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {urgentDeadlines}
            </div>
            <p className="text-sm text-muted-foreground">Urgent Deadlines</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {warningDeadlines}
            </div>
            <p className="text-sm text-muted-foreground">Warning Deadlines</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-sm text-muted-foreground">Total Products</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Lead Time Management</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading products...</div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border rounded"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    <div className="text-sm text-muted-foreground">
                      Current Lead Time:{" "}
                      {product.fulfillment_lead_time_days || "Not Set"} days
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingProduct === product.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={leadTimeInput}
                          onChange={(e) => setLeadTimeInput(e.target.value)}
                          placeholder="Lead time (days)"
                          className="w-32"
                        />
                        <Button
                          size="sm"
                          onClick={() =>
                            updateLeadTime(
                              product.id,
                              parseInt(leadTimeInput) || 0,
                            )
                          }
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing(product)}
                      >
                        Edit Lead Time
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Production Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          {deadlines.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No pending orders with production deadlines
            </div>
          ) : (
            <div className="space-y-4">
              {deadlines.map((deadline, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{deadline.product_name}</h3>
                      {getStatusBadge(deadline.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Order Date:{" "}
                      {new Date(deadline.order_date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Fulfillment Date: {deadline.fulfillment_date}
                    </div>
                    <div className="text-sm">
                      Lead Time Required: {deadline.lead_time} days
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${
                        deadline.status === "urgent"
                          ? "text-red-600"
                          : deadline.status === "warning"
                            ? "text-yellow-600"
                            : "text-green-600"
                      }`}
                    >
                      {deadline.days_remaining}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      days remaining
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadTimeManagement;
