/**
 * Supabase Verification Script
 * Tests connection and lists existing tables and buckets
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifySupabase() {
  console.log('🔍 Verifying Supabase connection...\n')

  try {
    // Test basic connection
    console.log('📡 Testing connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('artworks')
      .select('count', { count: 'exact', head: true })

    if (connectionError && connectionError.code !== 'PGRST116') {
      throw connectionError
    }

    console.log('✅ Connection successful!\n')

    // List all tables
    console.log('📋 Checking existing tables...')
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables')
      .then(result => result)
      .catch(async () => {
        // Fallback: try to query each expected table
        const expectedTables = ['artworks', 'art_series', 'exhibitions', 'reviews', 'orders', 'sale_history']
        const existingTables = []

        for (const table of expectedTables) {
          try {
            await supabase.from(table).select('count', { count: 'exact', head: true })
            existingTables.push(table)
            console.log(`  ✅ ${table}`)
          } catch (err) {
            console.log(`  ❌ ${table} - ${err.message}`)
          }
        }

        return { data: existingTables }
      })

    // Check storage buckets
    console.log('\n🗄️  Checking storage buckets...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      console.log('❌ Error checking buckets:', bucketsError.message)
    } else {
      buckets.forEach(bucket => {
        console.log(`  ✅ ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
      })
    }

    // Test artwork table structure
    console.log('\n🎨 Testing artworks table structure...')
    const { data: artworkSample, error: artworkError } = await supabase
      .from('artworks')
      .select('*')
      .limit(1)

    if (artworkError) {
      console.log('❌ Artworks table error:', artworkError.message)
    } else {
      console.log('✅ Artworks table accessible')
      if (artworkSample.length > 0) {
        console.log('📝 Sample artwork structure:', Object.keys(artworkSample[0]))
      } else {
        console.log('📝 Artworks table is empty (ready for data)')
      }
    }

    // Test blog posts table (if exists)
    console.log('\n📝 Testing blog_posts table...')
    const { data: blogSample, error: blogError } = await supabase
      .from('blog_posts')
      .select('*')
      .limit(1)

    if (blogError) {
      console.log('❌ Blog posts table not found - will need to create it')
      console.log('   Error:', blogError.message)
    } else {
      console.log('✅ Blog posts table exists and accessible')
    }

    console.log('\n🎉 Supabase verification complete!')

  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    process.exit(1)
  }
}

verifySupabase()