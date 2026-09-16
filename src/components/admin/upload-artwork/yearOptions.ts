/** Earliest year the artist can enter — guards against typos like "198". */
export const MIN_YEAR = 1900
/** Latest year the artist can enter, relative to the current year. */
export const MAX_YEAR = 2100

/**
 * Build the year dropdown's options: every year already used in the catalogue,
 * plus the current year and whatever is currently selected, newest first.
 */
export function buildYearOptions(
  usedYears: number[],
  selected: number | undefined,
  currentYear: number
): number[] {
  const all = [...usedYears, currentYear, selected]
  const unique = new Set<number>()
  for (const y of all) {
    if (typeof y === 'number' && Number.isFinite(y)) unique.add(y)
  }
  return [...unique].sort((a, b) => b - a)
}

/**
 * Parse a year typed into the "add year" box. Returns null for anything that
 * isn't a plausible whole year, so the caller can simply ignore bad input.
 */
export function parseYearInput(raw: string): number | null {
  const trimmed = (raw || '').trim()
  if (!/^\d{4}$/.test(trimmed)) return null
  const year = Number(trimmed)
  if (year < MIN_YEAR || year > MAX_YEAR) return null
  return year
}
