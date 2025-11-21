-- Populate sample exhibitions and series data for Mai-Britt Wolthers
-- Based on her actual exhibition history and artistic journey

-- Insert Exhibitions (Solo shows, group exhibitions, and residencies)
INSERT INTO exhibitions (title, venue, location, year, type, description, featured, display_order)
VALUES
  (
    'Mai-Britt Wolthers e a Cor Protagonista',
    'Pinacoteca Benedicto Calixto',
    'Santos, Brazil',
    2025,
    'solo',
    'A comprehensive solo exhibition exploring color as the narrative protagonist in contemporary art. Featuring landscapes and mixed media works that bridge European tradition with Brazilian exuberance.',
    true,
    0
  ),
  (
    'Artist Residency - Fragmentos do Real',
    'Mothership Studio',
    'Brooklyn, NY',
    2022,
    'residency',
    'Artist residency exploring the fragmentation of reality through transcultural perspectives. Created new works examining urban landscapes and memory in the context of Brazilian-American cultural exchange.',
    true,
    0
  ),
  (
    'Kunstnernes Efterårsudstilling',
    'Charlottenborg',
    'Copenhagen, Denmark',
    2021,
    'group',
    'Participation in the prestigious autumn exhibition at Charlottenborg, showcasing contemporary works that explore the intersection of Nordic and Brazilian landscapes.',
    false,
    0
  ),
  (
    'Confluências',
    'Galeria Eduardo Fernandes',
    'São Paulo, Brazil',
    2019,
    'solo',
    'Solo exhibition exploring the confluence of cultures and landscapes. Works that investigate the meeting points between European tradition and Brazilian contemporary expression.',
    true,
    1
  ),
  (
    'I''m Rosa',
    'Lamb-arts Gallery',
    'London, UK',
    2016,
    'group',
    'International group exhibition featuring contemporary artists exploring themes of identity, color, and cultural memory across diverse geographic contexts.',
    false,
    0
  ),
  (
    'Equações',
    'Centro Cultural São Paulo',
    'São Paulo, Brazil',
    2014,
    'solo',
    'Solo exhibition presenting mathematical equations translated into visual language through painting and mixed media. Exploring the relationship between scientific precision and artistic intuition.',
    false,
    2
  ),
  (
    'Azul no Negro',
    'Gallery Pilar',
    'São Paulo, Brazil',
    2015,
    'solo',
    'Exhibition resulting from the Rio Negro expedition in the Amazon. Artworks capturing the unique blue-black waters and biodiversity of the region through acrylic paintings and video art.',
    false,
    3
  ),
  (
    'Transcultural Dialogues',
    'Danish Cultural Institute',
    'Rio de Janeiro, Brazil',
    2018,
    'group',
    'Group exhibition fostering dialogue between Danish and Brazilian contemporary artists, exploring themes of cultural identity and environmental awareness.',
    false,
    0
  ),
  (
    'Memória da Paisagem',
    'Museu de Arte Contemporânea',
    'Curitiba, Brazil',
    2017,
    'solo',
    'Solo exhibition focusing on landscape memory, featuring works that capture the Atlantic Forest and coastal ecosystems of Brazil through a contemporary lens.',
    false,
    4
  ),
  (
    'Arte Dinamarquesa no Brasil',
    'Instituto Tomie Ohtake',
    'São Paulo, Brazil',
    2013,
    'group',
    'Major survey exhibition of Danish artists working in Brazil, showcasing cross-cultural artistic practices and transcultural perspectives.',
    false,
    1
  ),
  (
    'Cores da Mata Atlântica',
    'Centro Cultural Banco do Brasil',
    'Rio de Janeiro, Brazil',
    2012,
    'solo',
    'Exhibition exploring the vibrant color palette of the Atlantic Forest, combining field research with artistic interpretation of Brazil''s biodiversity.',
    false,
    5
  ),
  (
    'Nordic Perspectives',
    'Louisiana Museum of Modern Art',
    'Humlebæk, Denmark',
    2010,
    'group',
    'Group exhibition featuring Nordic artists exploring global themes. Included works examining Brazilian landscapes through a Scandinavian artistic lens.',
    false,
    2
  ),
  (
    'Travessia Cultural',
    'Galeria Estação',
    'São Paulo, Brazil',
    2008,
    'solo',
    'Solo exhibition marking 20 years living in Brazil, exploring the cultural crossing and artistic evolution through decades of transcultural experience.',
    false,
    6
  ),
  (
    'Bienal Internacional de Arte',
    'Fundação Bienal',
    'São Paulo, Brazil',
    2006,
    'group',
    'Participation in the São Paulo Art Biennial, representing transcultural contemporary art with large-scale landscape paintings.',
    true,
    3
  ),
  (
    'Paisagens Internas',
    'Museu Oscar Niemeyer',
    'Curitiba, Brazil',
    2004,
    'solo',
    'Solo exhibition exploring internal landscapes - the intersection between memory, emotion, and physical geography expressed through color and form.',
    false,
    7
  ),
  (
    'Entre Dois Mundos',
    'Galeria Copenhagen',
    'Copenhagen, Denmark',
    2002,
    'solo',
    'Solo exhibition presented in Denmark after 15 years in Brazil, showcasing works that bridge two cultural worlds through painting and sculpture.',
    false,
    0
  ),
  (
    'Cor e Luz Tropical',
    'Pinacoteca do Estado',
    'São Paulo, Brazil',
    2000,
    'solo',
    'Exhibition focusing on tropical light and color, marking the artist''s deep engagement with Brazilian landscape and chromatic intensity.',
    false,
    8
  )
