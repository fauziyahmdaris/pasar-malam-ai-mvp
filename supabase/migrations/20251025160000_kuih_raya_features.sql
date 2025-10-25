-- Add Kuih Raya specific features to the database
-- This migration adds support for bulk orders, custom bundles, and lead time management

-- Add order_type enum for pre_orders
CREATE TYPE order_type AS ENUM ('STANDARD', 'BULK');

-- Add order_type and estimated_fulfillment_date to pre_orders table
ALTER TABLE pre_orders 
ADD COLUMN order_type order_type DEFAULT 'STANDARD',
ADD COLUMN estimated_fulfillment_date TIMESTAMP WITH TIME ZONE;

-- Add Kuih Raya specific fields to products table
ALTER TABLE products 
ADD COLUMN fulfillment_lead_time_days INTEGER,
ADD COLUMN is_bundle BOOLEAN DEFAULT FALSE,
ADD COLUMN bundle_components JSONB;

-- Create index for better performance on order_type queries
CREATE INDEX idx_pre_orders_order_type ON pre_orders(order_type);

-- Create index for bundle products
CREATE INDEX idx_products_is_bundle ON products(is_bundle);

-- Add comments for documentation
COMMENT ON COLUMN pre_orders.order_type IS 'Type of order: STANDARD for regular orders, BULK for large quantity orders';
COMMENT ON COLUMN pre_orders.estimated_fulfillment_date IS 'Estimated date when the order will be ready for pickup';
COMMENT ON COLUMN products.fulfillment_lead_time_days IS 'Number of days required to fulfill an order for this product';
COMMENT ON COLUMN products.is_bundle IS 'Whether this product is a custom bundle/set';
COMMENT ON COLUMN products.bundle_components IS 'JSON array of components for bundle products with max quantities';

-- Update RLS policies to include new fields
-- Note: These policies should be reviewed and updated based on your specific security requirements

-- Example policy for order_type (adjust as needed)
-- ALTER TABLE pre_orders ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own orders" ON pre_orders FOR SELECT USING (auth.uid() = customer_id);
-- CREATE POLICY "Sellers can view orders for their products" ON pre_orders FOR SELECT USING (
--   EXISTS (
--     SELECT 1 FROM order_items oi 
--     JOIN products p ON oi.product_id = p.id 
--     WHERE oi.order_id = pre_orders.id AND p.seller_id = auth.uid()
--   )
-- );
