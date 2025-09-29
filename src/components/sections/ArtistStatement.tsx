'use client'

import { motion } from 'framer-motion'
import { Quote, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useScrollAnimation, useParallax } from '@/hooks/useScrollAnimation'

interface ArtistStatementProps {
  id?: string
  className?: string
}

const ArtistStatement = ({ id = "statement", className = "" }: ArtistStatementProps) => {
  const [ref, isInView] = useScrollAnimation(0.4)
  const [parallaxRef, parallaxY] = useParallax(20)

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
            <Quote className="w-8 h-8 text-blue-600" />
          </motion.div>

          {/* Main quote - English */}
          <motion.blockquote
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="text-3xl lg:text-4xl font-light italic text-gray-700 mb-8 leading-relaxed"
          >
            "Color not only fills space, but conducts thought. Each look restarts
            the image, creating new scenes in the territory between abstraction and representation."
          </motion.blockquote>

          {/* Portuguese translation */}
          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-xl lg:text-2xl font-light italic text-gray-600 mb-12 leading-relaxed"
          >
            "A cor não apenas preenche o espaço, mas conduz o pensamento. Cada olhar reinicia
            a imagem, criando novas cenas no território entre abstração e representação."
          </motion.blockquote>

          {/* Artist description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="max-w-3xl mx-auto mb-12"
          >
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Four decades exploring the confluence of European tradition and Brazilian landscape exuberance.
              Mai-Britt's work emerges from the intersection of cultures, where Danish sensibility meets
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
            >
              Read Full Artist Statement
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-gray-600 hover:text-gray-900"
            >
              View Biography
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
          "
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
          "
        </motion.div>
      </motion.div>
    </section>
  )
}

export default ArtistStatement