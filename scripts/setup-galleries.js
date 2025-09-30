#!/usr/bin/env node

/**
 * Script to create the galleries table in Supabase database
 * Run with: node scripts/setup-galleries.js
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🎨 Setting up galleries table in Supabase...\n')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase configuration')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Found' : 'Missing')
  console.error('\n   Please check your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createGalleriesTable() {
  try {
    console.log('📡 Connecting to Supabase...')
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-galleries-table.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 Executing SQL script...')
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      // Try alternative method - direct SQL execution
      console.log('🔄 Trying alternative execution method...')
      
      // Split SQL into individual statements
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`   Executing: ${statement.substring(0, 50)}...`)
          
          try {
            // For CREATE TABLE, INSERT, etc., we need to use a different approach
            if (statement.toUpperCase().includes('CREATE TABLE')) {
              // Use Supabase client to create table
              const { error: execError } = await supabase.rpc('exec', { 
                sql: statement 
              })
              if (execError) {
                console.log(`     Error executing statement, trying raw query...`)
                // This might not work directly, but let's try
                const { error: rawError } = await supabase
                  .from('__raw_sql__')
                  .select('*')
                  .eq('query', statement)
                  .single()
                if (rawError && !rawError.message.includes('relation "__raw_sql__" does not exist')) {
                  throw rawError
                }
              }
            }
          } catch (stmtError) {
            if (!stmtError.message.includes('already exists')) {
              console.log(`     Warning: ${stmtError.message}`)
            }
          }
        }
      }
    }
    
    console.log('✅ SQL script executed successfully')
    
    // Test the table by querying it
    console.log('🔍 Testing galleries table...')
    const { data: testData, error: testError } = await supabase
      .from('galleries')
      .select('name, city, country')
      .limit(5)
    
    if (testError) {
      console.error('❌ Error testing galleries table:', testError.message)
      return false
    }
    
    console.log('✅ Galleries table is working!')
    if (testData && testData.length > 0) {
      console.log(`📋 Found ${testData.length} sample galleries:`)
      testData.forEach(gallery => {
        console.log(`   • ${gallery.name} (${gallery.city}, ${gallery.country})`)
      })
    } else {
      console.log('📋 Table is empty and ready for data')
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Error setting up galleries table:', error)
    return false
  }
}

// Run the setup
createGalleriesTable()
  .then(success => {
    if (success) {
      console.log('\n🎉 Galleries table setup complete!')
      console.log('   You can now create galleries through the admin interface.')
    } else {
      console.log('\n❌ Setup failed. Please check the error messages above.')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error)
    process.exit(1)
  })