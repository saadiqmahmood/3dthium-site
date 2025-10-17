const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testOrders() {
  console.log('Testing orders functionality...')

  try {
    // Check if there are any orders in the database
    const { data: orders, error: ordersError } = await supabase.from('orders').select('*').limit(5)

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return
    }

    console.log('Orders found:', orders.length)
    console.log('Sample orders:', orders)

    // Check if there are any users in the database
    const { data: users, error: usersError } = await supabase.from('users').select('*').limit(5)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }

    console.log('Users found:', users.length)
    console.log('Sample users:', users)

    // Check if there are any checkout carts
    const { data: checkoutCarts, error: cartsError } = await supabase
      .from('checkout_carts')
      .select('*')
      .limit(5)

    if (cartsError) {
      console.error('Error fetching checkout carts:', cartsError)
      return
    }

    console.log('Checkout carts found:', checkoutCarts.length)
    console.log('Sample checkout carts:', checkoutCarts)
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testOrders()
