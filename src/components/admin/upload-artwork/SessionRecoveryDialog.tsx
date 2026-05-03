'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { History } from 'lucide-react'

interface SessionRecoveryDialogProps {
  open: boolean
  artworkCount: number
  savedAt: string
  fileNames: string[]
  onResume: () => void
  onStartFresh: () => void
}

export function SessionRecoveryDialog({
  open,
  artworkCount,
  savedAt,
  fileNames,
  onResume,
  onStartFresh,
}: SessionRecoveryDialogProps) {
  const formattedDate = formatSavedAt(savedAt)
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[500px]"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Resume previous session?
          </DialogTitle>
          <DialogDescription>
            You had <strong>{artworkCount}</strong> artwork
            {artworkCount === 1 ? '' : 's'} in progress on{' '}
            <strong>{formattedDate}</strong>. Pictures need to be re-attached,
            but your titles and descriptions are saved.
          </DialogDescription>
        </DialogHeader>

        {fileNames.length > 0 && (
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Original file names:</p>
            <ul className="list-disc pl-5 space-y-0.5">
              {fileNames.slice(0, 8).map((n, i) => (
                <li key={i}>{n}</li>
              ))}
              {fileNames.length > 8 && (
                <li>…and {fileNames.length - 8} more</li>
              )}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onStartFresh}>
            Start fresh
          </Button>
          <Button onClick={onResume}>Resume</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatSavedAt(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}
