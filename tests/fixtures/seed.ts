/**
 * Test DB seed — resets the test database to a known state before E2E suites.
 * Requires DATABASE_URL to point at a test/local Postgres instance (NOT prod).
 *
 * Usage: import { seedTestDb, clearTestDb } from './seed'
 */
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/drizzle/schema'

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? ''

if (!TEST_DB_URL) {
  throw new Error('TEST_DATABASE_URL (or DATABASE_URL) must be set for E2E tests')
}

const client = postgres(TEST_DB_URL, { max: 1 })
export const testDb = drizzle(client, { schema })

// ── Fixture data ───────────────────────────────────────────────────────────────

export const fixtures = {
  category: {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Test Category',
    slug: 'test-category',
    sortOrder: 0,
    isActive: true,
  },

  products: [
    {
      id: '00000000-0000-0000-0000-000000000010',
      name: 'Widget Alpha',
      slug: 'widget-alpha',
      basePrice: '100.00',
      isActive: true,
      customizable: false,
      attributes: {},
      images: [],
      galleryImages: [],
      imageCrops: {},
    },
    {
      id: '00000000-0000-0000-0000-000000000011',
      name: 'Widget Beta',
      slug: 'widget-beta',
      basePrice: '50.00',
      isActive: true,
      customizable: false,
      attributes: {},
      images: [],
      galleryImages: [],
      imageCrops: {},
    },
    {
      id: '00000000-0000-0000-0000-000000000012',
      name: 'Inactive Widget',
      slug: 'inactive-widget',
      basePrice: '25.00',
      isActive: false,
      customizable: false,
      attributes: {},
      images: [],
      galleryImages: [],
      imageCrops: {},
    },
  ],

  variant: {
    id: '00000000-0000-0000-0000-000000000020',
    productId: '00000000-0000-0000-0000-000000000010',
    size: 'Large',
    color: 'Red',
    material: 'PLA',
    priceAdjustment: '10.00',
    isAvailable: true,
    stockQuantity: 100,
  },

  promoCode: {
    id: '00000000-0000-0000-0000-000000000030',
    code: 'TEST10',
    type: 'percentage',
    value: '10',
    uses: 0,
    active: true,
  },

  adminUser: {
    id: '00000000-0000-0000-0000-000000000040',
    authUserId: '00000000-0000-0000-0000-000000000041',
    email: 'admin@3dthium.test',
    isAdmin: true,
  },

  regularUser: {
    id: '00000000-0000-0000-0000-000000000050',
    authUserId: '00000000-0000-0000-0000-000000000051',
    email: 'user@3dthium.test',
    isAdmin: false,
  },
}

export async function seedTestDb(): Promise<void> {
  await clearTestDb()

  // Insert in FK-safe order
  await testDb.insert(schema.categories).values(fixtures.category).onConflictDoNothing()
  await testDb
    .insert(schema.productsNew)
    .values(
      fixtures.products.map((p) => ({
        ...p,
        categoryId: fixtures.category.id,
      }))
    )
    .onConflictDoNothing()
  await testDb.insert(schema.productVariantsNew).values(fixtures.variant).onConflictDoNothing()
  await testDb.insert(schema.promoCodes).values(fixtures.promoCode).onConflictDoNothing()
  await testDb.insert(schema.users).values(fixtures.adminUser).onConflictDoNothing()
  await testDb.insert(schema.users).values(fixtures.regularUser).onConflictDoNothing()
}

export async function clearTestDb(): Promise<void> {
  // Delete in reverse FK order
  await testDb.delete(schema.orderItems)
  await testDb.delete(schema.orders)
  await testDb.delete(schema.checkoutCarts)
  await testDb.delete(schema.stripeWebhookEvents)
  await testDb.delete(schema.productVariantsNew).where(
    eq(schema.productVariantsNew.id, fixtures.variant.id)
  )
  for (const p of fixtures.products) {
    await testDb.delete(schema.productsNew).where(eq(schema.productsNew.id, p.id))
  }
  await testDb.delete(schema.categories).where(eq(schema.categories.id, fixtures.category.id))
  await testDb.delete(schema.promoCodes).where(eq(schema.promoCodes.id, fixtures.promoCode.id))
  await testDb.delete(schema.users).where(eq(schema.users.id, fixtures.adminUser.id))
  await testDb.delete(schema.users).where(eq(schema.users.id, fixtures.regularUser.id))
}

export async function closeTestDb(): Promise<void> {
  await client.end()
}
