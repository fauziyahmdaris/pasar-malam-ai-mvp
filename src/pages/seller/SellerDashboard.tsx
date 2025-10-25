import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import BulkOrderManagement from "../../components/BulkOrderManagement";
import CustomBundleManagement from "../../components/CustomBundleManagement";
import LeadTimeManagement from "../../components/LeadTimeManagement";
import ProductManagement from "../admin/ProductManagement";
import OrderManagement from "../admin/OrderManagement";
import { supabase } from "../../integrations/supabase/client";

const SellerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });

  React.useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Get the seller's stall ID
      const { data: stall } = await supabase
        .from("seller_stalls")
        .select("id")
        .eq("seller_id", user.id)
        .single();

      if (!stall) {
        // Handle case where seller has no stall
        setStats({
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: 0,
          pendingOrders: 0,
        });
        return;
      }

      // Fetch products count for the seller's stall
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("stall_id", stall.id);

      // Fetch orders count and revenue for the seller's stall
      const { data: orders } = await supabase
        .from("pre_orders")
        .select("total_price, status")
        .eq("stall_id", stall.id);

      const totalOrders = orders?.length || 0;
      const totalRevenue =
        orders?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0;
      const pendingOrders =
        orders?.filter((order) => order.status === "pending").length || 0;

      setStats({
        totalProducts: productsCount || 0,
        totalOrders,
        totalRevenue,
        pendingOrders,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Seller Dashboard</h1>
        <Badge variant="outline">Kuih Raya Ready</Badge>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="kuih-raya">Kuih Raya</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">Active products</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">All time orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  RM {stats.totalRevenue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Total earnings</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting fulfillment
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full"
                onClick={() => setActiveTab("products")}
              >
                Manage Products
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setActiveTab("orders")}
              >
                View Orders
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setActiveTab("kuih-raya")}
              >
                Kuih Raya Features
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <ProductManagement />
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <OrderManagement />
        </TabsContent>

        <TabsContent value="kuih-raya" className="space-y-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kuih Raya Special Features</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Specialized features for Kuih Raya sellers to manage bulk
                  orders, custom bundles, and lead times.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded">
                    <h3 className="font-semibold">Bulk Orders</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage large quantity orders
                    </p>
                  </div>
                  <div className="p-4 border rounded">
                    <h3 className="font-semibold">Custom Bundles</h3>
                    <p className="text-sm text-muted-foreground">
                      Create product bundles and sets
                    </p>
                  </div>
                  <div className="p-4 border rounded">
                    <h3 className="font-semibold">Lead Time Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Set and track production deadlines
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <BulkOrderManagement />
            <CustomBundleManagement />
            <LeadTimeManagement />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SellerDashboard;
