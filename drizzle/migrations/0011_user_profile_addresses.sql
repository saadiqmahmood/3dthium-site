-- Migration 0011: user full_name + saved addresses
-- Run via: npx drizzle-kit migrate
-- Or paste directly into Supabase SQL Editor

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "full_name" text;

CREATE TABLE IF NOT EXISTS "user_addresses" (
  "id"         uuid        PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id"    uuid        NOT NULL,
  "label"      text        NOT NULL DEFAULT '',
  "name"       text        NOT NULL,
  "line1"      text        NOT NULL,
  "line2"      text        NOT NULL DEFAULT '',
  "city"       text        NOT NULL,
  "postcode"   text        NOT NULL,
  "country"    text        NOT NULL DEFAULT 'GB',
  "phone"      text        NOT NULL DEFAULT '',
  "is_default" boolean     NOT NULL DEFAULT false,
  "created_at" timestamp   NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE "user_addresses"
    ADD CONSTRAINT "user_addresses_user_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "idx_user_addresses_user_id" ON "user_addresses" ("user_id");

-- RLS: block direct anon/authenticated client access.
-- Service role key and the direct DATABASE_URL connection used by the
-- API routes both bypass RLS, so nothing breaks on the server side.
ALTER TABLE "user_addresses" ENABLE ROW LEVEL SECURITY;