ON CONFLICT DO NOTHING;

-- Insert Art Series
INSERT INTO art_series (name_pt, name_en, description_pt, description_en, year, is_active, is_seasonal, display_order)
VALUES
  (
    'Azul no Negro',
    'Blue in Black',
    'Série resultante da expedição ao Rio Negro, Amazônia. Explorando as águas únicas azul-escuras e a biodiversidade da região através de pinturas acrílicas, gravuras e videoarte.',
    'Series resulting from the Rio Negro expedition in the Amazon. Exploring the unique blue-black waters and biodiversity of the region through acrylic paintings, engravings, and video art.',
    2015,
    true,
    false,
    0
  ),
  (
    'Confluências',
    'Confluences',
    'Encontros de culturas e paisagens. Investigando os pontos de convergência entre tradição europeia e expressão contemporânea brasileira através de paisagens, esculturas e mídias mistas.',
    'Cultural and landscape convergences. Investigating the meeting points between European tradition and Brazilian contemporary expression through landscapes, sculptures, and mixed media.',
    2019,
    true,
    false,
    1
  ),
  (
    'Fragmentos do Real',
    'Fragments of Reality',
    'Série criada durante residência artística em Brooklyn, NY. Explorando a fragmentação da realidade através de perspectivas transculturais, examinando paisagens urbanas e memória.',
    'Series created during artist residency in Brooklyn, NY. Exploring the fragmentation of reality through transcultural perspectives, examining urban landscapes and memory.',
    2022,
    true,
    false,
    2
  ),
  (
    'Mata Atlântica',
    'Atlantic Forest',
    'Pesquisa de longo prazo sobre o ecossistema da Mata Atlântica. Combinando investigação de campo com interpretação artística da biodiversidade brasileira através de cores vibrantes.',
    'Long-term research on the Atlantic Forest ecosystem. Combining field research with artistic interpretation of Brazilian biodiversity through vibrant colors.',
    2012,
    true,
    false,
    3
  ),
  (
    'Memórias Nórdicas',
    'Nordic Memories',
    'Série explorando memórias e paisagens da Dinamarca através da perspectiva de quatro décadas vivendo no Brasil. Diálogo entre herança cultural nórdica e experiência tropical.',
    'Series exploring memories and landscapes of Denmark through the perspective of four decades living in Brazil. Dialogue between Nordic cultural heritage and tropical experience.',
    2018,
    true,
    false,
    4
  ),
  (
    'Equações Visuais',
    'Visual Equations',
    'Tradução de equações matemáticas em linguagem visual. Explorando a relação entre precisão científica e intuição artística através de geometria, cor e composição.',
    'Translation of mathematical equations into visual language. Exploring the relationship between scientific precision and artistic intuition through geometry, color, and composition.',
    2014,
    true,
    false,
    5
  ),
  (
    'Travessias',
    'Crossings',
    'Série reflexiva sobre travessias culturais e geográficas. Trabalhos que documentam a jornada artística entre Dinamarca e Brasil, explorando identidade transcultural.',
    'Reflective series on cultural and geographic crossings. Works documenting the artistic journey between Denmark and Brazil, exploring transcultural identity.',
    2008,
    true,
    false,
    6
  )
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE exhibitions IS 'Exhibition history for Mai-Britt Wolthers - solo shows, group exhibitions, and residencies spanning four decades';
COMMENT ON TABLE art_series IS 'Art series and collections by Mai-Britt Wolthers, organized by theme and period';
