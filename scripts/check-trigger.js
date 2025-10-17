const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTrigger() {
  console.log('Checking user creation trigger...')

  try {
    // Check if trigger exists
    const { data: triggers, error: triggerError } = await supabase.rpc('check_trigger_exists', {
      trigger_name: 'on_auth_user_created',
    })

    if (triggerError) {
      console.log('Using direct query to check trigger...')
      const { data, error } = await supabase
        .from('information_schema.triggers')
        .select('*')
        .eq('trigger_name', 'on_auth_user_created')

      if (error) {
        console.error('Error checking trigger:', error)
        return
      }

      console.log('Trigger data:', data)
    } else {
      console.log('Trigger exists:', triggers)
    }

    // Check if function exists
    const { data: functions, error: functionError } = await supabase
      .from('information_schema.routines')
      .select('*')
      .eq('routine_name', 'handle_new_user')

    if (functionError) {
      console.error('Error checking function:', functionError)
      return
    }

    console.log('Function data:', functions)

    // Check auth users vs public users
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')

    if (authError) {
      console.error('Error fetching auth users:', authError)
      return
    }

    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, auth_user_id, email, created_at')

    if (publicError) {
      console.error('Error fetching public users:', publicError)
      return
    }

    console.log(`Auth users: ${authUsers.length}`)
    console.log(`Public users: ${publicUsers.length}`)

    // Find missing users
    const missingUsers = authUsers.filter(
      (authUser) => !publicUsers.some((publicUser) => publicUser.auth_user_id === authUser.id)
    )

    console.log('Missing users in public.users table:')
    missingUsers.forEach((user) => {
      console.log(`- ${user.email} (${user.id})`)
    })
  } catch (error) {
    console.error('Script error:', error)
  }
}

checkTrigger()
