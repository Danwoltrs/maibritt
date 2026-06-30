export interface ScrollHideInput {
  /** Previous scrollY (px). */
  prevY: number
  /** Current scrollY (px). */
  currentY: number
  /** Whether the FAB is currently hidden by scroll. */
  prevHidden: boolean
  /** Always show at/above this scroll position (px). */
  topThreshold?: number
  /** Minimum movement (px) before reacting, to avoid jitter. */
  delta?: number
}

/**
 * Decide whether the FAB should be hidden based on scroll movement.
 * - Always visible near the top of the page (currentY <= topThreshold).
 * - Hide when scrolling DOWN past `delta`.
 * - Show when scrolling UP past `delta`.
 * - Otherwise keep the previous state (avoids jitter on tiny movements).
 */
export function computeScrollHidden({
  prevY,
  currentY,
  prevHidden,
  topThreshold = 80,
  delta = 6,
}: ScrollHideInput): boolean {
  if (currentY <= topThreshold) return false
  const diff = currentY - prevY
  if (diff > delta) return true
  if (diff < -delta) return false
  return prevHidden
}
