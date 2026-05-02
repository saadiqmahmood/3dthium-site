-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cart_id uuid,
  variant_id uuid,
  quantity integer NOT NULL CHECK (quantity > 0),
  size text,
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(id)
);
CREATE TABLE public.carts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT carts_pkey PRIMARY KEY (id),
  CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  parent_id uuid,
  description text,
  image_url text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id)
);
CREATE TABLE public.category_attributes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'text'::text,
  unit text,
  is_required boolean DEFAULT false,
  is_filterable boolean DEFAULT true,
  options jsonb DEFAULT '[]'::jsonb,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT category_attributes_pkey PRIMARY KEY (id),
  CONSTRAINT category_attributes_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.checkout_carts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  guest_email text,
  cart_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  shipping_address jsonb,
  shipping_rate_id text,
  shipping_cost numeric DEFAULT 0.00,
  shipping_provider text,
  shipping_service text,
  CONSTRAINT checkout_carts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.custom_orders (
  id integer NOT NULL DEFAULT nextval('custom_orders_id_seq'::regclass),
  name character varying NOT NULL,
  email character varying NOT NULL,
  phone character varying,
  material character varying NOT NULL,
  address text NOT NULL,
  width integer,
  height integer,
  depth integer,
  description text NOT NULL,
  file_url text NOT NULL,
  status character varying DEFAULT 'pending'::character varying,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT custom_orders_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  variant_id uuid,
  quantity integer NOT NULL,
  price_at_purchase numeric NOT NULL,
  size text,
  product_id uuid,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  total_price numeric NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::order_status,
  created_at timestamp with time zone DEFAULT now(),
  guest_email text,
  stripe_session_id text UNIQUE,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  shipping_name text,
  shipping_address text,
  shipping_city text,
  shipping_postcode text,
  shipping_country text DEFAULT 'GB'::text,
  shipping_phone text,
  shipping_method text,
  shipping_rate_id text,
  shipping_cost numeric DEFAULT 0.00,
  tracking_number text,
  tracking_url text,
  shipped_at timestamp with time zone,
  shipping_label_url text,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  color text NOT NULL,
  image_url text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  in_stock boolean DEFAULT true,
  customizable boolean DEFAULT false,
  CONSTRAINT product_variants_pkey PRIMARY KEY (id),
  CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.product_variants_new (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  name text NOT NULL,
  image_url text,
  price_adjustment numeric DEFAULT 0,
  in_stock boolean DEFAULT true,
  customizable boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_variants_new_pkey PRIMARY KEY (id),
  CONSTRAINT product_variants_new_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products_new(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  category text DEFAULT 'Vases'::text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  thumbnail_url text,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.products_new (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category_id uuid,
  base_price numeric NOT NULL,
  thumbnail_url text,
  is_active boolean DEFAULT true,
  attributes jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_new_pkey PRIMARY KEY (id),
  CONSTRAINT products_new_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE,
  email text,
  created_at timestamp with time zone DEFAULT now(),
  is_admin boolean NOT NULL DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);