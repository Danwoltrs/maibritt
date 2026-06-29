/** A crop rectangle that may be tilted. All values in pixels of the image it was measured on. */
export interface RotatedRect {
  cx: number
  cy: number
  width: number
  height: number
  angleDeg: number
}

/** A point. In a Quad, x/y are normalized fractions in [0,1] of the image's width/height. */
export interface Pt {
  x: number
  y: number
}

/**
 * The four corners of the canvas as the camera saw them — a general
 * quadrilateral (so it can be a perspective-distorted trapezoid, not just a
 * tilted rectangle). Corners are normalized to [0,1] so they are independent of
 * mask vs. original vs. working image resolution. Order: top-left, top-right,
 * bottom-right, bottom-left (clockwise from TL).
 */
export interface Quad {
  tl: Pt
  tr: Pt
  br: Pt
  bl: Pt
}

export interface DeshadowOptions {
  blurSigma?: number
  minGain?: number
  maxGain?: number
}

export interface ColorOptions {
  /** Lower clamp on the scalar exposure gain (default 0.9 — never darken harshly). */
  minGain?: number
  /** Upper clamp on the scalar exposure gain (default 1.15 — only a gentle lift). */
  maxGain?: number
  /** Luminance value the robust bright point is mapped toward (default 245). */
  targetHigh?: number
}

export interface EnhanceResult {
  enhancedPath: string // bare corrected painting (PNG)
  framedPath: string   // framed catalogue image (PNG) — the public display
  framePreset: string
}
