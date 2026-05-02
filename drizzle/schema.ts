import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

// Enums
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
])

// ============================================
// CATEGORIES & ATTRIBUTES
// ============================================

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  parentId: uuid('parent_id'),
  description: text('description'),
  imageUrl: text('image_url'),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const categoryAttributes = pgTable('category_attributes', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  type: text('type').notNull().default('text'),
  unit: text('unit'),
  isRequired: boolean('is_required').default(false).notNull(),
  isFilterable: boolean('is_filterable').default(true).notNull(),
  options: jsonb('options').default([]).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// PRODUCTS (CANONICAL)
// ============================================

export const productsNew = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  basePrice: numeric('base_price').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  images: jsonb('images').default([]).notNull(),
  galleryImages: jsonb('gallery_images').default([]).notNull(),
  imageCrops: jsonb('image_crops').default({}).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  customizable: boolean('customizable').default(false).notNull(),
  attributes: jsonb('attributes').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const productVariantsNew = pgTable(
  'product_variants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => productsNew.id, { onDelete: 'cascade' }),

    size: varchar('size', { length: 50 }),
    color: varchar('color', { length: 50 }),
    material: varchar('material', { length: 50 }),

    priceAdjustment: numeric('price_adjustment').default('0').notNull(),

    sku: varchar('sku', { length: 100 }).unique(),
    imageUrl: text('image_url'),
    stockQuantity: integer('stock_quantity').default(0).notNull(),
    isAvailable: boolean('is_available').default(true).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('idx_variants_product_id').on(table.productId)]
)

// ============================================
// LEGACY PRODUCTS (READ-ONLY)
// ============================================

export const productsLegacy = pgTable('products_legacy', {
  id: uuid('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').default('Vases'),
  thumbnailUrl: text('thumbnail_url'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const productVariantsLegacy = pgTable('product_variants_legacy', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id'),
  color: text('color').notNull(),
  imageUrl: text('image_url').notNull(),
  price: numeric('price').notNull().default('0'),
  inStock: boolean('in_stock').default(true).notNull(),
  customizable: boolean('customizable').default(false).notNull(),
})

// ============================================
// USERS
// ============================================

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  authUserId: uuid('auth_user_id').unique(),
  email: text('email'),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// CARTS
// ============================================

export const carts = pgTable('carts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const cartItems = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  cartId: uuid('cart_id'),
  variantId: uuid('variant_id'),
  quantity: integer('quantity').notNull(),
  size: text('size'),
})

export const checkoutCarts = pgTable('checkout_carts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'),
  guestEmail: text('guest_email'),
  cartData: jsonb('cart_data').notNull(),
  shippingAddress: jsonb('shipping_address'),
  shippingRateId: text('shipping_rate_id'),
  shippingCost: numeric('shipping_cost').default('0.00'),
  shippingProvider: text('shipping_provider'),
  shippingService: text('shipping_service'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// ORDERS
// ============================================

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id'),
    guestEmail: text('guest_email'),
    totalPrice: numeric('total_price').notNull(),
    status: orderStatusEnum('status').notNull().default('pending'),
    stripeSessionId: text('stripe_session_id').unique(),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    stripeCustomerId: text('stripe_customer_id'),
    shippingName: text('shipping_name'),
    shippingAddress: text('shipping_address'),
    shippingCity: text('shipping_city'),
    shippingPostcode: text('shipping_postcode'),
    shippingCountry: text('shipping_country').default('GB'),
    shippingPhone: text('shipping_phone'),
    shippingMethod: text('shipping_method'),
    shippingRateId: text('shipping_rate_id'),
    shippingCost: numeric('shipping_cost').default('0.00'),
    trackingNumber: text('tracking_number'),
    trackingUrl: text('tracking_url'),
    shippingLabelUrl: text('shipping_label_url'),
    shippedAt: timestamp('shipped_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('idx_orders_created_at').on(table.createdAt)]
)

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id'),
    productId: uuid('product_id'),
    quantity: integer('quantity').notNull(),
    priceAtPurchase: numeric('price_at_purchase').notNull(),
    size: text('size'),
  },
  (table) => [index('idx_order_items_order_id').on(table.orderId)]
)

// ============================================
// CUSTOM ORDERS
// ============================================

export const customOrders = pgTable('custom_orders', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  email: varchar('email').notNull(),
  phone: varchar('phone'),
  material: varchar('material').notNull(),
  address: text('address').notNull(),
  width: integer('width'),
  height: integer('height'),
  depth: integer('depth'),
  description: text('description').notNull(),
  fileUrl: text('file_url').notNull(),
  status: varchar('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
})

// ============================================
// PROMO CODES
// ============================================

export const promoCodes = pgTable('promo_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  type: text('type').notNull(),
  value: numeric('value').notNull(),
  minOrderValue: numeric('min_order_value'),
  maxUses: integer('max_uses'),
  uses: integer('uses').notNull().default(0),
  expiresAt: timestamp('expires_at'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================
// STRIPE WEBHOOK IDEMPOTENCY
// ============================================

export const stripeWebhookEvents = pgTable('stripe_webhook_events', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  payload: jsonb('payload').notNull(),
  receivedAt: timestamp('received_at').defaultNow().notNull(),
})

// ============================================
// RELATIONS
// ============================================

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'parent_child',
  }),
  children: many(categories, { relationName: 'parent_child' }),
  products: many(productsNew),
  attributes: many(categoryAttributes),
}))

export const categoryAttributesRelations = relations(categoryAttributes, ({ one }) => ({
  category: one(categories, {
    fields: [categoryAttributes.categoryId],
    references: [categories.id],
  }),
}))

export const productsNewRelations = relations(productsNew, ({ one, many }) => ({
  category: one(categories, {
    fields: [productsNew.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariantsNew),
}))

export const productVariantsNewRelations = relations(productVariantsNew, ({ one }) => ({
  product: one(productsNew, {
    fields: [productVariantsNew.productId],
    references: [productsNew.id],
  }),
}))

export const productsLegacyRelations = relations(productsLegacy, ({ many }) => ({
  variants: many(productVariantsLegacy),
}))

export const productVariantsLegacyRelations = relations(productVariantsLegacy, ({ one }) => ({
  product: one(productsLegacy, {
    fields: [productVariantsLegacy.productId],
    references: [productsLegacy.id],
  }),
}))

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}))

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  variant: one(productVariantsNew, {
    fields: [cartItems.variantId],
    references: [productVariantsNew.id],
  }),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  variant: one(productVariantsNew, {
    fields: [orderItems.variantId],
    references: [productVariantsNew.id],
  }),
  product: one(productsNew, {
    fields: [orderItems.productId],
    references: [productsNew.id],
  }),
}))

// ============================================
// TYPE EXPORTS
// ============================================

export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert

export type CategoryAttribute = typeof categoryAttributes.$inferSelect
export type NewCategoryAttribute = typeof categoryAttributes.$inferInsert

export type ProductNew = typeof productsNew.$inferSelect
export type NewProductNew = typeof productsNew.$inferInsert

export type ProductVariantNew = typeof productVariantsNew.$inferSelect
export type NewProductVariantNew = typeof productVariantsNew.$inferInsert

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert

export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert

export type PromoCode = typeof promoCodes.$inferSelect
export type NewPromoCode = typeof promoCodes.$inferInsert

export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect
