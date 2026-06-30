'use client'

import { useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Camera } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { UploadArtworkDialog } from './UploadArtworkDialog'
import { shouldShowQuickUploadFab } from './quickUploadFab.logic'
import { MAX_IMAGE_COUNT } from './imageFiles'

/**
 * Mobile-only floating button for the logged-in artist.
 * Tap -> native Camera/Library picker -> full-screen UploadArtworkDialog
 * with the chosen images preloaded. Mounted once in the root layout.
 */
export function QuickUploadFab() {
  const { isAuthenticated, loading } = useAuth()
  const pathname = usePathname()
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[] | null>(null)

  const dialogOpen = files !== null
  const showButton = shouldShowQuickUploadFab({
    isAuthenticated,
    loading,
    pathname,
    dialogOpen,
  })

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    // Cap to the same batch size the dropzone allows.
    const picked = (e.target.files ? Array.from(e.target.files) : []).slice(0, MAX_IMAGE_COUNT)
    // Reset so picking the same file again still fires onChange next time.
    e.target.value = ''
    if (picked.length > 0) setFiles(picked)
  }

  return (
    <>
      {showButton && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePick}
          />
          <button
            type="button"
            aria-label="Add artwork"
            onClick={() => inputRef.current?.click()}
            style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            className="lg:hidden fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition-transform active:scale-95"
          >
            <Camera className="h-6 w-6" />
          </button>
        </>
      )}

      {dialogOpen && (
        <UploadArtworkDialog
          open
          initialFiles={files ?? undefined}
          onClose={() => setFiles(null)}
        />
      )}
    </>
  )
}
