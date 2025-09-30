#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Checking for missing tables...\n')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const expectedTables = [
  'artworks',
  'galleries', 
  'countries', // for the countries endpoint error
  'art_series',
  'blog_posts'
]

async function checkTables() {
  console.log('📋 Checking tables...\n')
  
  const results = {}
  
  for (const tableName of expectedTables) {
    try {
      console.log(`Checking ${tableName}...`)
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
          results[tableName] = { exists: false, error: 'Table does not exist' }
          console.log(`  ❌ Missing: ${tableName}`)
        } else {
          results[tableName] = { exists: true, error: error.message }
          console.log(`  ⚠️  Exists but has error: ${tableName} - ${error.message}`)
        }
      } else {
        results[tableName] = { exists: true, count: data?.length || 0 }
        console.log(`  ✅ Exists: ${tableName} (${data?.length || 0} records)`)
      }
    } catch (err) {
      results[tableName] = { exists: false, error: err.message }
      console.log(`  ❌ Error checking ${tableName}: ${err.message}`)
    }
  }
  
  console.log('\n📊 Summary:')
  console.log('='.repeat(50))
  
  const missing = []
  const existing = []
  
  for (const [table, result] of Object.entries(results)) {
    if (result.exists) {
      existing.push(table)
      console.log(`✅ ${table}: Ready to use`)
    } else {
      missing.push(table)
      console.log(`❌ ${table}: ${result.error}`)
    }
  }
  
  if (missing.length > 0) {
    console.log('\n🚨 Missing tables that need to be created:')
    missing.forEach(table => {
      console.log(`   • ${table}`)
      
      if (table === 'galleries') {
        console.log('     -> Use scripts/create-galleries-table.sql')
      } else if (table === 'countries') {
        console.log('     -> This might be a virtual table or view needed for the countries endpoint')
      } else {
        console.log(`     -> Create table for ${table} functionality`)
      }
    })
    
    console.log('\n📝 Next steps:')
    console.log('1. Go to https://supabase.com/dashboard/project/fpzhswuivxkrtyrxussw')
    console.log('2. Navigate to SQL Editor')  
    console.log('3. Run the SQL scripts for missing tables')
  } else {
    console.log('\n🎉 All tables exist! Gallery creation should work now.')
  }
}

checkTables()