export type FrameFamily = 'floater' | 'matted'

export interface FramePreset {
  key: string
  label: string            // bilingual "EN / PT"
  family: FrameFamily
  texturePath: string      // wood texture swatch in /public
  frameWidthFrac: number   // frame strip width as fraction of long edge
}

export const FRAME_PRESETS: Record<string, FramePreset> = {
  'oak-floater':   { key: 'oak-floater',   label: 'Natural Oak / Carvalho Natural', family: 'floater', texturePath: 'public/frames/oak.png',    frameWidthFrac: 0.022 },
  'ash-floater':   { key: 'ash-floater',   label: 'Pale Ash / Freixo Claro',        family: 'floater', texturePath: 'public/frames/ash.png',    frameWidthFrac: 0.022 },
  'walnut-floater':{ key: 'walnut-floater',label: 'Walnut / Nogueira',              family: 'floater', texturePath: 'public/frames/walnut.png', frameWidthFrac: 0.022 },
  'black-floater': { key: 'black-floater', label: 'Thin Black / Preto Fino',        family: 'floater', texturePath: 'public/frames/black.png',  frameWidthFrac: 0.016 },
  'oak-mat':       { key: 'oak-mat',       label: 'Oak + White Mat / Carvalho + Paspatur Branco', family: 'matted', texturePath: 'public/frames/oak.png', frameWidthFrac: 0.020 },
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
