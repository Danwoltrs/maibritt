/** Artist convention (confirmed): first number is HEIGHT, second is WIDTH, in cm. */
export function parseDimensionsToCm(
  text: string,
): { heightCm: number; widthCm: number } | null {
  if (!text) return null
  const m = text.replace(/,/g, '.').match(/(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)/)
  if (!m) return null
  const heightCm = parseFloat(m[1])
  const widthCm = parseFloat(m[2])
  const plausible = (v: number) => v >= 1 && v <= 999
  if (!plausible(heightCm) || !plausible(widthCm)) return null
  return { heightCm, widthCm }
}

function fmt(v: number): string {
  // Trim trailing zeros, Brazilian decimal comma: 80.5 -> "80,5", 185 -> "185"
  return String(Math.round(v * 10) / 10).replace('.', ',')
}

export function composeDimensions(heightCm?: number, widthCm?: number): string {
  if (
    heightCm == null || widthCm == null ||
    !Number.isFinite(heightCm) || !Number.isFinite(widthCm) ||
    heightCm <= 0 || widthCm <= 0
  ) return ''
  return `${fmt(heightCm)} x ${fmt(widthCm)} cm`
}
