CREATE TABLE "user_favourites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "user_favourites_user_product_unq" UNIQUE ("user_id", "product_id")
);

CREATE INDEX "idx_user_favourites_user_id" ON "user_favourites" ("user_id");
