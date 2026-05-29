ALTER TABLE "contact_messages"
  ADD COLUMN IF NOT EXISTS "replied_at" timestamp,
  ADD COLUMN IF NOT EXISTS "reply_body" text;
