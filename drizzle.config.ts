import { config } from 'dotenv'
import type { Config } from 'drizzle-kit'

// Load environment variables from .env.local
config({ path: '.env.local' })

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set in .env.local\n' +
      'Add: DATABASE_URL="postgresql://postgres:postgres@localhost:5432/3dthium_dev"'
  )
}

export default {
  schema: './drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
  // Include tables from public schema
  schemaFilter: ['public'],
} satisfies Config
