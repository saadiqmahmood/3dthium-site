-- Table to store carts for checkout sessions
CREATE TABLE IF NOT EXISTS checkout_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  guest_email text,
  cart_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_carts_user_id ON checkout_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_carts_guest_email ON checkout_carts(guest_email); 