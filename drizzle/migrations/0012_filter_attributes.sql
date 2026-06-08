-- Color groups (subcategories for colours, e.g. "Warm Tones", "Neutrals")
CREATE TABLE IF NOT EXISTS color_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now()
);

-- Global colour options with optional group membership
CREATE TABLE IF NOT EXISTS color_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES color_groups(id) ON DELETE SET NULL,
  name text NOT NULL,
  hex_color varchar(7) NOT NULL DEFAULT '#000000',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now()
);

-- Global height options (e.g. "Small", "Medium", "Tall")
CREATE TABLE IF NOT EXISTS height_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now()
);

-- Products <-> colours (many-to-many)
CREATE TABLE IF NOT EXISTS product_color_options (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color_option_id uuid NOT NULL REFERENCES color_options(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, color_option_id)
);

-- Products <-> heights (many-to-many)
CREATE TABLE IF NOT EXISTS product_height_options (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  height_option_id uuid NOT NULL REFERENCES height_options(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, height_option_id)
);
