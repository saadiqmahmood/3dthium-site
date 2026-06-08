CREATE TABLE IF NOT EXISTS room_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_room_options (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  room_option_id uuid NOT NULL REFERENCES room_options(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, room_option_id)
);
