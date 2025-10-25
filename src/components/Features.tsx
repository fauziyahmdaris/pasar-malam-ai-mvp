import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Smartphone, MapPin, BarChart3, Wallet, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import sellerImage from "@/assets/seller-dashboard.jpg";
import customerImage from "@/assets/customer-ordering.jpg";

const Features = () => {
  const navigate = useNavigate();
  
  const features = [
    {
      icon: ShoppingCart,
      title: "Pre-Order System",
      description: "Order ahead and skip the queue. Pay online and collect at your convenience.",
    },
    {
      icon: MapPin,
      title: "Real-Time Location",
      description: "Find your favorite stalls instantly with live gerai mapping.",
    },
    {
      icon: Wallet,
      title: "QR Payments",
      description: "Seamless e-wallet integration with GrabPay and Touch'n Go.",
    },
    {
      icon: BarChart3,
      title: "AI Insights",
      description: "Smart analytics for sellers to predict demand and optimize inventory.",
    },
    {
      icon: Clock,
      title: "Market Hours",
      description: "Know exactly when your favorite stalls are open and what's available.",
    },
    {
      icon: Smartphone,
      title: "Mobile First",
      description: "Designed for on-the-go shopping with intuitive mobile experience.",
    },
  ];

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Modern Features for
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {" "}Traditional Markets
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Bridging heritage with technology for a better marketplace experience
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 hover:shadow-[var(--shadow-glow)] transition-[var(--transition-smooth)] hover:-translate-y-1 border-primary/10"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Role-based Showcases */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* For Sellers */}
          <Card className="overflow-hidden hover:shadow-xl transition-[var(--transition-smooth)]">
            <img 
              src={sellerImage} 
              alt="Seller Dashboard" 
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-2 text-primary">For Peniaga</h3>
              <p className="text-muted-foreground mb-4">
                Manage your inventory, track pre-orders, and access AI-powered sales insights to grow your business.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Digital inventory management
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Sales analytics dashboard
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Pre-order notification system
                </li>
              </ul>
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full mt-4"
              >
                Get Started as Seller
              </Button>
            </div>
          </Card>

          {/* For Customers */}
          <Card className="overflow-hidden hover:shadow-xl transition-[var(--transition-smooth)]">
            <img 
              src={customerImage} 
              alt="Customer Ordering" 
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-2 text-secondary">For Customers</h3>
              <p className="text-muted-foreground mb-4">
                Browse products, pre-order your favorites, and pay digitally for a seamless marketplace experience.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Browse all stalls in one app
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Pre-order and skip queues
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Secure digital payments
                </li>
              </ul>
              <Button 
                onClick={() => navigate('/customer/browse')}
                variant="secondary"
                className="w-full mt-4"
              >
                Browse Products
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Features;
