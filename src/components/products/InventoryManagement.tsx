import { useEffect, useState } from 'react'
import { supabase } from '../../integrations/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface Product {
  id: string
  name: string
  stock_quantity: number
}

interface InventoryTransaction {
  id: string
  product_id: string
  transaction_type: string
  quantity: number
  reference_type?: string
  reference_id?: string
  notes?: string
  created_at: string
}

export default function InventoryManagement() {
  const { toast } = useToast()
    const [products, setProducts] = useState<any[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [adjustQty, setAdjustQty] = useState<number>(0)
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'adjustment'>('in')
  const [notes, setNotes] = useState<string>('')

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (selectedProductId) fetchTransactions(selectedProductId)
  }, [selectedProductId])

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products' as any)
      .select('id, name, stock_quantity')
      .order('name')
    if (error) {
      toast({ title: 'Error fetching products', description: error.message, variant: 'destructive' })
      return
    }
    const productsData = Array.isArray(data) ? (data as unknown as Product[]) : []
    setProducts(productsData)
    if (productsData.length > 0) setSelectedProductId(productsData[0].id)
  }

  const fetchTransactions = async (productId: string) => {
    const { data, error } = await supabase
      .from('inventory_transactions' as any)
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
    if (error) {
      toast({ title: 'Error fetching transactions', description: error.message, variant: 'destructive' })
      return
    }
  setTransactions(data as unknown as InventoryTransaction[])
  }

  const handleAdjustStock = async () => {
    if (!selectedProductId || !adjustQty) return
    const { error } = await supabase
      .from('inventory_transactions' as any)
      .insert({
        product_id: selectedProductId,
        transaction_type: adjustType,
        quantity: adjustQty,
        notes,
      })
    if (error) {
      toast({ title: 'Error adjusting stock', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Stock adjusted successfully' })
    setAdjustQty(0)
    setNotes('')
    fetchProducts()
    fetchTransactions(selectedProductId)
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Inventory Management</h2>
      <div className="mb-4">
        <Label htmlFor="product">Select Product</Label>
        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {products.filter((p: any) => p && typeof p === 'object' && 'id' in p).map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Card className="p-4 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="adjustType">Type</Label>
            <Select value={adjustType} onValueChange={v => setAdjustType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Stock In</SelectItem>
                <SelectItem value="out">Stock Out</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="qty">Quantity</Label>
            <Input id="qty" type="number" value={adjustQty} onChange={e => setAdjustQty(Number(e.target.value))} />
          </div>
          <div className="flex-1">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <Button onClick={handleAdjustStock}>Adjust Stock</Button>
        </div>
      </Card>
      <h3 className="font-semibold mb-2">Stock History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.created_at).toLocaleString()}</td>
                <td>{t.transaction_type}</td>
                <td>{t.quantity}</td>
                <td>{t.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
