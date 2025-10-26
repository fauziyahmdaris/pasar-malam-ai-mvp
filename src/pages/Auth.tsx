import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";
import { Eye, EyeOff, ShoppingBag, Store } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";
import { validatePassword } from "@/utils/securityMiddleware";

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits").max(20),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  role: z.enum(["customer", "seller"]),
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "customer" as "customer" | "seller",
    sellerCategory: "" as string,
  });
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signupSchema.safeParse(signupData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      // Check password strength
      const passwordCheck = await validatePassword(signupData.password);
      if (!passwordCheck.isValid) {
        toast.error(passwordCheck.message || 'Password validation failed');
        return;
      }

      // Create user with role-based access control
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            full_name: signupData.fullName,
            phone_number: signupData.phone,
            role: signupData.role,
            seller_category: signupData.sellerCategory,
            is_approved: signupData.role === "customer" ? true : false, // Sellers need approval
          },
          emailRedirectTo: 'https://pasarmalamai.netlify.app/auth/callback',
        },
      });

      if (error) throw error;
      
      toast.success("Account created successfully! Please check your email for confirmation.");
      setSignupData({ fullName: "", email: "", phone: "", password: "", role: "customer", sellerCategory: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse(loginData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;
      
      toast.success("Logged in successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">PasarMalamAI</CardTitle>
          <CardDescription className="text-center">
            Join Malaysia's digital night market revolution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                <p className="text-sm text-center">
                  🎯 <strong>New here?</strong> Click <strong>Sign Up</strong> tab above to create your account!
                </p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Logging in..." : "Log In"}
                </Button>
              </form>
              <div className="mt-4 space-y-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                <WhatsAppButton 
                  message="Hi Qash! I need help with login on Pasar Malam AI" 
                  className="w-full"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="signup">
              <div className="mb-4 space-y-2">
                <div className="p-3 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg">
                  <p className="text-sm text-center font-medium">
                    🚀 <strong>Join the Digital Revolution!</strong>
                  </p>
                  <p className="text-xs text-center mt-1 text-muted-foreground">
                    Help save Malaysia's Pasar Malam culture through technology
                  </p>
                </div>
              </div>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Fadzilah Aris"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="0123456789"
                    value={signupData.phone}
                    onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-role">I am a</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      type="button" 
                      variant={signupData.role === "customer" ? "default" : "outline"}
                      onClick={() => setSignupData({ ...signupData, role: "customer", sellerCategory: "" })}
                      className="h-auto py-3 flex flex-col items-center"
                    >
                      <ShoppingBag className="w-5 h-5 mb-1" />
                      <span>Customer</span>
                      <span className="text-xs font-normal mt-1">Browse & Buy</span>
                    </Button>
                    <Button 
                      type="button" 
                      variant={signupData.role === "seller" ? "default" : "outline"}
                      onClick={() => setSignupData({ ...signupData, role: "seller" })}
                      className="h-auto py-3 flex flex-col items-center"
                    >
                      <Store className="w-5 h-5 mb-1" />
                      <span>Seller</span>
                      <span className="text-xs font-normal mt-1">Peniaga</span>
                    </Button>
                  </div>
                </div>
                {signupData.role === "seller" && (
                  <div className="space-y-2">
                    <Label htmlFor="seller-category">Seller Category</Label>
                    <Select 
                      value={signupData.sellerCategory} 
                      onValueChange={(value) => setSignupData({ ...signupData, sellerCategory: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pasar-malam">Peniaga Pasar Malam</SelectItem>
                        <SelectItem value="pasar-tani">Peniaga Pasar Tani</SelectItem>
                        <SelectItem value="gerai-tepi-jalan">Gerai Tepi Jalan</SelectItem>
                        <SelectItem value="kuih-raya">Peniaga Kuih Raya</SelectItem>
                        <SelectItem value="home-business">Home Business</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Note: Subscription fee varies by category. Qash Aris will contact you for payment.
                    </p>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Need Help?</span>
                  </div>
                </div>
                <WhatsAppButton 
                  message="Hi Qash! I need help with registration on Pasar Malam AI" 
                  className="w-full"
                />
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Already have an account? Click <strong>Login</strong> tab above
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
