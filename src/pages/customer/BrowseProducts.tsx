import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Search, ShoppingCart, Plus, MapPin } from "lucide-react";
import { hasRole } from "@/utils/securityMiddleware";
import StallMap from "@/components/StallMap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  image_url: string;
  stall: {
    id: string;
    stall_name: string;
    location: string;
    geolocation: { lat: number; lng: number } | null;
  } | any; // Allow any type for stall to handle potential errors
}

const BrowseProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    fetchProducts();
    updateCartCount();
  }, []);

  useEffect(() => {
    window.addEventListener('storage', updateCartCount);
    return () => window.removeEventListener('storage', updateCartCount);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.stall.stall_name.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    } else {
      setCurrentUser(user);
    }
  };

  const updateCartCount = () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      setCartCount(cart.length);
    } else {
      setCartCount(0);
    }
  };

  const fetchProducts = async () => {
    try {
      // Focus on Taiping location stalls (Pasar Malam Batu 2 1/2)
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          stall:seller_stalls (
            id,
            stall_name,
            location,
            geolocation
          )
        `)
        .eq("is_available", true)
        .gt("stock_quantity", 0)
        .eq("stall.location", "Taiping, Perak - Pasar Malam Batu 2 1/2");

      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product: Product) => {
    // Verify user is logged in
    if (!currentUser) {
      toast.error("Please log in to add items to your cart");
      navigate("/auth");
      return;
    }
    
    // Verify user has customer role
    const isCustomer = await hasRole(currentUser.id);
    if (!isCustomer) {
      toast.error("Only customers can add items to cart");
      return;
    }
    
    // Verify product is still in stock with a fresh check
    try {
      const { data, error } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", product.id)
        .single();
        
      if (error) throw error;
      
      if (!data || data.stock_quantity < 1) {
        toast.error("This product is no longer in stock");
        // Refresh products to update UI
        fetchProducts();
        return;
      }
      
      const savedCart = localStorage.getItem("cart");
      const cart = savedCart ? JSON.parse(savedCart) : [];
      
      const existingItem = cart.find((item: any) => item.productId === product.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 1,
          stallName: product.stall.stall_name,
          stallId: product.stall.id,
        });
      }
      
      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartCount();
      
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      console.error("Error verifying product stock:", error);
      toast.error("Could not add to cart. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <p className="text-lg">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Button onClick={() => navigate("/customer/cart")} className="relative">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Cart
            {cartCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products, categories, or stalls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="grid" className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="grid">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="map">
              <MapPin className="w-4 h-4 mr-2" />
              Market Map
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="grid">
            {filteredProducts.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No products found matching your search.</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {product.stall.stall_name}
                      </p>
                      <p className="text-sm mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex justify-between items-center mb-3">
                        <Badge variant="secondary">{product.category}</Badge>
                        <span className="text-sm text-muted-foreground">
                          Stock: {product.stock_quantity}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-2xl font-bold">RM {product.price.toFixed(2)}</p>
                        <Button onClick={() => addToCart(product)} size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="map" className="h-[500px]">
            <Card className="p-4 h-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Pasar Malam Stall Locations</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/customer/market-map")}
                >
                  View Full Screen
                </Button>
              </div>
              <div className="h-[400px] w-full rounded-md overflow-hidden">
                <StallMap />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BrowseProducts;