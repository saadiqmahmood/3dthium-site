CREATE TABLE "contact_messages" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "subject" text,
  "message" text NOT NULL,
  "read" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "contact_messages" ENABLE ROW LEVEL SECURITY;
