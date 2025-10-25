import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/auth/AuthCallback";
import Dashboard from "./pages/Dashboard";
import AdminLogin from "./pages/admin/AdminLogin";
import NotFound from "./pages/NotFound";
import ProductManagement from "./pages/admin/ProductManagement";
import SellerSubscriptions from "./pages/admin/SellerSubscriptions";
import PayoutManagement from "./pages/admin/PayoutManagement";
import SubscriptionPayment from "./pages/seller/SubscriptionPayment";
import BrowseProducts from "./pages/customer/BrowseProducts";
import Cart from "./pages/customer/Cart";
import Orders from "./pages/customer/Orders";
import MarketMap from "./pages/customer/MarketMap";
import Tutorials from "./pages/Tutorials";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/admin" element={<AdminLogin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/products" element={<ProductManagement />} />
          <Route path="/admin/subscriptions" element={<SellerSubscriptions />} />
          <Route path="/admin/payouts" element={<PayoutManagement />} />
          <Route path="/seller/subscription" element={<SubscriptionPayment />} />
          <Route path="/products" element={<BrowseProducts />} />
          <Route path="/customer/browse" element={<BrowseProducts />} />
          <Route path="/customer/browse-products" element={<BrowseProducts />} />
          <Route path="/customer/market-map" element={<MarketMap />} />
          <Route path="/customer/cart" element={<Cart />} />
          <Route path="/customer/orders" element={<Orders />} />
          <Route path="/tutorials" element={<Tutorials />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;