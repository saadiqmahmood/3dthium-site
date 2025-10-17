import { config } from 'dotenv'

// Load environment variables from .env.local BEFORE other imports
config({ path: '.env.local' })

import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

async function runMigrations() {
  console.log('🔄 Running migrations...')

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }

  // For migrations, use a single connection
  const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 })
  const db = drizzle(migrationClient)

  try {
    await migrate(db, { migrationsFolder: './drizzle/migrations' })
    console.log('✅ Migrations completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }

  await migrationClient.end()
}

runMigrations()
