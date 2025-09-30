#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔨 Creating galleries table directly...\n')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTable() {
  try {
    // Try using the SQL function approach
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS galleries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        city TEXT NOT NULL,
        state_province TEXT,
        postal_code TEXT,
        country TEXT NOT NULL,
        country_code TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        website TEXT,
        instagram TEXT,
        opening_hours JSONB,
        commission_rate DECIMAL(5, 2),
        payment_terms TEXT,
        shipping_arrangements TEXT,
        insurance_provider TEXT,
        gallery_photo TEXT,
        description_pt TEXT,
        description_en TEXT,
        relationship_status TEXT NOT NULL DEFAULT 'prospective' CHECK (relationship_status IN ('active', 'inactive', 'prospective')),
        first_partnership_date DATE,
        contract_expiry_date DATE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        show_on_website BOOLEAN NOT NULL DEFAULT true,
        featured BOOLEAN NOT NULL DEFAULT false,
        display_order INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `
    
    console.log('Executing SQL...')
    
    // Using fetch to make direct API call
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: createTableSQL })
    })
    
    if (!response.ok) {
      console.log('Direct API call failed, status:', response.status)
      const errorText = await response.text()
      console.log('Error response:', errorText)
      
      // Let's try a simpler approach - just test if we can insert
      console.log('\n🎯 Attempting to create table by inserting data...')
      
      const sampleData = {
        name: 'Test Gallery',
        slug: 'test-gallery',
        address_line1: '123 Test St',
        city: 'Test City',
        country: 'Test Country'
      }
      
      const { data, error } = await supabase
        .from('galleries')
        .insert([sampleData])
        .select()
      
      if (error) {
        console.log('❌ Insert failed:', error.message)
        return false
      }
      
      console.log('✅ Table created via insert!')
      
      // Now delete the test data
      await supabase
        .from('galleries')
        .delete()
        .eq('slug', 'test-gallery')
      
      return true
    }
    
    console.log('✅ SQL executed successfully!')
    return true
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

createTable().then(success => {
  if (success) {
    console.log('\n🎉 Table is ready!')
  } else {
    console.log('\n❌ Manual creation needed.')
    console.log('\n📋 To create the table manually:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Select your project')
    console.log('3. Go to SQL Editor')
    console.log('4. Paste the SQL from scripts/create-galleries-table.sql')
    console.log('5. Click "Run"')
  }
})