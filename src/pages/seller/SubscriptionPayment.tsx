import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, MessageCircle } from "lucide-react";
import paymentQR from "@/assets/payment-qr-code.png";

const SubscriptionPayment = () => {
  const navigate = useNavigate();
  const [hasSellerRole, setHasSellerRole] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSellerStatus();
  }, []);

  const checkSellerStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    setHasSellerRole(roles?.some(r => r.role === "seller") || false);
    setLoading(false);
  };

  const handleWhatsAppContact = () => {
    window.open("https://wa.me/60193438388?text=Hi,%20I%20have%20completed%20my%20seller%20subscription%20payment", "_blank");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (hasSellerRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Subscription Active</CardTitle>
            <CardDescription>Your seller subscription is already active</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Seller Subscription</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscribe as a Seller</CardTitle>
              <CardDescription>
                Join PasarMalamAI as a seller for just RM50 for 2 months
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Benefits:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>List unlimited products</li>
                  <li>Manage pre-orders from customers</li>
                  <li>Direct bank transfer payouts</li>
                  <li>Analytics and insights</li>
                  <li>Customer support</li>
                </ul>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Payment Instructions:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm mb-6">
                  <li>Scan the QR code below using your banking app</li>
                  <li>Transfer RM50 to the account</li>
                  <li>After payment, contact us via WhatsApp with proof</li>
                  <li>Your seller account will be activated within 24 hours</li>
                </ol>

                <div className="bg-white p-6 rounded-lg flex justify-center mb-6">
                  <img 
                    src={paymentQR} 
                    alt="Payment QR Code" 
                    className="max-w-full h-auto"
                    style={{ maxHeight: "400px" }}
                  />
                </div>

                <Button 
                  onClick={handleWhatsAppContact} 
                  className="w-full"
                  size="lg"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Contact on WhatsApp After Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SubscriptionPayment;
