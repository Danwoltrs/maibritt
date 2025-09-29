'use client'

import { useRouter } from 'next/navigation'
import { Palette, Building, DollarSign, MapPin, PenTool, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Home() {
  const router = useRouter()

  const adminFeatures = [
    {
      title: 'Upload Artwork',
      description: 'Add new pieces to your portfolio with drag & drop upload',
      icon: Palette,
      href: '/admin/artworks/new',
      color: 'bg-blue-500'
    },
    {
      title: 'Manage Galleries',
      description: 'Track partner galleries and relationships worldwide',
      icon: Building,
      href: '/admin/galleries',
      color: 'bg-green-500'
    },
    {
      title: 'Record Sales',
      description: 'Log sales and track revenue with commission calculations',
      icon: DollarSign,
      href: '/admin/sales/new',
      color: 'bg-purple-500'
    },
    {
      title: 'Track Locations',
      description: 'Monitor where your artworks are currently located',
      icon: MapPin,
      href: '/admin/artworks/locations',
      color: 'bg-orange-500'
    },
    {
      title: 'Write Journal',
      description: 'Document your creative process and artistic journey',
      icon: PenTool,
      href: '/admin/journal/new',
      color: 'bg-pink-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-light text-gray-900 mb-6">
            Mai-Britt Wolthers
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-4">
            Contemporary Artist & Portfolio Platform
          </p>
          <p className="text-lg text-gray-500 mb-12">
            Four decades exploring the confluence of European tradition and Brazilian landscape exuberance
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => router.push('/login')}
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3"
            >
              <User className="h-4 w-4 mr-2" />
              Artist Login
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/dashboard')}
              className="px-8 py-3"
            >
              Admin Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Admin Features */}
      <section className="py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-light text-center text-gray-900 mb-12">
            Artist Management System
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {adminFeatures.map((feature) => (
              <Card
                key={feature.title}
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1"
                onClick={() => router.push(feature.href)}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto rounded-full ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-medium text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600 text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Status */}
      <section className="py-16 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-light text-gray-900 mb-6">
            Platform Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-green-600 mb-2">✅</div>
              <h4 className="font-medium text-gray-900 mb-1">Admin Dashboard</h4>
              <p className="text-sm text-gray-600">Complete artist management system</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-blue-600 mb-2">🚧</div>
              <h4 className="font-medium text-gray-900 mb-1">Public Portfolio</h4>
              <p className="text-sm text-gray-600">Coming soon - artwork showcase</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-purple-600 mb-2">🎨</div>
              <h4 className="font-medium text-gray-900 mb-1">Art Sales</h4>
              <p className="text-sm text-gray-600">E-commerce integration ready</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 text-center text-gray-500 text-sm">
        <p>&copy; 2024 Mai-Britt Wolthers. Platform built with Next.js and Supabase.</p>
      </footer>
    </div>
  )
}