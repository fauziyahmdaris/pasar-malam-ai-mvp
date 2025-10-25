import { useEffect, useState } from 'react'
import { supabase } from '../../integrations/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface Product {
  id: string
  name: string
  description: string
  base_price: number
  stock_quantity: number
  category_id: string
  is_bundle: boolean
  bundle_components?: string[]
  min_order_quantity: number
  max_order_quantity?: number
  fulfillment_lead_time_days: number
  is_active: boolean
}

interface Category {
  id: string
  name: string
  description: string
}

export default function ProductManagement() {
  // Use supabase client directly
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    is_active: true,
    is_bundle: false,
    min_order_quantity: 1,
    fulfillment_lead_time_days: 0,
    bundle_components: [],
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products' as any)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast({
        title: 'Error fetching products',
        description: error.message,
        variant: 'destructive',
      })
      return
    }
  setProducts(data as unknown as Product[])
  }

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('product_categories' as any)
      .select('*')
      .order('name')

    if (error) {
      toast({
        title: 'Error fetching categories',
        description: error.message,
        variant: 'destructive',
      })
      return
    }
  setCategories(data as unknown as Category[])
  }

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.base_price || !newProduct.category_id) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }
    // If is_bundle, ensure at least one component is selected
    if (newProduct.is_bundle && (!Array.isArray(newProduct.bundle_components) || newProduct.bundle_components.length === 0)) {
      toast({
        title: 'Bundle components required',
        description: 'Please select at least one product for the bundle',
        variant: 'destructive',
      })
      return
    }
    const insertData: any = { ...newProduct }
    if (insertData.is_bundle) {
      if (Array.isArray(insertData.bundle_components)) {
        insertData.bundle_components = JSON.stringify(insertData.bundle_components)
      }
    } else {
      delete insertData.bundle_components
    }
    const { data, error } = await supabase
      .from('products' as any)
      .insert([insertData])
      .select()

    if (error) {
      toast({
        title: 'Error adding product',
        description: error.message,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Product added successfully',
      description: `${newProduct.name} has been added to your products`,
    })

    setIsAddDialogOpen(false)
    setNewProduct({
      is_active: true,
      is_bundle: false,
      min_order_quantity: 1,
      fulfillment_lead_time_days: 0,
    })
    fetchProducts()
  }

  const toggleProductStatus = async (product: Product) => {
    const { error } = await supabase
      .from('products' as any)
      .update({ is_active: !product.is_active })
      .eq('id', product.id)

    if (error) {
      toast({
        title: 'Error updating product status',
        description: error.message,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Product status updated',
      description: `${product.name} is now ${!product.is_active ? 'active' : 'inactive'}`,
    })

    fetchProducts()
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Product Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add New Product</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newProduct.name || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProduct.description || ''}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newProduct.category_id}
                  onValueChange={(value) => setNewProduct({ ...newProduct, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="is-bundle">Is Bundle?</Label>
                <Select
                  value={newProduct.is_bundle ? 'yes' : 'no'}
                  onValueChange={v => setNewProduct({ ...newProduct, is_bundle: v === 'yes' })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newProduct.is_bundle && (
                <div className="grid gap-2">
                  <Label htmlFor="bundle-components">Bundle Components</Label>
                  <div className="flex flex-col gap-1">
                    {products.filter(p => !p.is_bundle).map((p) => (
                      <label key={p.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Array.isArray(newProduct.bundle_components) && (newProduct.bundle_components as string[]).includes(p.id)}
                          onChange={e => {
                            let updated = Array.isArray(newProduct.bundle_components) ? [...newProduct.bundle_components] : [];
                            if (e.target.checked) {
                              updated.push(p.id);
                            } else {
                              updated = updated.filter(id => id !== p.id);
                            }
                            setNewProduct({ ...newProduct, bundle_components: updated });
                          }}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
                <div className="grid gap-2">
                  <Label htmlFor="price">Base Price (RM)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.10"
                    value={newProduct.base_price || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, base_price: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Initial Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={newProduct.stock_quantity || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="min-order">Min Order Qty</Label>
                  <Input
                    id="min-order"
                    type="number"
                    min="1"
                    value={newProduct.min_order_quantity}
                    onChange={(e) => setNewProduct({ ...newProduct, min_order_quantity: parseInt(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max-order">Max Order Qty</Label>
                  <Input
                    id="max-order"
                    type="number"
                    min="1"
                    value={newProduct.max_order_quantity || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, max_order_quantity: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead-time">Fulfillment Lead Time (days)</Label>
                <Input
                  id="lead-time"
                  type="number"
                  min="0"
                  value={newProduct.fulfillment_lead_time_days}
                  onChange={(e) => setNewProduct({ ...newProduct, fulfillment_lead_time_days: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddProduct}>Add Product</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <Card key={product.id} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-gray-500">
                  {categories.find((c) => c.id === product.category_id)?.name.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </p>
              </div>
              <Button
                variant={product.is_active ? 'outline' : 'secondary'}
                size="sm"
                onClick={() => toggleProductStatus(product)}
              >
                {product.is_active ? 'Active' : 'Inactive'}
              </Button>
            </div>
            <p className="text-sm mb-2">{product.description}</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Price:</span> RM{product.base_price.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Stock:</span> {product.stock_quantity}
              </div>
              <div>
                <span className="font-medium">Min Order:</span> {product.min_order_quantity}
              </div>
              <div>
                <span className="font-medium">Lead Time:</span> {product.fulfillment_lead_time_days} days
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}