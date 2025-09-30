const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://fpzhswuivxkrtyrxussw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwemhzd3VpdnhrcnR5cnh1c3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODM0NzMsImV4cCI6MjA3NDY1OTQ3M30.3yKVC4cEaJQAcix3WcdqWmWb-oNx28wev3pfOTaDJ2g'
)

const exhibitions = [
  {
    title: 'Mai-Britt Wolthers e a Cor Protagonista',
    venue: 'Pinacoteca Benedicto Calixto',
    location: 'Santos, Brazil',
    year: 2025,
    type: 'solo',
    description: 'Retrospectiva de 40 anos de carreira artística, com foco na cor como elemento narrativo principal.',
    image: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=600',
    featured: true,
    display_order: 1
  },
  {
    title: 'Fragmentos do Real',
    venue: 'Mothership Studio',
    location: 'Brooklyn, NY',
    year: 2022,
    type: 'residency',
    description: 'Residência artística que resultou em nova série de obras explorando a dualidade cultural.',
    image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600',
    featured: true,
    display_order: 2
  },
  {
    title: 'Kunstnernes Efterårsudstilling',
    venue: 'Charlottenborg',
    location: 'Copenhagen, Denmark',
    year: 2021,
    type: 'group',
    description: 'Participação na prestigiosa exposição de outono dos artistas dinamarqueses.',
    image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=600',
    featured: false,
    display_order: 3
  },
  {
    title: 'Confluências',
    venue: 'Galeria Eduardo Fernandes',
    location: 'São Paulo, Brazil',
    year: 2019,
    type: 'solo',
    description: 'Exposição individual explorando os encontros entre culturas e paisagens.',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600',
    featured: true,
    display_order: 4
  },
  {
    title: 'I\'m Rosa',
    venue: 'Lamb-arts Gallery',
    location: 'London, UK',
    year: 2016,
    type: 'group',
    description: 'Exposição coletiva internacional com foco em artistas contemporâneos.',
    image: 'https://images.unsplash.com/photo-1594736797933-d0a0ba2fe065?w=600',
    featured: false,
    display_order: 5
  }
]

async function createExhibitionsData() {
  try {
    console.log('🏛️ Inserting exhibitions data...')
    
    // Try to insert exhibitions
    const { data, error } = await supabase
      .from('exhibitions')
      .insert(exhibitions)
      .select()

    if (error) {
      console.log('Error (table might not exist):', error.message)
      console.log('ℹ️  The exhibitions table may need to be created in the Supabase dashboard')
      console.log('ℹ️  Go to your Supabase project > SQL Editor and run the create-exhibitions-table.sql script')
      return
    }

    console.log(`✅ Successfully inserted ${data.length} exhibitions`)
    console.log('🎉 Exhibitions data ready!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

createExhibitionsData()