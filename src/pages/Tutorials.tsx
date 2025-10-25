import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Video, MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Tutorials = () => {
  const navigate = useNavigate();

  const handleWhatsAppContact = () => {
    window.open("https://wa.me/60193438388?text=Hi,%20I%20need%20help%20with%20PasarMalamAI", "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Help & Tutorials</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Need Help?
            </CardTitle>
            <CardDescription>Contact our support team on WhatsApp</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleWhatsAppContact} variant="default" size="lg">
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat with Support (+60193438388)
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="customer" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customer">For Customers</TabsTrigger>
            <TabsTrigger value="seller">For Sellers</TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Getting Started as a Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Tutorial video coming soon</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Quick Start Guide:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Create your free account using email and password</li>
                    <li>Browse available products from local pasar malam sellers</li>
                    <li>Select products and add them to your pre-order</li>
                    <li>Choose pickup date and time</li>
                    <li>Complete payment and receive order confirmation</li>
                    <li>Pick up your order at the specified time and location</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How to Place a Pre-Order</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                  <p className="text-muted-foreground">Tutorial video coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seller" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Getting Started as a Seller
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Tutorial video coming soon</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Quick Start Guide:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Register your account with email and password</li>
                    <li>Subscribe to the seller plan (RM50 for 2 months)</li>
                    <li>Make payment via QR code scan</li>
                    <li>Contact support on WhatsApp with payment proof</li>
                    <li>Wait for account activation (within 24 hours)</li>
                    <li>Your products will be managed by the admin initially</li>
                    <li>View your orders and manage pre-orders from customers</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Managing Your Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                  <p className="text-muted-foreground">Tutorial video coming soon</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Understanding Payouts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                  <p className="text-muted-foreground">Tutorial video coming soon</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Payouts are processed via direct bank transfer to your registered bank account. 
                  Payments are currently processed manually and will be automated in future updates.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Tutorials;
