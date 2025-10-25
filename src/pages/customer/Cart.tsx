import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2, ShoppingCart, Calendar, Clock } from "lucide-react";

// Generate a unique tracking code for orders
const generateTrackingCode = () => {
  const prefix = "PM";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}${timestamp}${random}`;
};

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  stallName: string;
  stallId: string;
}

const Cart = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    loadCart();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const loadCart = () => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  };

  const updateCart = (updatedCart: CartItem[]) => {
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const removeItem = (productId: string) => {
    const updatedCart = cartItems.filter(
      (item) => item.productId !== productId,
    );
    updateCart(updatedCart);
    toast({
      title: "Item removed",
      description: "Item has been removed from cart",
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const updatedCart = cartItems.map((item) =>
      item.productId === productId ? { ...item, quantity: newQuantity } : item,
    );
    updateCart(updatedCart);
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  const handleCheckout = async () => {
    if (!pickupDate || !pickupTime) {
      toast({
        title: "Missing information",
        description: "Please select pickup date and time",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to cart",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Verify user authentication
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to complete your order",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Verify products are still available and prices are current
      const productIds = cartItems.map((item) => item.productId);
      const { data: currentProducts } = await supabase
        .from("products")
        .select("id, price, is_available, stock_quantity")
        .in("id", productIds);

      // Check for product availability and price changes
      const unavailableItems = [];
      const priceChangedItems = [];

      cartItems.forEach((item) => {
        const currentProduct = currentProducts?.find(
          (p) => p.id === item.productId,
        );
        if (!currentProduct || !currentProduct.is_available) {
          unavailableItems.push(item.productName);
        } else if (currentProduct.price !== item.price) {
          priceChangedItems.push({
            name: item.productName,
            oldPrice: item.price,
            newPrice: currentProduct.price,
          });
        }
      });

      if (unavailableItems.length > 0) {
        toast({
          title: "Products Unavailable",
          description: `These items are no longer available: ${unavailableItems.join(", ")}`,
        });
        setLoading(false);
        return;
      }

      if (priceChangedItems.length > 0) {
        toast({
          title: "Price Changes Detected",
          description: "Some prices have changed. Please refresh your cart.",
        });
        setLoading(false);
        return;
      }

      // Group items by stall
      const itemsByStall = cartItems.reduce(
        (acc, item) => {
          if (!acc[item.stallId]) {
            acc[item.stallId] = [];
          }
          acc[item.stallId].push(item);
          return acc;
        },
        {} as Record<string, CartItem[]>,
      );

      // Create order for each stall
      for (const [stallId, items] of Object.entries(itemsByStall)) {
        const totalAmount = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );

        const { data: order, error: orderError } = await supabase
          .from("pre_orders")
          .insert({
            customer_id: user.id,
            stall_id: stallId,
            total_amount: totalAmount,
            pickup_date: pickupDate,
            pickup_time: pickupTime,
            customer_notes: notes,
            payment_status: "pending",
            order_status: "pending",
            tracking_code: generateTrackingCode(),
            market_location: "Taiping, Perak - Pasar Malam Batu 2 1/2",
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Insert order items
        const orderItems = items.map((item) => ({
          order_id: order.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity,
          created_at: new Date().toISOString(),
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Decrement stock quantity
        for (const item of items) {
          const { error: decrementError } = await supabase.rpc(
            "decrement_stock",
            {
              product_id_in: item.productId,
              quantity_in: item.quantity,
            },
          );

          if (decrementError) {
            console.error("Error decrementing stock:", decrementError);
            // Handle error, e.g., by logging it or attempting to roll back the order
          }
        }
      }

      localStorage.removeItem("cart");
      toast({
        title: "Order placed!",
        description: "Your pre-order has been submitted successfully",
      });
      navigate("/customer/orders");
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/products")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>

          <Card className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Add some delicious items from our sellers!
            </p>
            <Button onClick={() => navigate("/products")}>
              Browse Products
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/products")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

        <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.productId} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{item.productName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.stallName}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                    >
                      -
                    </Button>
                    <span className="w-12 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                    >
                      +
                    </Button>
                  </div>
                  <p className="font-bold">
                    RM {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Pickup Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    Pickup Date
                  </label>
                  <Input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    min={getTomorrowDate()}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                    Pickup Time
                  </label>
                  <Input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Notes (Optional)
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests?"
                    rows={3}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>RM {calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>RM {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? "Processing..." : "Place Order"}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Payment details will be provided after order confirmation
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
