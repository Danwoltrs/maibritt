/** A crop rectangle that may be tilted. All values in pixels of the image it was measured on. */
export interface RotatedRect {
  cx: number
  cy: number
  width: number
  height: number
  angleDeg: number
}

export interface DeshadowOptions {
  blurSigma?: number
  minGain?: number
  maxGain?: number
}

export interface ColorOptions {
  minGain?: number
  maxGain?: number
}

export interface EnhanceResult {
  enhancedPath: string // bare corrected painting (PNG)
  framedPath: string   // framed catalogue image (PNG) — the public display
  framePreset: string
}
