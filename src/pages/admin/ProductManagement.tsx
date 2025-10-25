import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const ProductManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [stalls, setStalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    min_preorder_quantity: "1",
    category: "",
    stall_id: "",
    seller_tiktok: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    checkAdminAccess();
    fetchData();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (!roles?.some(r => r.role === "admin")) {
      toast.error("Access denied");
      navigate("/dashboard");
    }
  };

  const fetchData = async () => {
    try {
      const [productsResult, stallsResult] = await Promise.all([
        supabase.from("products").select("*, seller_stalls(stall_name, seller_id, profiles(full_name))"),
        supabase.from("seller_stalls").select("*, profiles(full_name)")
      ]);

      if (productsResult.data) setProducts(productsResult.data);
      if (stallsResult.data) setStalls(stallsResult.data);
    } catch (error: any) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        min_preorder_quantity: parseInt(formData.min_preorder_quantity),
        category: formData.category,
        stall_id: formData.stall_id,
      };

      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Product updated successfully");
      } else {
        const { error } = await supabase
          .from("products")
          .insert(productData);

        if (error) throw error;
        toast.success("Product created successfully");
      }

      setFormData({
        name: "",
        description: "",
        price: "",
        stock_quantity: "",
        min_preorder_quantity: "1",
        category: "",
        stall_id: "",
        seller_tiktok: "",
      });
      setEditingId(null);
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (product: any) => {
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      min_preorder_quantity: product.min_preorder_quantity.toString(),
      category: product.category,
      stall_id: product.stall_id,
      seller_tiktok: "",
    });
    setEditingId(product.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast.success("Product deleted");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold">Product Management</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingId(null);
                setFormData({
                  name: "",
                  description: "",
                  price: "",
                  stock_quantity: "",
                  min_preorder_quantity: "1",
                  category: "",
                  stall_id: "",
                  seller_tiktok: "",
                });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit" : "Add"} Product</DialogTitle>
                <DialogDescription>
                  Fill in the product details below
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="stall_id">Seller Stall *</Label>
                  <Select value={formData.stall_id} onValueChange={(value) => setFormData({...formData, stall_id: value})} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stall" />
                    </SelectTrigger>
                    <SelectContent>
                      {stalls.map(stall => (
                        <SelectItem key={stall.id} value={stall.id}>
                          {stall.stall_name} - {stall.profiles?.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (RM) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="min_order">Min Pre-order Qty *</Label>
                    <Input
                      id="min_order"
                      type="number"
                      value={formData.min_preorder_quantity}
                      onChange={(e) => setFormData({...formData, min_preorder_quantity: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tiktok">Seller TikTok (Optional)</Label>
                  <Input
                    id="tiktok"
                    value={formData.seller_tiktok}
                    onChange={(e) => setFormData({...formData, seller_tiktok: e.target.value})}
                    placeholder="@username"
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? "Update" : "Create"} Product
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>
                  {product.seller_stalls?.stall_name} - {product.seller_stalls?.profiles?.full_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Category:</strong> {product.category}</p>
                  <p><strong>Price:</strong> RM {product.price}</p>
                  <p><strong>Stock:</strong> {product.stock_quantity}</p>
                  <p><strong>Min Order:</strong> {product.min_preorder_quantity}</p>
                  <p className="text-muted-foreground">{product.description}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(product)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ProductManagement;
