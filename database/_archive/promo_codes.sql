-- Promo Codes Table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value numeric NOT NULL CHECK (value > 0),
  min_order_value numeric,
  max_uses integer,
  uses integer NOT NULL DEFAULT 0,
  expires_at timestamp with time zone,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Index for quick lookup by code
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes (code); 