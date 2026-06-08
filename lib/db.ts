import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/drizzle/schema'

// Check if we have a database URL
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Please add it to your .env.local file.\n' +
      'For local development: postgresql://postgres:postgres@localhost:5432/3dthium_dev\n' +
      'For production: Your Supabase connection string'
  )
}

const connectionString = process.env.DATABASE_URL

// Singleton prevents connection exhaustion on Next.js hot reloads in dev.
// Each module re-evaluation would otherwise create a new pool.
const g = globalThis as typeof globalThis & { _pgClient?: ReturnType<typeof postgres> }
if (!g._pgClient) {
  g._pgClient = postgres(connectionString, { prepare: false, max: 5 })
}
export const client = g._pgClient

// Create drizzle instance with schema
export const db = drizzle(client, { schema })

// Type exports for convenience
export type DB = typeof db
export * from '@/drizzle/schema'
