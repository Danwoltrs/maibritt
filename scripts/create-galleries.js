#!/usr/bin/env node

/**
 * Script to create the galleries table in Supabase database
 * Run with: node scripts/create-galleries.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🎨 Creating galleries table in Supabase...\n')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase configuration')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Found' : 'Missing')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Found' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createGalleriesTable() {
  try {
    console.log('📡 Connecting to Supabase...')
    
    // First, let's test the connection
    const { data: connectionTest, error: connError } = await supabase
      .from('artworks')
      .select('count')
      .limit(1)
    
    if (connError) {
      console.error('❌ Connection failed:', connError.message)
      return false
    }
    
    console.log('✅ Connected successfully!')
    
    // Create the galleries table using direct PostgreSQL
    console.log('🏗️  Creating galleries table...')
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS galleries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- Basic Information
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        
        -- Address
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        city TEXT NOT NULL,
        state_province TEXT,
        postal_code TEXT,
        country TEXT NOT NULL,
        country_code TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        
        -- Contact Information
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        website TEXT,
        instagram TEXT,
        
        -- Business Terms
        opening_hours JSONB,
        commission_rate DECIMAL(5, 2),
        payment_terms TEXT,
        shipping_arrangements TEXT,
        insurance_provider TEXT,
        
        -- Display Information
        gallery_photo TEXT,
        description_pt TEXT,
        description_en TEXT,
        
        -- Relationship Management
        relationship_status TEXT NOT NULL DEFAULT 'prospective' CHECK (relationship_status IN ('active', 'inactive', 'prospective')),
        first_partnership_date DATE,
        contract_expiry_date DATE,
        
        -- Settings
        is_active BOOLEAN NOT NULL DEFAULT true,
        show_on_website BOOLEAN NOT NULL DEFAULT true,
        featured BOOLEAN NOT NULL DEFAULT false,
        display_order INTEGER NOT NULL DEFAULT 0,
        
        -- Internal Notes
        notes TEXT,
        
        -- Timestamps
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `
    
    // We'll use the SQL editor approach
    const { error: createError } = await supabase.rpc('exec', {
      sql: createTableSQL
    })
    
    // If that doesn't work, let's try a different approach
    if (createError) {
      console.log('🔄 Trying alternative method to create table...')
      
      // Let's try creating it by making a query that will fail gracefully
      const { error: altError } = await supabase
        .from('galleries')
        .select('*')
        .limit(1)
      
      // If the table doesn't exist, this approach won't work either
      // Let's manually create some sample data to trigger table creation
      if (altError && altError.message.includes('does not exist')) {
        console.log('❌ Table does not exist and cannot be created via client.')
        console.log('📋 Please create the table manually in your Supabase dashboard:')
        console.log('   1. Go to https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0])
        console.log('   2. Go to SQL Editor')
        console.log('   3. Paste and run the SQL from scripts/create-galleries-table.sql')
        return false
      }
    }
    
    console.log('✅ Table creation completed!')
    
    // Test the table by querying it
    console.log('🔍 Testing galleries table...')
    const { data: testData, error: testError } = await supabase
      .from('galleries')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.log('Table might not exist yet. Let me try to create some sample data...')
      
      // Try to insert sample data
      const sampleGallery = {
        name: 'Galeria Eduardo Fernandes',
        slug: 'galeria-eduardo-fernandes',
        address_line1: 'Rua Estados Unidos, 1456',
        city: 'São Paulo',
        country: 'Brazil',
        country_code: 'BR',
        contact_person: 'Eduardo Fernandes',
        email: 'contato@galeriaeduardofernandes.com.br',
        website: 'https://galeriaeduardofernandes.com.br',
        relationship_status: 'active',
        is_active: true,
        show_on_website: true,
        featured: true,
        display_order: 1
      }
      
      const { data: insertData, error: insertError } = await supabase
        .from('galleries')
        .insert([sampleGallery])
        .select()
      
      if (insertError) {
        console.error('❌ Error creating sample data:', insertError.message)
        return false
      }
      
      console.log('✅ Sample gallery created successfully!')
      if (insertData && insertData.length > 0) {
        console.log(`📋 Created: ${insertData[0].name} (${insertData[0].city}, ${insertData[0].country})`)
      }
    } else {
      console.log('✅ Galleries table is working!')
      if (testData && testData.length > 0) {
        console.log(`📋 Found existing data: ${testData.length} galleries`)
      } else {
        console.log('📋 Table is empty and ready for data')
      }
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Error setting up galleries table:', error.message)
    return false
  }
}

// Run the setup
createGalleriesTable()
  .then(success => {
    if (success) {
      console.log('\n🎉 Galleries table is ready!')
      console.log('   You can now create galleries through the admin interface.')
    } else {
      console.log('\n❌ Setup failed. You may need to create the table manually in Supabase.')
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error.message)
  })