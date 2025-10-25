import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { supabase } from '../../integrations/supabase/client';

interface BundleComponent {
  product_id: string;
  product_name: string;
  max_quantity: number;
  price: number;
}

interface CustomBundle {
  id: string;
  name: string;
  description: string;
  base_price: number;
  is_bundle: boolean;
  bundle_components: BundleComponent[];
  created_at: string;
}

const CustomBundleManagement: React.FC = () => {
  const [bundles, setBundles] = useState<CustomBundle[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBundle, setNewBundle] = useState({
    name: '',
    description: '',
    base_price: 0,
    components: [] as BundleComponent[]
  });

  useEffect(() => {
    fetchBundles();
    fetchProducts();
  }, []);

  const fetchBundles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_bundle', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBundles(data || []);
    } catch (error) {
      console.error('Error fetching bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('is_bundle', false)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addComponent = () => {
    setNewBundle(prev => ({
      ...prev,
      components: [...prev.components, { product_id: '', product_name: '', max_quantity: 1, price: 0 }]
    }));
  };

  const updateComponent = (index: number, field: keyof BundleComponent, value: any) => {
    setNewBundle(prev => ({
      ...prev,
      components: prev.components.map((comp, i) => 
        i === index ? { ...comp, [field]: value } : comp
      )
    }));
  };

  const removeComponent = (index: number) => {
    setNewBundle(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      updateComponent(index, 'product_id', productId);
      updateComponent(index, 'product_name', product.name);
      updateComponent(index, 'price', product.price);
    }
  };

  const createBundle = async () => {
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          name: newBundle.name,
          description: newBundle.description,
          price: newBundle.base_price,
          is_bundle: true,
          bundle_components: newBundle.components,
          category: 'Custom Bundle',
          stock_quantity: 999, // Unlimited for bundles
          is_available: true
        });

      if (error) throw error;

      setNewBundle({
        name: '',
        description: '',
        base_price: 0,
        components: []
      });
      setShowCreateForm(false);
      fetchBundles();
    } catch (error) {
      console.error('Error creating bundle:', error);
    }
  };

  const deleteBundle = async (bundleId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', bundleId);

      if (error) throw error;
      fetchBundles();
    } catch (error) {
      console.error('Error deleting bundle:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Custom Bundle Management</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          Create New Bundle
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Custom Bundle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bundle-name">Bundle Name</Label>
              <Input
                id="bundle-name"
                value={newBundle.name}
                onChange={(e) => setNewBundle(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Raya Kuih Set"
              />
            </div>
            <div>
              <Label htmlFor="bundle-description">Description</Label>
              <Textarea
                id="bundle-description"
                value={newBundle.description}
                onChange={(e) => setNewBundle(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your custom bundle..."
              />
            </div>
            <div>
              <Label htmlFor="base-price">Base Price (RM)</Label>
              <Input
                id="base-price"
                type="number"
                value={newBundle.base_price}
                onChange={(e) => setNewBundle(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label>Bundle Components</Label>
              <div className="space-y-2">
                {newBundle.components.map((component, index) => (
                  <div key={index} className="flex gap-2 items-center p-2 border rounded">
                    <select
                      value={component.product_id}
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      className="flex-1 p-2 border rounded"
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - RM {product.price}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      placeholder="Max Qty"
                      value={component.max_quantity}
                      onChange={(e) => updateComponent(index, 'max_quantity', parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeComponent(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addComponent}>
                  Add Component
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={createBundle}>Create Bundle</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Existing Bundles</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading bundles...</div>
          ) : bundles.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No custom bundles found
            </div>
          ) : (
            <div className="space-y-4">
              {bundles.map((bundle) => (
                <Card key={bundle.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{bundle.name}</h3>
                        <Badge variant="secondary">Bundle</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{bundle.description}</p>
                      <div className="text-sm">
                        Base Price: RM {bundle.base_price.toFixed(2)}
                      </div>
                      <div className="text-sm">
                        Components: {bundle.bundle_components?.length || 0} items
                      </div>
                    </div>
                    <div className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteBundle(bundle.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  {bundle.bundle_components && bundle.bundle_components.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Components:</h4>
                      <div className="space-y-1">
                        {bundle.bundle_components.map((component: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{component.product_name}</span>
                            <span>Max: {component.max_quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomBundleManagement;
