'use client'

import { Eye, BookOpen, Calendar, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-light text-gray-900 mb-6">
            Mai-Britt Wolthers
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-4">
            Contemporary Artist
          </p>
          <p className="text-lg text-gray-500 mb-12 max-w-3xl mx-auto">
            Four decades exploring the confluence of European tradition and Brazilian landscape exuberance. 
            Danish-Brazilian artist creating transcultural narratives through painting, sculpture, and mixed media.
          </p>
        </div>
      </section>

      {/* Coming Soon Sections */}
      <section className="py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-light text-center text-gray-900 mb-12">
            Portfolio & Exhibitions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Portfolio</h3>
              <p className="text-gray-600 text-sm mb-4">
                Explore four decades of artistic evolution through paintings, sculptures, and mixed media works.
              </p>
              <p className="text-xs text-blue-600 font-medium">Coming Soon</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Exhibitions</h3>
              <p className="text-gray-600 text-sm mb-4">
                Timeline of solo and group exhibitions across Brazil, Denmark, UK, and the United States.
              </p>
              <p className="text-xs text-green-600 font-medium">Coming Soon</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Artist Journal</h3>
              <p className="text-gray-600 text-sm mb-4">
                Insights into the creative process, studio life, and artistic philosophy from the artist's perspective.
              </p>
              <p className="text-xs text-purple-600 font-medium">Coming Soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-16 px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-light text-gray-900 mb-6">
            About the Artist
          </h3>
          <blockquote className="text-lg italic text-gray-600 mb-8 max-w-3xl mx-auto">
            "Color not only fills space, but conducts thought. Each look restarts the image, 
            creating new scenes in the territory between abstraction and representation."
          </blockquote>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Born in Denmark in 1962, Mai-Britt Wolthers has called Brazil home since 1986. 
            Her work explores the dialogue between cultures, landscapes, and the transformative power of color.
          </p>
          <Button variant="outline" disabled className="cursor-not-allowed opacity-50">
            Read Full Biography (Coming Soon)
          </Button>
        </div>
      </section>

      {/* Contact Preview */}
      <section className="py-16 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-light text-gray-900 mb-6">
            Get in Touch
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            For inquiries about artwork availability, exhibitions, or collaborations, 
            please reach out through our contact form.
          </p>
          <div className="flex justify-center">
            <Button variant="outline" disabled className="cursor-not-allowed opacity-50">
              <Mail className="h-4 w-4 mr-2" />
              Contact Form (Coming Soon)
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 text-center text-gray-500 text-sm border-t border-gray-100">
        <p>&copy; 2024 Mai-Britt Wolthers. Contemporary Artist Portfolio Platform.</p>
        <p className="mt-2 text-xs">Built with Next.js and Supabase</p>
      </footer>
    </div>
  )
}