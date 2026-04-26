require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function deleteAllVariants() {
  console.log('🗑️  Starting deletion of all product variants...\n')

  try {
    // First, count existing variants
    const { count, error: countError } = await supabase
      .from('product_variants_new')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Error counting variants:', countError)
      return
    }

    console.log(`📊 Found ${count} variants to delete\n`)

    if (count === 0) {
      console.log('✅ No variants to delete. Database is already empty.')
      return
    }

    // Delete all variants
    const { data, error } = await supabase
      .from('product_variants_new')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (this condition is always true)

    if (error) {
      console.error('❌ Error deleting variants:', error)
      return
    }

    // Verify deletion
    const { count: remainingCount, error: verifyError } = await supabase
      .from('product_variants_new')
      .select('*', { count: 'exact', head: true })

    if (verifyError) {
      console.error('❌ Error verifying deletion:', verifyError)
      return
    }

    console.log(`✅ Successfully deleted ${count} variants`)
    console.log(`✅ Remaining variants: ${remainingCount}`)
    console.log('\n✨ All variants have been deleted from the database.')
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

deleteAllVariants()
