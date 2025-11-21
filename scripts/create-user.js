// Script to create Mai-Britt's user account
// Run with: node scripts/create-user.js

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables')
  console.log('SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING')
  console.log('SERVICE_ROLE_KEY:', serviceRoleKey ? 'SET' : 'MISSING')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createUser() {
  try {
    console.log('Creating user account for Mai-Britt...')

    const { data, error } = await supabase.auth.admin.createUser({
      email: 'maiwolthers@gmail.com',
      password: 'Bubber1$',
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        name: 'Mai-Britt Wolthers',
        role: 'artist'
      }
    })

    if (error) {
      console.error('Error creating user:', error.message)
      return
    }

    console.log('✅ User created successfully!')
    console.log('Email:', data.user.email)
    console.log('User ID:', data.user.id)
    console.log('Created at:', data.user.created_at)

    console.log('\n📱 You can now login at:')
    console.log('Local: http://localhost:3007/login')
    console.log('Production: https://your-vercel-url.vercel.app/login')
    console.log('\nCredentials:')
    console.log('Email: maiwolthers@gmail.com')
    console.log('Password: Bubber1$')

  } catch (error) {
    console.error('Script error:', error)
  }
}

createUser()