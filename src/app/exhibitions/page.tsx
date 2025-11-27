'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Award, Users, Palette, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExhibitionsService } from '@/services/exhibitions.service'
import { Exhibition } from '@/types'

export default function ExhibitionsPage() {
  const router = useRouter()
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')

  useEffect(() => {
    const fetchExhibitions = async () => {
      try {
        const data = await ExhibitionsService.getExhibitions()
        setExhibitions(data)
      } catch (error) {
        console.error('Error fetching exhibitions:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchExhibitions()
  }, [])

  const years = [...new Set(exhibitions.map(e => e.year))].sort((a, b) => b - a)

  const filteredExhibitions = exhibitions.filter(exhibition => {
    const matchesType = selectedType === 'all' || exhibition.type === selectedType
    const matchesYear = selectedYear === 'all' || exhibition.year === parseInt(selectedYear)
    return matchesType && matchesYear
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'solo': return <Award className="w-4 h-4" />
      case 'group': return <Users className="w-4 h-4" />
      case 'residency': return <Palette className="w-4 h-4" />
      default: return <Calendar className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'solo': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'group': return 'bg-green-100 text-green-800 border-green-200'
      case 'residency': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Helper to get display title (prefer English, fallback to Portuguese)
  const getDisplayTitle = (exhibition: Exhibition) => exhibition.title.en || exhibition.title.ptBR
  const getDisplayDescription = (exhibition: Exhibition) => exhibition.description?.en || exhibition.description?.ptBR || ''

  const generateSlug = (exhibition: Exhibition) => {
    const title = getDisplayTitle(exhibition)
    const titleSlug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return `${titleSlug}-${exhibition.year}`
  }

  const handleExhibitionClick = (exhibition: Exhibition) => {
    const slug = generateSlug(exhibition)
    router.push(`/exhibitions/${slug}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-gray-200 rounded w-64 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-24 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-light mb-4"
          >
            Exhibitions
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-300 max-w-2xl mx-auto"
          >
            Four decades of artistic exploration through solo shows, group exhibitions, and residencies
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-400 mt-2"
          >
            Quatro decadas de exploracao artistica
          </motion.p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm py-4 px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Type:</span>
            <div className="flex gap-1">
              {['all', 'solo', 'group', 'residency'].map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                  className="capitalize"
                >
                  {type === 'all' ? 'All' : type}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border rounded-md px-3 py-1 text-sm"
            >
              <option value="all">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500">
            {filteredExhibitions.length} exhibition{filteredExhibitions.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Exhibitions Grid */}
      <div className="py-16 px-8">
        <div className="max-w-7xl mx-auto">
          {filteredExhibitions.length === 0 ? (
            <div className="text-center py-24 text-gray-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No exhibitions found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredExhibitions.map((exhibition, index) => (
                <motion.div
                  key={exhibition.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 h-full"
                    onClick={() => handleExhibitionClick(exhibition)}
                  >
                    <div className="relative h-56 overflow-hidden bg-gray-100">
                      {exhibition.image ? (
                        <Image
                          src={exhibition.image}
                          alt={getDisplayTitle(exhibition)}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          {getTypeIcon(exhibition.type)}
                          <span className="ml-2 text-gray-400 capitalize">{exhibition.type}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button variant="secondary" size="sm" className="w-full">
                          View Details
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-3xl font-light text-gray-900">{exhibition.year}</span>
                        <Badge variant="outline" className={`${getTypeColor(exhibition.type)} capitalize`}>
                          {getTypeIcon(exhibition.type)}
                          <span className="ml-1">{exhibition.type}</span>
                        </Badge>
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {getDisplayTitle(exhibition)}
                      </h3>
                      <p className="text-sm font-medium text-gray-700 mb-1">{exhibition.venue}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        {exhibition.location}
                      </div>
                      {getDisplayDescription(exhibition) && (
                        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                          {getDisplayDescription(exhibition)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-white py-16 px-8 border-t">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-light text-center text-gray-900 mb-8">Career Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: exhibitions.length, label: 'Total Exhibitions', subLabel: 'Total de Exposicoes' },
              { value: exhibitions.filter(e => e.type === 'solo').length, label: 'Solo Shows', subLabel: 'Exposicoes Solo' },
              { value: exhibitions.filter(e => e.type === 'group').length, label: 'Group Shows', subLabel: 'Mostras Coletivas' },
              { value: [...new Set(exhibitions.map(e => e.location.split(',').pop()?.trim()))].length, label: 'Countries', subLabel: 'Paises' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-light text-gray-900 mb-2">{stat.value}</div>
                <div className="text-sm font-medium text-gray-800">{stat.label}</div>
                <div className="text-xs text-gray-500">{stat.subLabel}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
