import { config } from 'dotenv'

// Load environment variables from .env.local BEFORE importing db
config({ path: '.env.local' })

import { db } from '@/lib/db'
import { categories, productsNew } from './schema'

async function seed() {
  console.log('🌱 Seeding database...')

  try {
    // Add test categories
    console.log('📦 Creating categories...')
    const categoryResults = await db
      .insert(categories)
      .values([
        {
          name: 'Vases',
          slug: 'vases',
          description: 'Beautiful ceramic and glass vases',
          sortOrder: 1,
          isActive: true,
        },
        {
          name: 'Sculptures',
          slug: 'sculptures',
          description: 'Modern art sculptures',
          sortOrder: 2,
          isActive: true,
        },
        {
          name: 'Prints',
          slug: 'prints',
          description: 'Art prints and posters',
          sortOrder: 3,
          isActive: true,
        },
      ])
      .returning()

    console.log(`✅ Created ${categoryResults.length} categories`)

    // Add test products
    console.log('📦 Creating test products...')
    const productResults = await db
      .insert(productsNew)
      .values([
        {
          name: 'Blue Ceramic Vase',
          slug: 'blue-ceramic-vase',
          description: 'A beautiful handcrafted blue ceramic vase',
          categoryId: categoryResults[0].id, // Vases
          basePrice: '29.99',
          thumbnailUrl: 'https://via.placeholder.com/400x400/3B82F6/FFFFFF?text=Blue+Vase',
          images: ['https://via.placeholder.com/400x400/3B82F6/FFFFFF?text=Blue+Vase'],
          galleryImages: [],
          isActive: true,
          customizable: false,
          attributes: {
            height: '25cm',
            material: 'Ceramic',
            color: 'Blue',
          },
        },
        {
          name: 'Modern Sculpture',
          slug: 'modern-sculpture',
          description: 'Contemporary abstract sculpture',
          categoryId: categoryResults[1].id, // Sculptures
          basePrice: '149.99',
          thumbnailUrl: 'https://via.placeholder.com/400x400/10B981/FFFFFF?text=Sculpture',
          images: ['https://via.placeholder.com/400x400/10B981/FFFFFF?text=Sculpture'],
          galleryImages: [],
          isActive: true,
          customizable: false,
          attributes: {
            height: '45cm',
            material: 'Bronze',
            weight: '2kg',
          },
        },
      ])
      .returning()

    console.log(`✅ Created ${productResults.length} products`)
    console.log('🎉 Seeding completed successfully!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }

  process.exit(0)
}

seed()
