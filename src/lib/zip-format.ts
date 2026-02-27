/**
 * Format zip/postal codes based on country.
 * Strips non-alphanumeric chars then applies country-specific formatting.
 */

const formatters: Record<string, (digits: string) => string> = {
  // Brazil: 00000-000
  BR: (d) => {
    if (d.length <= 5) return d
    return `${d.slice(0, 5)}-${d.slice(5, 8)}`
  },
  // US: 00000 or 00000-0000
  US: (d) => {
    if (d.length <= 5) return d
    return `${d.slice(0, 5)}-${d.slice(5, 9)}`
  },
  // UK: varies, just uppercase and add space in middle
  GB: (raw) => {
    const clean = raw.toUpperCase()
    if (clean.length <= 3) return clean
    return `${clean.slice(0, clean.length - 3)} ${clean.slice(clean.length - 3)}`
  },
  // Canada: A0A 0A0
  CA: (raw) => {
    const clean = raw.toUpperCase()
    if (clean.length <= 3) return clean
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)}`
  },
  // Portugal: 0000-000
  PT: (d) => {
    if (d.length <= 4) return d
    return `${d.slice(0, 4)}-${d.slice(4, 7)}`
  },
  // Germany, France, Italy, Spain, etc: 5-digit, no formatting needed
}

export function formatZipCode(value: string, countryCode?: string): string {
  if (!value) return ''
  const stripped = value.replace(/[^a-zA-Z0-9]/g, '')
  const code = countryCode?.toUpperCase() || ''
  const formatter = formatters[code]
  return formatter ? formatter(stripped) : stripped
}

export function getZipPlaceholder(countryCode?: string): string {
  const placeholders: Record<string, string> = {
    BR: '00000-000',
    US: '00000',
    GB: 'SW1A 1AA',
    CA: 'A0A 0A0',
    PT: '0000-000',
    DE: '00000',
    FR: '00000',
    DK: '0000',
  }
  return placeholders[countryCode?.toUpperCase() || ''] || 'Zip / Postal code'
}
