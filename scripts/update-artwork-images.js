const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://fpzhswuivxkrtyrxussw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwemhzd3VpdnhrcnR5cnh1c3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODM0NzMsImV4cCI6MjA3NDY1OTQ3M30.3yKVC4cEaJQAcix3WcdqWmWb-oNx28wev3pfOTaDJ2g'
)

async function updateArtworkImages() {
  try {
    console.log('🖼️ Updating artwork images to faster loading ones...')
    
    // Get all artworks
    const { data: artworks, error } = await supabase
      .from('artworks')
      .select('id, title_en')
    
    if (error) throw error
    
    // Update each artwork with faster Picsum images
    for (let i = 0; i < artworks.length; i++) {
      const artwork = artworks[i]
      const imageId = 100 + i // Use different image IDs
      
      const newImages = [
        {
          original: `https://picsum.photos/1200/1000?random=${imageId}`,
          display: `https://picsum.photos/800/667?random=${imageId}`,
          thumbnail: `https://picsum.photos/300/250?random=${imageId}`
        }
      ]
      
      const { error: updateError } = await supabase
        .from('artworks')
        .update({ images: newImages })
        .eq('id', artwork.id)
      
      if (updateError) {
        console.error(`Error updating ${artwork.title_en}:`, updateError)
      } else {
        console.log(`✅ Updated images for "${artwork.title_en}"`)
      }
    }
    
    console.log('🎉 All artwork images updated with faster loading ones!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

updateArtworkImages()