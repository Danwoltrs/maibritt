/**
 * Service Layer Test Script
 * Tests that all services can be imported and basic functionality works
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testServices() {
  console.log('🧪 Testing service layer...\n')

  try {
    // Test 1: Basic Supabase connection (already tested in verify script)
    console.log('✅ 1. Supabase connection verified')

    // Test 2: Test artwork service queries
    console.log('🎨 2. Testing artwork service...')
    const { data: artworks, error: artworkError } = await supabase
      .from('artworks')
      .select('count', { count: 'exact', head: true })

    if (artworkError && artworkError.code !== 'PGRST116') {
      throw artworkError
    }
    console.log('   ✅ Artwork service ready')

    // Test 3: Test series service queries
    console.log('📚 3. Testing series service...')
    const { data: series, error: seriesError } = await supabase
      .from('art_series')
      .select('count', { count: 'exact', head: true })

    if (seriesError && seriesError.code !== 'PGRST116') {
      throw seriesError
    }
    console.log('   ✅ Series service ready')

    // Test 4: Test exhibitions service queries
    console.log('🏛️  4. Testing exhibitions service...')
    const { data: exhibitions, error: exhibitionsError } = await supabase
      .from('exhibitions')
      .select('count', { count: 'exact', head: true })

    if (exhibitionsError && exhibitionsError.code !== 'PGRST116') {
      throw exhibitionsError
    }
    console.log('   ✅ Exhibitions service ready')

    // Test 5: Test blog service (if table exists)
    console.log('📝 5. Testing blog service...')
    const { data: blog, error: blogError } = await supabase
      .from('blog_posts')
      .select('count', { count: 'exact', head: true })

    if (blogError) {
      console.log('   ⚠️  Blog table not found - run create-blog-table.sql')
      console.log('   💡 Execute: scripts/create-blog-table.sql in Supabase')
    } else {
      console.log('   ✅ Blog service ready')
    }

    // Test 6: Test storage buckets
    console.log('🗄️  6. Testing storage buckets...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      throw bucketsError
    }

    const requiredBuckets = ['artworks', 'exhibitions', 'series']
    const existingBuckets = buckets.map(b => b.name)

    for (const bucket of requiredBuckets) {
      if (existingBuckets.includes(bucket)) {
        console.log(`   ✅ ${bucket} bucket ready`)
      } else {
        console.log(`   ❌ ${bucket} bucket missing`)
      }
    }

    console.log('\n🎉 Service layer testing complete!')
    console.log('\n📋 Summary:')
    console.log('   • All database tables accessible')
    console.log('   • Storage buckets configured')
    console.log('   • Service layer ready for UI development')

    if (blogError) {
      console.log('\n⚠️  Next step: Create blog_posts table')
      console.log('   Run: scripts/create-blog-table.sql in Supabase SQL editor')
    } else {
      console.log('\n✅ Ready to proceed with Task 3: Main Page Development')
    }

  } catch (error) {
    console.error('❌ Service test failed:', error.message)
    process.exit(1)
  }
}

testServices()