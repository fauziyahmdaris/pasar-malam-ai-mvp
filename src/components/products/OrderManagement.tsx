import { useEffect, useState } from 'react'
import { supabase } from '../../integrations/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface Order {
  id: string
  customer_id: string
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';
  total_amount: number;
  requested_fulfillment_date?: string;
  estimated_fulfillment_date?: string;
  notes?: string;
  created_at: string;
}

const statusOptions: Order['status'][] = [
  'pending',
  'confirmed',
  'ready',
  'completed',
  'cancelled',
]

export default function OrderManagement() {
  // Use supabase client directly
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('pre_orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      toast({ title: 'Error fetching orders', description: error.message, variant: 'destructive' })
      return
    }
    setOrders(data as Order[])
  }

  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    const { error } = await supabase
      .from('pre_orders')
      .update({ status })
      .eq('id', orderId)
    if (error) {
      toast({ title: 'Error updating status', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Order status updated' })
    fetchOrders()
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Order Management</h2>
      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold">Order #{order.id.slice(0, 8)}</div>
              <div className="text-sm text-gray-500">Status: {order.status}</div>
              <div className="text-sm">Total: RM{order.total_amount.toFixed(2)}</div>
              <div className="text-xs text-gray-400">Created: {new Date(order.created_at).toLocaleString()}</div>
              {order.notes && <div className="text-xs mt-1">Notes: {order.notes}</div>}
            </div>
            <div className="flex flex-col gap-2 mt-2 md:mt-0 md:ml-4">
              <Select value={order.status} onValueChange={status => handleStatusChange(order.id, status as Order['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {/* Order details modal can be added here */}
    </div>
  )
}
