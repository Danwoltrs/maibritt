'use client'

import { motion } from 'framer-motion'
import { useSmoothScroll } from '@/hooks/useScrollAnimation'

interface ScrollNavigationProps {
  activeSection: string
  sections: string[]
  className?: string
}

const sectionConfig = {
  hero: {
    label: 'Latest Works',
    labelPt: 'Últimos Trabalhos',
    color: 'bg-blue-500'
  },
  exhibitions: {
    label: 'Journey',
    labelPt: 'Jornada',
    color: 'bg-purple-500'
  },
  series: {
    label: 'Series',
    labelPt: 'Séries',
    color: 'bg-green-500'
  },
  statement: {
    label: 'Artist',
    labelPt: 'Artista',
    color: 'bg-orange-500'
  },
  availability: {
    label: 'Available',
    labelPt: 'Disponível',
    color: 'bg-red-500'
  },
  blog: {
    label: 'Journal',
    labelPt: 'Diário',
    color: 'bg-indigo-500'
  }
}

const ScrollNavigation = ({
  activeSection,
  sections,
  className = ""
}: ScrollNavigationProps) => {
  const { scrollToElement } = useSmoothScroll()

  const handleSectionClick = (sectionId: string) => {
    scrollToElement(sectionId, 80) // Offset for header
  }

  return (
    <motion.nav
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 1 }}
      className={`fixed right-8 top-1/2 transform -translate-y-1/2 z-40 hidden lg:block ${className}`}
    >
      <div className="space-y-6">
        {sections.map((sectionId, index) => {
          const config = sectionConfig[sectionId as keyof typeof sectionConfig]
          const isActive = activeSection === sectionId

          return (
            <motion.div
              key={sectionId}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: 1.2 + index * 0.1,
                type: "spring",
                stiffness: 100
              }}
              className="relative group"
            >
              <motion.button
                onClick={() => handleSectionClick(sectionId)}
                className={`relative w-4 h-4 rounded-full transition-all duration-300 ${
                  isActive
                    ? `${config?.color} scale-125 shadow-lg`
                    : 'bg-gray-300 hover:bg-gray-500 hover:scale-110'
                }`}
                whileHover={{ scale: isActive ? 1.25 : 1.2 }}
                whileTap={{ scale: 0.9 }}
                aria-label={`Go to ${config?.label || sectionId} section`}
              >
                {/* Active indicator ring */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 rounded-full border-2 border-white shadow-lg"
                  />
                )}

                {/* Pulse animation for active section */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 1, opacity: 0.7 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                    className={`absolute inset-0 rounded-full ${config?.color}`}
                  />
                )}
              </motion.button>

              {/* Tooltip */}
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.8 }}
                animate={{
                  opacity: isActive ? 1 : 0,
                  x: isActive ? -60 : 10,
                  scale: isActive ? 1 : 0.8
                }}
                transition={{ duration: 0.3 }}
                className="absolute right-6 top-1/2 transform -translate-y-1/2 pointer-events-none"
              >
                <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                  <div className="font-medium">{config?.label}</div>
                  <div className="text-xs opacity-80">{config?.labelPt}</div>

                  {/* Arrow */}
                  <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2">
                    <div className="w-0 h-0 border-l-4 border-l-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                  </div>
                </div>
              </motion.div>

              {/* Hover tooltip */}
              <motion.div
                initial={{ opacity: 0, x: 10, scale: 0.8 }}
                whileHover={{ opacity: 1, x: -60, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="absolute right-6 top-1/2 transform -translate-y-1/2 pointer-events-none group-hover:block hidden"
              >
                <div className="bg-white border border-gray-200 text-gray-900 text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                  <div className="font-medium">{config?.label}</div>
                  <div className="text-xs text-gray-600">{config?.labelPt}</div>

                  {/* Arrow */}
                  <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2">
                    <div className="w-0 h-0 border-l-4 border-l-gray-200 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        })}

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="absolute -left-8 top-0 bottom-0 w-px bg-gray-200 origin-top"
        >
          <motion.div
            className="w-full bg-gradient-to-b from-blue-500 to-purple-500 origin-top"
            style={{
              height: `${((sections.indexOf(activeSection) + 1) / sections.length) * 100}%`
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </motion.div>

        {/* Section counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1.8 }}
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center"
        >
          <div className="bg-white border border-gray-200 rounded-full w-8 h-8 flex items-center justify-center shadow-sm">
            <span className="text-xs font-medium text-gray-600">
              {sections.indexOf(activeSection) + 1}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1 font-medium">
            of {sections.length}
          </div>
        </motion.div>
      </div>
    </motion.nav>
  )
}

export default ScrollNavigation