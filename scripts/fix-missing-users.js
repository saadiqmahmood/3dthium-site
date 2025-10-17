const { supabaseAdmin } = require('../lib/supabaseClient')

async function fixMissingUsers() {
  console.log('Fixing missing users...')

  // The specific missing users you mentioned
  const missingUsers = [
    {
      auth_user_id: '96070da1-f7a3-46bc-987c-d8329d7767c4',
      email: 'saadiqamahmood@icloud.com',
      created_at: '2025-07-09 20:31:24.194459+00',
    },
    {
      auth_user_id: '166921ba-84bb-4c33-ac97-ac5c719deea0',
      email: 'info@3dthium.co.uk',
      created_at: '2025-07-09 17:26:23.757635+00',
    },
  ]

  try {
    // Create missing users
    for (const user of missingUsers) {
      console.log(`Creating user record for ${user.email}...`)

      const { data, error } = await supabaseAdmin.from('users').insert({
        auth_user_id: user.auth_user_id,
        email: user.email,
        created_at: user.created_at,
        is_admin: false, // Default to false, you can update manually if needed
      })

      if (error) {
        console.error(`Error creating user ${user.email}:`, error)
      } else {
        console.log(`✅ Created user record for ${user.email}`)
      }
    }

    console.log('✅ Finished fixing missing users')
  } catch (error) {
    console.error('Script error:', error)
  }
}

fixMissingUsers()
