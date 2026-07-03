export type FrameFamily = 'floater' | 'matted'

export interface FramePreset {
  key: string
  label: string            // bilingual "EN / PT"
  family: FrameFamily
  texturePath: string      // wood texture swatch in /public
  frameWidthFrac: number   // frame strip width as fraction of long edge
  woodHex: string          // sRGB frame color for the AR 3D model. Changing woodHex/frameWidthFrac requires bumping AR_MODEL_VERSION in src/lib/ar/constants.ts (cached AR models hash the preset KEY only).
}

export const FRAME_PRESETS: Record<string, FramePreset> = {
  'oak-floater':   { key: 'oak-floater',   label: 'Natural Oak / Carvalho Natural', family: 'floater', texturePath: 'public/frames/oak.png',    frameWidthFrac: 0.022, woodHex: '#C6A678' },
  'ash-floater':   { key: 'ash-floater',   label: 'Pale Ash / Freixo Claro',        family: 'floater', texturePath: 'public/frames/ash.png',    frameWidthFrac: 0.022, woodHex: '#D8CDBA' },
  'walnut-floater':{ key: 'walnut-floater',label: 'Walnut / Nogueira',              family: 'floater', texturePath: 'public/frames/walnut.png', frameWidthFrac: 0.022, woodHex: '#7A5A3E' },
  'black-floater': { key: 'black-floater', label: 'Thin Black / Preto Fino',        family: 'floater', texturePath: 'public/frames/black.png',  frameWidthFrac: 0.016, woodHex: '#222222' },
  'oak-mat':       { key: 'oak-mat',       label: 'Oak + White Mat / Carvalho + Paspatur Branco', family: 'matted', texturePath: 'public/frames/oak.png', frameWidthFrac: 0.020, woodHex: '#C6A678' },
}

export function defaultPresetForCategory(category: string): string {
  switch (category) {
    case 'engraving': return 'oak-mat'
    case 'painting':
    case 'mixed-media':
    default:          return 'oak-floater'
  }
}

export function isEnhanceable(category: string): boolean {
  return category === 'painting' || category === 'engraving' || category === 'mixed-media'
}
