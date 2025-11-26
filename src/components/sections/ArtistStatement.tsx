'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Quote as QuoteIcon, ArrowRight, RefreshCw, ExternalLink, Newspaper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useScrollAnimation, useParallax } from '@/hooks/useScrollAnimation'
import { QuotesService, Quote, QuoteType } from '@/services'

interface ArtistStatementProps {
  id?: string
  className?: string
}

// Fallback quotes in case database is empty or fetch fails
const fallbackQuotes: Partial<Quote>[] = [
  {
    quoteEn: "Color not only fills space, but conducts thought. Each look restarts the image, creating new scenes in the territory between abstraction and representation.",
    quotePt: "A cor não apenas preenche o espaço, mas conduz o pensamento. Cada olhar reinicia a imagem, criando novas cenas no território entre abstração e representação.",
    author: "Mai-Britt Wolthers",
    quoteType: 'artist'
  },
  {
    quoteEn: "My art emerges from the intersection of cultures, where Danish sensibility meets the vibrant complexity of South American nature.",
    quotePt: "Minha arte emerge da intersecção de culturas, onde a sensibilidade dinamarquesa encontra a complexidade vibrante da natureza sul-americana.",
    author: "Mai-Britt Wolthers",
    quoteType: 'artist'
  },
  {
    quoteEn: "The landscape is not just scenery, but living memory that transforms with each brushstroke.",
    quotePt: "A paisagem não é apenas cenário, mas memória viva que se transforma em cada pincelada.",
    author: "Mai-Britt Wolthers",
    quoteType: 'artist'
  }
]

// Quote type labels for display
const quoteTypeLabels: Record<QuoteType, { en: string; pt: string; color: string }> = {
  artist: { en: 'Artist', pt: 'Artista', color: 'bg-blue-100 text-blue-800' },
  press: { en: 'Press', pt: 'Imprensa', color: 'bg-green-100 text-green-800' },
  testimonial: { en: 'Testimonial', pt: 'Depoimento', color: 'bg-purple-100 text-purple-800' },
  curator: { en: 'Curator', pt: 'Curador', color: 'bg-amber-100 text-amber-800' }
}

