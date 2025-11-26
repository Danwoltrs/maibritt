-- Create quotes table for dynamic quotes (artist statements, press reviews, testimonials)
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_pt TEXT NOT NULL,
  quote_en TEXT NOT NULL,
  author TEXT,
  author_title TEXT,                    -- e.g., "Art Critic", "Curator at Museum X"
  source TEXT,                          -- e.g., "Folha de São Paulo", "Art Magazine"
  source_url TEXT,                      -- Link to original article
  source_date DATE,                     -- Publication date
  quote_type TEXT DEFAULT 'artist' CHECK (quote_type IN ('artist', 'press', 'testimonial', 'curator')),
  image_url TEXT,                       -- Magazine clipping or press photo
  image_caption TEXT,                   -- Caption for the image
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,       -- Show prominently on homepage
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add some initial quotes from the artist statement
INSERT INTO quotes (quote_pt, quote_en, author, quote_type, is_active, featured, display_order) VALUES
(
  'A cor não apenas preenche o espaço, mas conduz o pensamento. Cada olhar reinicia a imagem, criando novas cenas no território entre abstração e representação.',
  'Color not only fills space, but conducts thought. Each look restarts the image, creating new scenes in the territory between abstraction and representation.',
  'Mai-Britt Wolthers',
  'artist',
  true,
  true,
  1
),
(
  'Minha arte emerge da intersecção de culturas, onde a sensibilidade dinamarquesa encontra a complexidade vibrante da natureza sul-americana.',
  'My art emerges from the intersection of cultures, where Danish sensibility meets the vibrant complexity of South American nature.',
  'Mai-Britt Wolthers',
  'artist',
  true,
  false,
  2
),
(
  'A paisagem não é apenas cenário, mas memória viva que se transforma em cada pincelada.',
  'The landscape is not just scenery, but living memory that transforms with each brushstroke.',
  'Mai-Britt Wolthers',
  'artist',
  true,
  false,
  3
);

-- Create indexes for efficient querying
CREATE INDEX idx_quotes_active_order ON quotes(is_active, display_order);
CREATE INDEX idx_quotes_type ON quotes(quote_type);
CREATE INDEX idx_quotes_featured ON quotes(featured) WHERE featured = true;

-- Add comments for documentation
COMMENT ON TABLE quotes IS 'Quotes for display on the website - artist statements, press reviews, testimonials, curator notes';
COMMENT ON COLUMN quotes.quote_type IS 'Type of quote: artist (from Mai-Britt), press (from magazines/newspapers), testimonial (from collectors), curator (from curators/critics)';
COMMENT ON COLUMN quotes.image_url IS 'URL to magazine clipping, press photo, or related image';
COMMENT ON COLUMN quotes.featured IS 'Featured quotes appear prominently on the homepage';
