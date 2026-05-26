CREATE TABLE "site_settings" (
  "key" text PRIMARY KEY,
  "value" text NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

INSERT INTO "site_settings" ("key", "value") VALUES
  ('accordion_materials_printing', 'We print in PLA+ and PETG — both durable, environmentally conscious materials. PLA+ is ideal for decorative and display pieces; PETG is stronger and heat-resistant, suited to functional items. Colours are produced in-house and may vary slightly from on-screen representations.'),
  ('accordion_delivery_returns', 'Free UK standard delivery on orders over £30. Items are dispatched within 2–4 business days of ordering. We accept returns on non-personalised items within 14 days of receipt — please contact us to arrange.');
