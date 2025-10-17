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

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false })

// Create drizzle instance with schema
export const db = drizzle(client, { schema })

// Type exports for convenience
export type DB = typeof db
export * from '@/drizzle/schema'
