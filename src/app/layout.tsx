import type { Metadata } from 'next'
import { Inter, Cormorant_Garamond, Jost } from 'next/font/google'
import './globals.css'
import ConditionalHeader from '@/components/ConditionalHeader'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
})
const jost = Jost({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Mai-Britt Wolthers - Contemporary Artist',
  description: 'Danish-Brazilian contemporary artist exploring transcultural narratives through landscape paintings, sculptures, and mixed media works.',
  keywords: ['contemporary art', 'Brazilian art', 'Danish artist', 'landscape painting', 'sculpture', 'mixed media'],
  authors: [{ name: 'Mai-Britt Wolthers' }],
  creator: 'Mai-Britt Wolthers',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'pt_BR',
    title: 'Mai-Britt Wolthers - Contemporary Artist',
    description: 'Danish-Brazilian contemporary artist exploring transcultural narratives through landscape paintings, sculptures, and mixed media works.',
    siteName: 'Mai-Britt Wolthers',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mai-Britt Wolthers - Contemporary Artist',
    description: 'Danish-Brazilian contemporary artist exploring transcultural narratives through landscape paintings, sculptures, and mixed media works.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.className} ${cormorant.variable} ${jost.variable} antialiased min-h-screen bg-white`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ConditionalHeader />
          <main className="min-h-screen">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}