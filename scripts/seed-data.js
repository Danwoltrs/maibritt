const { createClient } = require('@supabase/supabase-js')

// This uses the same credentials from your config
const supabaseUrl = 'https://fpzhswuivxkrtyrxussw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwemhzd3VpdnhrcnR5cnh1c3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwODM0NzMsImV4cCI6MjA3NDY1OTQ3M30.3yKVC4cEaJQAcix3WcdqWmWb-oNx28wev3pfOTaDJ2g'

const supabase = createClient(supabaseUrl, supabaseKey)

const mockArtworks = [
  {
    title_pt: 'Azul no Negro',
    title_en: 'Blue in Black',
    year: 2015,
    medium_pt: 'Acrílica sobre tela',
    medium_en: 'Acrylic on canvas',
    dimensions: '120 x 100 cm',
    description_pt: 'Obra inspirada na expedição ao Rio Negro, Amazônia. A cor azul emerge do negro profundo das águas amazônicas.',
    description_en: 'Work inspired by the Rio Negro expedition, Amazon. Blue emerges from the deep black of Amazonian waters.',
    category: 'painting',
    images: [
      {
        original: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=1200',
        display: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=300'
      }
    ],
    for_sale: true,
    price: 15000,
    currency: 'BRL',
    is_available: true,
    featured: true,
    display_order: 1
  },
  {
    title_pt: 'Confluências',
    title_en: 'Confluences',
    year: 2019,
    medium_pt: 'Acrílica sobre linho',
    medium_en: 'Acrylic on linen',
    dimensions: '150 x 120 cm',
    description_pt: 'Encontros de culturas e paisagens em uma única tela. O diálogo entre o Brasil e a Dinamarca.',
    description_en: 'Cultural and landscape convergences on a single canvas. The dialogue between Brazil and Denmark.',
    category: 'painting',
    images: [
      {
        original: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200',
        display: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=300'
      }
    ],
    for_sale: true,
    price: 22000,
    currency: 'BRL',
    is_available: true,
    featured: true,
    display_order: 2
  },
  {
    title_pt: 'Fragmentos do Real',
    title_en: 'Fragments of Reality',
    year: 2022,
    medium_pt: 'Técnica mista sobre tela',
    medium_en: 'Mixed media on canvas',
    dimensions: '100 x 80 cm',
    description_pt: 'Criada durante residência artística no Brooklyn. Fragmentos de memórias urbanas e naturais.',
    description_en: 'Created during artist residency in Brooklyn. Fragments of urban and natural memories.',
    category: 'mixed-media',
    images: [
      {
        original: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=1200',
        display: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=300'
      }
    ],
    for_sale: false,
    price: null,
    currency: null,
    is_available: true,
    featured: true,
    display_order: 3
  },
  {
    title_pt: 'Paisagem Transcultural',
    title_en: 'Transcultural Landscape',
    year: 2020,
    medium_pt: 'Acrílica sobre tela',
    medium_en: 'Acrylic on canvas',
    dimensions: '130 x 90 cm',
    description_pt: 'Paisagem que transcende fronteiras geográficas e culturais.',
    description_en: 'Landscape that transcends geographical and cultural boundaries.',
    category: 'painting',
    images: [
      {
        original: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200',
        display: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300'
      }
    ],
    for_sale: true,
    price: 18000,
    currency: 'BRL',
    is_available: true,
    featured: false,
    display_order: 4
  },
  {
    title_pt: 'Escultura em Metal I',
    title_en: 'Metal Sculpture I',
    year: 2018,
    medium_pt: 'Ferro e cobre',
    medium_en: 'Iron and copper',
    dimensions: '60 x 40 x 30 cm',
    description_pt: 'Exploração tridimensional das formas orgânicas presentes na natureza brasileira.',
    description_en: 'Three-dimensional exploration of organic forms present in Brazilian nature.',
    category: 'sculpture',
    images: [
      {
        original: 'https://images.unsplash.com/photo-1594736797933-d0a0ba2fe065?w=1200',
        display: 'https://images.unsplash.com/photo-1594736797933-d0a0ba2fe065?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1594736797933-d0a0ba2fe065?w=300'
      }
    ],
    for_sale: true,
    price: 12000,
    currency: 'BRL',
    is_available: true,
    featured: false,
    display_order: 5
  },
  {
    title_pt: 'Gravura Tropical',
    title_en: 'Tropical Engraving',
    year: 2017,
    medium_pt: 'Gravura em metal',
    medium_en: 'Metal engraving',
    dimensions: '50 x 70 cm',
    description_pt: 'Série de gravuras inspiradas na flora tropical brasileira.',
    description_en: 'Series of engravings inspired by Brazilian tropical flora.',
    category: 'engraving',
    images: [
      {
        original: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200',
        display: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
        thumbnail: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300'
      }
    ],
    for_sale: true,
    price: 3500,
    currency: 'BRL',
    is_available: true,
    featured: true,
    display_order: 6
  }
]

const mockExhibitions = [
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

const mockReviews = [
  {
    source: 'Folha de S.Paulo',
    url: 'https://folha.uol.com.br',
    title: 'Mai-Britt Wolthers: A cor como protagonista da narrativa contemporânea',
    excerpt: 'A artista dinamarco-brasileira apresenta em sua nova exposição uma maturidade artística impressionante, onde a cor não apenas preenche espaços, mas conduz o pensamento e cria novas cenas no território entre abstração e representação.',
    author: 'Carlos Silva',
    published_date: '2024-03-15',
    sentiment: 'positive',
    verified: true,
    display_order: 1
  },
  {
    source: 'Arte!Brasileiros',
    url: 'https://artebrasileiros.com.br',
    title: 'Confluências: O diálogo transcultural de Mai-Britt Wolthers',
    excerpt: 'Quatro décadas explorando a confluência entre tradição europeia e a exuberância da paisagem brasileira resultam em obras de impressionante força expressiva.',
    author: 'Marina Santos',
    published_date: '2024-01-20',
    sentiment: 'positive',
    verified: true,
    display_order: 2
  }
]

async function seedData() {
  try {
    console.log('🌱 Starting to seed database...')

    // Clear existing data
    console.log('🧹 Clearing existing data...')
    await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('exhibitions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('artworks').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Insert artworks
    console.log('🎨 Inserting artworks...')
    const { data: artworkData, error: artworkError } = await supabase
      .from('artworks')
      .insert(mockArtworks)
      .select()

    if (artworkError) {
      console.error('Error inserting artworks:', artworkError)
      throw artworkError
    }

    console.log(`✅ Successfully inserted ${artworkData.length} artworks`)

    // Insert exhibitions
    console.log('🏛️ Inserting exhibitions...')
    const { data: exhibitionData, error: exhibitionError } = await supabase
      .from('exhibitions')
      .insert(mockExhibitions)
      .select()

    if (exhibitionError) {
      console.error('Error inserting exhibitions:', exhibitionError)
      throw exhibitionError
    }

    console.log(`✅ Successfully inserted ${exhibitionData.length} exhibitions`)

    // Insert reviews
    console.log('📝 Inserting reviews...')
    const { data: reviewData, error: reviewError } = await supabase
      .from('reviews')
      .insert(mockReviews)
      .select()

    if (reviewError) {
      console.error('Error inserting reviews:', reviewError)
      throw reviewError
    }

    console.log(`✅ Successfully inserted ${reviewData.length} reviews`)

    console.log('🎉 Database seeding completed successfully!')
    console.log('🌐 You can now visit http://localhost:3000 to see the website with data')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Run the seed function
seedData()