import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArtworkService } from '@/services'
import ArtworkDetailClient from './ArtworkDetailClient'

interface ArtworkPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArtworkPageProps): Promise<Metadata> {
  const { slug } = await params
  const artwork = await ArtworkService.getArtworkBySlug(slug)

  if (!artwork) {
    return { title: 'Artwork Not Found' }
  }

  const title = `${artwork.title.en} — Mai-Britt Wolthers`
  const description = artwork.description.en
    || `${artwork.medium.en}, ${artwork.dimensions}, ${artwork.year}`
  // Share preview = the faithful cropped image (fall back to the chosen display, then raw).
  const first = artwork.images[0]
  const ogImage = first?.cropped || first?.display || first?.original
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://maibrittwolthers.com'

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: { canonical: `/artwork/${slug}` },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/artwork/${slug}`,
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  }
}

export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { slug } = await params
  const artwork = await ArtworkService.getArtworkBySlug(slug)

  if (!artwork) {
    notFound()
  }

  return <ArtworkDetailClient artwork={artwork} />
}
