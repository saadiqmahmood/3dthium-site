-- Add shipping information columns to checkout_carts table
ALTER TABLE checkout_carts 
ADD COLUMN IF NOT EXISTS shipping_address JSONB,
ADD COLUMN IF NOT EXISTS shipping_rate_id TEXT,
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0.00;

-- Add indexes for shipping-related queries
CREATE INDEX IF NOT EXISTS idx_checkout_carts_shipping_rate_id ON checkout_carts(shipping_rate_id); 