const ArtistStatement = ({ id = "statement", className = "" }: ArtistStatementProps) => {
  const [ref, isInView] = useScrollAnimation(0.4)
  const [parallaxRef, parallaxY] = useParallax(20)

  const [quotes, setQuotes] = useState<Quote[]>([])
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch quotes from database
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setIsLoading(true)
        const fetchedQuotes = await QuotesService.getActiveQuotes()
        if (fetchedQuotes.length > 0) {
          setQuotes(fetchedQuotes)
          // Start with a random quote
          setCurrentQuoteIndex(Math.floor(Math.random() * fetchedQuotes.length))
        }
      } catch (error) {
        console.error('Error fetching quotes:', error)
        // Will fall back to hardcoded quotes
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuotes()
  }, [])

  // Get current quote (from DB or fallback)
  const currentQuote = quotes.length > 0
    ? quotes[currentQuoteIndex]
    : fallbackQuotes[currentQuoteIndex % fallbackQuotes.length] as Quote

  // Cycle to next quote
  const nextQuote = () => {
    const maxIndex = quotes.length > 0 ? quotes.length : fallbackQuotes.length
    setCurrentQuoteIndex((prev) => (prev + 1) % maxIndex)
  }

  // Get quote type info
  const quoteTypeInfo = currentQuote.quoteType ? quoteTypeLabels[currentQuote.quoteType] : quoteTypeLabels.artist

  return (
    <section id={id} ref={ref} className={`relative py-24 bg-gradient-to-br from-gray-50 to-white overflow-hidden ${className}`}>
      {/* Parallax background elements */}
      <div
        ref={parallaxRef}
        className="absolute inset-0 opacity-10"
        style={{ transform: `translateY(${parallaxY}px)` }}
      >
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-gradient-to-br from-green-200 to-blue-200 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 max-w-5xl mx-auto px-8"
      >
        <div className="text-center">
          {/* Quote icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
            className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-8"
          >
            <QuoteIcon className="w-8 h-8 text-blue-600" />
          </motion.div>

          {/* Dynamic Quote with animation */}
          <div className="min-h-[280px] md:min-h-[240px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuoteIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {/* Quote type badge */}
                {currentQuote.quoteType && currentQuote.quoteType !== 'artist' && (
                  <Badge className={`${quoteTypeInfo.color} mb-4`}>
                    {currentQuote.quoteType === 'press' && <Newspaper className="w-3 h-3 mr-1" />}
                    {quoteTypeInfo.en} / {quoteTypeInfo.pt}
                  </Badge>
                )}

                {/* Main quote - English */}
                <motion.blockquote
                  className="text-3xl lg:text-4xl font-light italic text-gray-700 mb-6 leading-relaxed"
                >
                  &ldquo;{currentQuote.quoteEn}&rdquo;
                </motion.blockquote>

                {/* Portuguese translation */}
                <motion.blockquote
                  className="text-xl lg:text-2xl font-light italic text-gray-600 mb-4 leading-relaxed"
                >
                  &ldquo;{currentQuote.quotePt}&rdquo;
                </motion.blockquote>

                {/* Author attribution */}
                <div className="mb-4">
                  {currentQuote.author && (
                    <p className="text-sm font-medium text-gray-700">
                      — {currentQuote.author}
                      {currentQuote.authorTitle && (
                        <span className="font-normal text-gray-500">, {currentQuote.authorTitle}</span>
                      )}
                    </p>
                  )}
                  {currentQuote.source && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                      {currentQuote.source}
                      {currentQuote.sourceDate && (
                        <span>
                          ({new Date(currentQuote.sourceDate).getFullYear()})
                        </span>
                      )}
                      {currentQuote.sourceUrl && (
                        <a
                          href={currentQuote.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 inline-flex items-center ml-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </p>
                  )}
                </div>

                {/* Magazine/Press Image if available */}
                {currentQuote.imageUrl && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 mb-4 flex justify-center"
                  >
                    <div className="relative max-w-md">
                      <Image
                        src={currentQuote.imageUrl}
                        alt={currentQuote.imageCaption || `${currentQuote.source || 'Press'} clipping`}
                        width={400}
                        height={300}
                        className="rounded-lg shadow-lg object-cover"
                      />
                      {currentQuote.imageCaption && (
                        <p className="text-xs text-gray-500 mt-2 text-center italic">
                          {currentQuote.imageCaption}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Quote navigation (only show if there are multiple quotes) */}
          {(quotes.length > 1 || fallbackQuotes.length > 1) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 0.8 }}
              className="flex justify-center items-center gap-4 mb-12"
            >
              <button
                onClick={nextQuote}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Another quote</span>
              </button>
              <span className="text-gray-300">|</span>
              <span className="text-xs text-gray-400">
                {currentQuoteIndex + 1} / {quotes.length > 0 ? quotes.length : fallbackQuotes.length}
              </span>
            </motion.div>
          )}

          {/* Artist description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="max-w-3xl mx-auto mb-12"
          >
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Four decades exploring the confluence of European tradition and Brazilian landscape exuberance.
              Mai-Britt&apos;s work emerges from the intersection of cultures, where Danish sensibility meets
              the vibrant complexity of South American nature.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Quatro décadas explorando a confluência entre tradição europeia e exuberância da paisagem brasileira.
              O trabalho de Mai-Britt surge da intersecção de culturas, onde a sensibilidade dinamarquesa
              encontra a complexidade vibrante da natureza sul-americana.
            </p>
          </motion.div>

          {/* Key themes */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
          >
            {[
              {
                title: "Transcultural Narratives",
                titlePt: "Narrativas Transculturais",
                description: "Bridging Danish heritage with Brazilian experience",
                descriptionPt: "Conectando herança dinamarquesa com experiência brasileira"
              },
              {
                title: "Landscape Memory",
                titlePt: "Memória da Paisagem",
                description: "Environmental research through artistic interpretation",
                descriptionPt: "Pesquisa ambiental através de interpretação artística"
              },
              {
                title: "Color as Protagonist",
                titlePt: "Cor como Protagonista",
                description: "Color as the primary narrative element",
                descriptionPt: "Cor como elemento narrativo principal"
              }
            ].map((theme, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: 1.1 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white/60 backdrop-blur-sm rounded-lg p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-2">{theme.title}</h3>
                <p className="text-sm font-medium text-gray-700 mb-3">{theme.titlePt}</p>
                <p className="text-sm text-gray-600 mb-2">{theme.description}</p>
                <p className="text-xs text-gray-500">{theme.descriptionPt}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Call to action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              variant="outline"
              size="lg"
              className="group hover:bg-gray-900 hover:text-white transition-all duration-300"
              asChild
            >
              <Link href="/about">
                Read Full Artist Statement
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-gray-600 hover:text-gray-900"
              asChild
            >
              <Link href="/about#biography">
                View Biography
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Floating decorative quote marks */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? {
            opacity: 1,
            scale: 1,
            y: [0, -10, 0],
            rotate: [0, 5, 0]
          } : { opacity: 0, scale: 0 }}
          transition={{
            opacity: { delay: 1.5, duration: 1 },
            scale: { delay: 1.5, duration: 1 },
            y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute top-20 left-20 text-blue-200 text-8xl font-serif opacity-30 hidden lg:block pointer-events-none"
        >
          &ldquo;
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? {
            opacity: 1,
            scale: 1,
            y: [0, 15, 0],
            rotate: [0, -5, 0]
          } : { opacity: 0, scale: 0 }}
          transition={{
            opacity: { delay: 1.7, duration: 1 },
            scale: { delay: 1.7, duration: 1 },
            y: { duration: 8, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 8, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute bottom-20 right-20 text-purple-200 text-8xl font-serif opacity-30 hidden lg:block pointer-events-none"
        >
          &rdquo;
        </motion.div>
      </motion.div>
    </section>
  )
}

export default ArtistStatement
