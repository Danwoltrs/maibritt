'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadArtworkDialog } from '@/components/admin/upload-artwork'

export default function NewArtworkPage() {
  const router = useRouter()
  const [open, setOpen] = useState(true)

  const handleClose = () => {
    setOpen(false)
    router.push('/artworks')
  }

  return <UploadArtworkDialog open={open} onClose={handleClose} />
}
