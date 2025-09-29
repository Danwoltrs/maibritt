#!/usr/bin/env node

/**
 * Setup Supabase Storage Policies for Artwork Upload
 * 
 * This script sets up the necessary Row Level Security (RLS) policies 
 * for the Supabase storage bucket to allow authenticated users to upload
 * artwork images.
 * 
 * Run this script once after setting up your Supabase project.
 */

const fs = require('fs')
const path = require('path')

console.log('🎨 Mai-Britt Wolthers - Artwork Storage Setup')
console.log('=' .repeat(50))
console.log()

// Read the storage policies SQL file
const sqlFilePath = path.join(__dirname, '../src/lib/storage-policies.sql')

if (!fs.existsSync(sqlFilePath)) {
  console.error('❌ Error: storage-policies.sql file not found!')
  console.error('   Expected location:', sqlFilePath)
  process.exit(1)
}

const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')

console.log('📋 Instructions for setting up Storage Policies:')
console.log()
console.log('1. Go to your Supabase Dashboard')
console.log('2. Navigate to: SQL Editor')  
console.log('3. Create a new query')
console.log('4. Copy and paste the following SQL:')
console.log()
console.log('─'.repeat(60))
console.log(sqlContent)
console.log('─'.repeat(60))
console.log()
console.log('5. Click "Run" to execute the policies')
console.log()
console.log('✅ After running the SQL, your artwork upload should work!')
console.log()
console.log('🔧 Troubleshooting:')
console.log('   - Make sure you are logged in as an authenticated user')
console.log('   - Check that RLS is enabled on storage.objects')
console.log('   - Verify the artworks bucket exists and is public')
console.log()
console.log('📁 This will create:')
console.log('   ✓ artworks bucket (public for viewing)')
console.log('   ✓ Upload permissions for authenticated users') 
console.log('   ✓ Public read access for artwork display')
console.log('   ✓ Update/delete permissions for file management')

// Also save a copy for easy access
const outputPath = path.join(__dirname, 'storage-policies-to-run.sql')
fs.writeFileSync(outputPath, sqlContent)
console.log()
console.log(`📄 SQL saved to: ${outputPath}`)
console.log('   You can also run this file directly in Supabase Dashboard')