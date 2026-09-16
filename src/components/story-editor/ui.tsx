'use client'

import type { ButtonHTMLAttributes, ReactNode, TextareaHTMLAttributes, InputHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger'

export function EButton({
  variant = 'secondary',
  small = false,
  icon,
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; small?: boolean; icon?: ReactNode }) {
  return (
    <button type="button" className={`se-btn se-btn-${variant} ${small ? 'se-btn-small' : ''} ${className}`} {...rest}>
      {icon}
      <span>{children}</span>
    </button>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex w-full flex-col gap-2.5">
      <span className="flex items-baseline gap-3">
        <span className="text-[20px] font-semibold" style={{ color: 'var(--ink)' }}>{label}</span>
        {hint && <span className="text-[18px]" style={{ color: 'var(--ink-2)' }}>{hint}</span>}
      </span>
      {children}
    </label>
  )
}

export function TextInput({ big = false, className = '', ...rest }: InputHTMLAttributes<HTMLInputElement> & { big?: boolean }) {
  return <input className={`se-field ${big ? 'se-field-big story-serif' : ''} ${className}`} {...rest} />
}

export function TextArea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`se-field ${className}`} {...rest} />
}

export function PageTop({ title, backLabel = 'Back to my story', onBack, right }: { title: string; backLabel?: string; onBack: () => void; right?: ReactNode }) {
  return (
    <div className="flex h-24 items-center justify-between border-b px-6 md:px-12" style={{ borderColor: 'var(--line)', background: 'var(--white)' }}>
      <EButton variant="quiet" icon={<Icon name="chevronLeft" />} onClick={onBack}>{backLabel}</EButton>
      <span className="story-serif text-[30px] font-medium" style={{ color: 'var(--ink)' }}>{title}</span>
      <div className="flex min-w-[120px] justify-end">{right}</div>
    </div>
  )
}

const PATHS: Record<string, string> = {
  chevronLeft: '<path d="M15 5l-7 7 7 7"/>',
  arrowRight: '<path d="M4 12h16"/><path d="M14 6l6 6-6 6"/>',
  up: '<path d="M12 19V5"/><path d="M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14"/><path d="M6 13l6 6 6-6"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h9.5a6.5 6.5 0 0 1 0 13H10"/>',
  eye: '<path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  send: '<path d="M4 12l16-7-5 16-3.5-6.5L4 12z"/>',
  text: '<path d="M5 6h14"/><path d="M12 6v13"/><path d="M8.5 19h7"/>',
  photo: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M20 15.5l-4.5-4.5-7 7"/>',
  gallery: '<rect x="2.5" y="7" width="8" height="10" rx="1.5"/><rect x="13.5" y="7" width="8" height="10" rx="1.5"/>',
  slides: '<rect x="6.5" y="7.5" width="14" height="11" rx="1.5"/><path d="M3.5 15V6.5A1.5 1.5 0 0 1 5 5h11"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/><path d="M8.5 21h7"/>',
  upload: '<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  trash: '<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/>',
  pencil: '<path d="M4 20l4.5-1L19 8.5a2 2 0 0 0-3-3L5.5 16 4 20z"/>',
  grip: '<circle cx="9" cy="6" r="1.2" fill="currentColor"/><circle cx="15" cy="6" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="18" r="1.2" fill="currentColor"/><circle cx="15" cy="18" r="1.2" fill="currentColor"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
  play: '<path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/>',
}

export function Icon({ name, size = 22 }: { name: keyof typeof PATHS; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  )
}
