'use client'

import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog'
import { EButton, Icon } from './ui'

export function ConfirmRemove({ open, title, onCancel, onConfirm }: { open: boolean; title: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent className="story-theme max-w-[560px] rounded-[22px] border-0 p-9" style={{ background: 'var(--paper)' }}>
        <AlertDialogTitle className="story-serif text-[36px] font-medium leading-tight" style={{ color: 'var(--ink)' }}>{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-[19px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
          It will disappear from your story. If you change your mind, press Undo straight afterwards.
        </AlertDialogDescription>
        <div className="flex justify-end gap-3.5 pt-2">
          <EButton onClick={onCancel}>Keep it</EButton>
          <EButton variant="danger" icon={<Icon name="trash" />} onClick={onConfirm}>Yes, remove it</EButton>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
