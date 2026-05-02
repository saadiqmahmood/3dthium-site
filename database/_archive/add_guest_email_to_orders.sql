-- Add guest_email column to orders table for guest checkout support
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guest_email TEXT;
 
-- (Optional) Add an index for faster lookup by guest_email
CREATE INDEX IF NOT EXISTS idx_orders_guest_email ON orders(guest_email); 