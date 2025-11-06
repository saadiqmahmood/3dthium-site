#!/usr/bin/env node

/**
 * Test script to debug variant creation issues
 * Run with: node scripts/test-variant-creation.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('\n🔍 Testing Variant Creation System\n')
console.log('═'.repeat(60))

// Step 1: Check environment variables
console.log('\n📋 Step 1: Checking Environment Variables')
console.log('─'.repeat(60))
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅ Set' : '❌ Missing')

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\n❌ Missing required environment variables!')
  console.error('Please check your .env.local file.\n')
  process.exit(1)
}

// Step 2: Initialize Supabase client
console.log('\n🔧 Step 2: Initializing Supabase Client')
console.log('─'.repeat(60))

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

console.log('✅ Supabase client created')

// Step 3: Check if table exists
async function checkTableExists() {
  console.log('\n📊 Step 3: Checking if product_variants_new table exists')
  console.log('─'.repeat(60))

  try {
    const { data, error, count } = await supabase
      .from('product_variants_new')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('❌ Table check failed:', error.message)
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.error('\n⚠️  Table product_variants_new does NOT exist!')
        console.error('💡 Action: Run database/product_variants_new.sql in Supabase SQL Editor\n')
        return false
      }
      return false
    }

    console.log(`✅ Table exists with ${count || 0} existing variants`)
    return true
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

// Step 4: Check if we have any products to test with
async function getTestProduct() {
  console.log('\n🎯 Step 4: Finding a test product')
  console.log('─'.repeat(60))

  try {
    const { data: products, error } = await supabase
      .from('products_new')
      .select('id, name, slug, base_price')
      .limit(1)
      .single()

    if (error) {
      console.error('❌ No products found:', error.message)
      console.error('💡 Action: Create a product first before testing variants\n')
      return null
    }

    console.log('✅ Found test product:', products.name)
    console.log('   ID:', products.id)
    console.log('   Slug:', products.slug)
    console.log('   Base Price:', products.base_price)
    return products
  } catch (error) {
    console.error('❌ Error fetching product:', error)
    return null
  }
}

// Step 5: Test creating a variant
async function testVariantCreation(productId) {
  console.log('\n💾 Step 5: Testing Variant Creation')
  console.log('─'.repeat(60))

  const testVariant = {
    product_id: productId,
    size: 'TEST-SIZE',
    color: 'TEST-COLOR',
    material: 'TEST-MATERIAL',
    price_adjustment: 5.0,
    sku: `TEST-${Date.now()}`,
    stock_quantity: 10,
    is_available: true,
  }

  console.log('Creating test variant:', {
    size: testVariant.size,
    color: testVariant.color,
    sku: testVariant.sku,
  })

  try {
    const { data, error } = await supabase
      .from('product_variants_new')
      .insert([testVariant])
      .select()
      .single()

    if (error) {
      console.error('\n❌ FAILED TO CREATE VARIANT')
      console.error('Error Code:', error.code)
      console.error('Error Message:', error.message)
      console.error('Error Details:', error.details)
      console.error('Error Hint:', error.hint)

      // Analyze common errors
      if (error.code === '42501') {
        console.error('\n🔒 RLS POLICY BLOCKING INSERT')
        console.error('The service role is being blocked by Row Level Security.')
        console.error('💡 Fix: Check RLS policies on product_variants_new table')
      } else if (error.code === '23503') {
        console.error('\n🔗 FOREIGN KEY VIOLATION')
        console.error('The product_id does not exist in products_new table.')
      } else if (error.code === '23505') {
        console.error('\n🔁 DUPLICATE VARIANT')
        console.error('A variant with this combination already exists.')
      }

      console.error('\n')
      return false
    }

    console.log('\n✅ SUCCESS! Variant created:')
    console.log('   ID:', data.id)
    console.log('   SKU:', data.sku)
    console.log('   Size:', data.size)
    console.log('   Color:', data.color)

    // Clean up test variant
    console.log('\n🧹 Cleaning up test variant...')
    const { error: deleteError } = await supabase
      .from('product_variants_new')
      .delete()
      .eq('id', data.id)

    if (deleteError) {
      console.warn('⚠️  Could not delete test variant:', deleteError.message)
    } else {
      console.log('✅ Test variant deleted')
    }

    return true
  } catch (error) {
    console.error('\n❌ Unexpected error during creation:', error)
    return false
  }
}

// Step 6: Check RLS policies
async function checkRLSPolicies() {
  console.log('\n🔒 Step 6: Checking RLS Policies')
  console.log('─'.repeat(60))

  try {
    const { data, error } = await supabase.rpc('exec', {
      sql: `
        SELECT 
          schemaname, 
          tablename, 
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE tablename = 'product_variants_new';
      `
    })

    if (error && !error.message.includes('function')) {
      // RPC might not exist, that's okay
      console.log('⚠️  Cannot query policies directly (no exec function)')
      console.log('💡 Check policies manually in Supabase Dashboard → Database → product_variants_new → Policies')
      return
    }

    if (data && data.length > 0) {
      console.log(`Found ${data.length} RLS policies:`)
      data.forEach((policy, i) => {
        console.log(`\n${i + 1}. ${policy.policyname}`)
        console.log(`   Command: ${policy.cmd}`)
        console.log(`   Roles: ${policy.roles}`)
      })
    }
  } catch (error) {
    console.log('⚠️  RPC query not available, skipping policy check')
  }
}

// Run all tests
async function runTests() {
  console.log('\n')
  
  // Check table
  const tableExists = await checkTableExists()
  if (!tableExists) {
    console.error('\n❌ CRITICAL: Table does not exist. Cannot proceed.\n')
    process.exit(1)
  }

  // Check RLS policies
  await checkRLSPolicies()

  // Get test product
  const product = await getTestProduct()
  if (!product) {
    console.error('\n❌ CRITICAL: No products found. Cannot test variants.\n')
    process.exit(1)
  }

  // Test variant creation
  const success = await testVariantCreation(product.id)

  // Summary
  console.log('\n')
  console.log('═'.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('═'.repeat(60))
  console.log('Table Exists:', tableExists ? '✅' : '❌')
  console.log('Product Found:', product ? '✅' : '❌')
  console.log('Variant Creation:', success ? '✅ WORKING' : '❌ BROKEN')
  console.log('═'.repeat(60))
  
  if (success) {
    console.log('\n🎉 All tests passed! Variation system is functional.')
    console.log('💡 If UI still broken, check frontend console for errors.\n')
  } else {
    console.log('\n❌ Variation creation is broken!')
    console.log('💡 Review error messages above to identify the issue.\n')
    process.exit(1)
  }
}

// Execute
runTests().catch((error) => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})

