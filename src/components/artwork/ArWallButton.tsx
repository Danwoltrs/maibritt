'use client'

import { useEffect, useRef, useState } from 'react'
import { View, X } from 'lucide-react'
import QRCode from 'qrcode'
import { currentArPlatform, type ArPlatform } from '@/lib/ar/device'
import { AR_CATEGORIES } from '@/lib/ar/constants'

interface ArWallButtonProps {
  artworkId: string
  slug: string
  category: string
  heightCm?: number
  widthCm?: number
  /** Open the AR flow automatically (arriving from the desktop QR hand-off). */
  autoOpen?: boolean
  /** 'bar' = compact text button for the lightbox bar; 'detail' = outlined button. */
  variant?: 'bar' | 'detail'
}

interface ArUrls { glb: string; usdz: string }

const LABEL = 'View on your wall'
const LABEL_PT = 'Veja na sua parede'

export default function ArWallButton({
  artworkId, slug, category, heightCm, widthCm, autoOpen = false, variant = 'bar',
}: ArWallButtonProps) {
  const [platform, setPlatform] = useState<ArPlatform | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [androidUrls, setAndroidUrls] = useState<ArUrls | null>(null)
  const [pulse, setPulse] = useState(autoOpen)
  const urlsRef = useRef<ArUrls | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const eligible =
    (AR_CATEGORIES as readonly string[]).includes(category) &&
    typeof heightCm === 'number' && heightCm > 0 &&
    typeof widthCm === 'number' && widthCm > 0

  // Platform is browser-only; render nothing during SSR.
  useEffect(() => { setPlatform(currentArPlatform()) }, [])

  const fetchUrls = async (): Promise<ArUrls> => {
    if (urlsRef.current) return urlsRef.current
    const res = await fetch(`/api/ar/${artworkId}`, { method: 'POST' })
    if (!res.ok) throw new Error('ar_generation_failed')
    const urls = (await res.json()) as ArUrls
    urlsRef.current = urls
    return urls
  }

  const launchIos = (urls: ArUrls) => {
    const pageUrl = `${window.location.origin}/artwork/${slug}`
    const anchor = document.createElement('a')
    anchor.setAttribute('rel', 'ar')
    // Lock pinch-scaling (true size) and make Quick Look's share button
    // point at the artwork page instead of the raw USDZ.
    anchor.setAttribute(
      'href',
      `${urls.usdz}#allowsContentScaling=0&canonicalWebPageURL=${encodeURIComponent(pageUrl)}`,
    )
    // Quick Look requires an <img> child inside the rel=ar anchor.
    const img = document.createElement('img')
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    img.alt = ''
    anchor.appendChild(img)
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }

  const handleClick = async () => {
    setPulse(false)
    setError(false)
    if (platform === 'desktop') {
      const target = `${window.location.origin}/artwork/${slug}?ar=1`
      setQrDataUrl(await QRCode.toDataURL(target, { width: 240, margin: 1 }))
      return
    }
    setLoading(true)
    try {
      const urls = await fetchUrls()
      if (platform === 'ios') {
        launchIos(urls)
      } else {
        await import('@google/model-viewer')
        setAndroidUrls(urls)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  // QR hand-off arrival: pre-generate the model and pull the button into view.
  useEffect(() => {
    if (!autoOpen || !eligible || !platform || platform === 'desktop') return
    buttonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    fetchUrls().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen, eligible, platform])

  if (!eligible || platform === null) return null

  const barClasses =
    'inline-flex items-center gap-1.5 text-[10px] tracking-[2px] uppercase font-medium text-gray-700 hover:text-gray-900 transition-colors whitespace-nowrap disabled:opacity-50'
  const detailClasses =
    'inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50'

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        disabled={loading}
        title={`${LABEL} / ${LABEL_PT}`}
        className={`${variant === 'bar' ? barClasses : detailClasses} ${pulse ? 'animate-pulse' : ''}`}
      >
        <View className={variant === 'bar' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        {loading ? 'Preparing… / Preparando…' : LABEL}
      </button>
      {error && (
        <span className="text-[10px] text-red-600 ml-2">
          Couldn&apos;t prepare the AR view — try again / Não foi possível preparar — tente novamente
        </span>
      )}

      {/* Desktop: QR hand-off */}
      {qrDataUrl && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60" onClick={() => setQrDataUrl(null)}>
          <div className="bg-white rounded-lg p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button aria-label="Close" className="float-right -mt-2 -mr-2 text-gray-400 hover:text-gray-700" onClick={() => setQrDataUrl(null)}>
              <X className="w-5 h-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR code" className="mx-auto w-[240px] h-[240px]" />
            <p className="mt-3 text-sm font-medium text-gray-900">Scan to see it on your wall</p>
            <p className="text-xs text-gray-500">Escaneie para vê-la na sua parede</p>
          </div>
        </div>
      )}

      {/* Android: model-viewer sheet (WebXR first; Scene Viewer fallback) */}
      {androidUrls && (
        <div className="fixed inset-0 z-[600] flex flex-col bg-black/90">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm">{LABEL} / {LABEL_PT}</span>
            <button aria-label="Close" onClick={() => setAndroidUrls(null)}>
              <X className="w-6 h-6" />
            </button>
          </div>
          <model-viewer
            src={androidUrls.glb}
            ios-src={androidUrls.usdz}
            alt="Artwork on your wall"
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-placement="wall"
            ar-scale="fixed"
            camera-controls
            style={{ flex: 1, width: '100%' }}
          />
          <p className="px-4 py-3 text-center text-xs text-white/80">
            Tap the AR icon, then point your camera at a picture, door or shelf on your wall
            <br />
            Toque no ícone AR e aponte a câmera para um quadro, porta ou prateleira na parede
          </p>
        </div>
      )}
    </>
  )
}
