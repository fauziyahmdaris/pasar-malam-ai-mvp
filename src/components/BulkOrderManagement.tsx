import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { supabase } from '../../integrations/supabase/client';

interface BulkOrder {
  id: string;
  customer_name: string;
  total_quantity: number;
  total_price: number;
  order_date: string;
  estimated_fulfillment_date: string;
  status: string;
  products: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
}

const BulkOrderManagement: React.FC = () => {
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');

  useEffect(() => {
    fetchBulkOrders();
  }, [filter]);

  const fetchBulkOrders = async () => {
    try {
      setLoading(true);
      const { data: orders, error } = await supabase
        .from('pre_orders')
        .select(`
          *,
          profiles!pre_orders_customer_id_fkey(name),
          order_items(
            quantity,
            price,
            products(name)
          )
        `)
        .eq('order_type', 'BULK')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders: BulkOrder[] = orders?.map(order => ({
        id: order.id,
        customer_name: order.profiles?.name || 'Unknown Customer',
        total_quantity: order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
        total_price: order.order_items?.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0) || 0,
        order_date: order.created_at,
        estimated_fulfillment_date: order.estimated_fulfillment_date || 'TBD',
        status: order.status,
        products: order.order_items?.map((item: any) => ({
          product_name: item.products?.name || 'Unknown Product',
          quantity: item.quantity,
          price: item.price
        })) || []
      })) || [];

      setBulkOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching bulk orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = bulkOrders.filter(order => {
    if (filter === 'all') return true;
    return order.status.toLowerCase() === filter;
  });

  const totalBulkOrders = bulkOrders.length;
  const totalRevenue = bulkOrders.reduce((sum, order) => sum + order.total_price, 0);
  const averageOrderValue = totalBulkOrders > 0 ? totalRevenue / totalBulkOrders : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalBulkOrders}</div>
            <p className="text-sm text-muted-foreground">Total Bulk Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">RM {totalRevenue.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">RM {averageOrderValue.toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Average Order Value</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Order Management</CardTitle>
          <div className="flex gap-2">
            {(['all', 'pending', 'confirmed', 'completed'] as const).map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading bulk orders...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No bulk orders found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{order.customer_name}</h3>
                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Order Date: {new Date(order.order_date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Fulfillment Date: {order.estimated_fulfillment_date}
                      </div>
                      <div className="text-sm">
                        Total: {order.total_quantity} items - RM {order.total_price.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">RM {order.total_price.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.total_quantity} items
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Products:</h4>
                    <div className="space-y-1">
                      {order.products.map((product, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{product.product_name} x {product.quantity}</span>
                          <span>RM {(product.quantity * product.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkOrderManagement;
