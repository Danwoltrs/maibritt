export interface QuickUploadFabVisibility {
  isAuthenticated: boolean
  loading: boolean
  pathname: string | null
  dialogOpen: boolean
}

/**
 * Whether the floating quick-upload button should be rendered.
 * Viewport (mobile-only) is handled by CSS (`lg:hidden`), not here.
 */
export function shouldShowQuickUploadFab({
  isAuthenticated,
  loading,
  pathname,
  dialogOpen,
}: QuickUploadFabVisibility): boolean {
  if (loading) return false
  if (!isAuthenticated) return false
  if (dialogOpen) return false
  if (pathname === '/login') return false
  return true
}
