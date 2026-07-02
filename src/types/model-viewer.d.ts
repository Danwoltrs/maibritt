import type React from 'react'

// Minimal typing for Google's <model-viewer> custom element (React 19 JSX).
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string
        'ios-src'?: string
        alt?: string
        ar?: boolean
        'ar-modes'?: string
        'ar-placement'?: string
        'ar-scale'?: string
        'camera-controls'?: boolean
        'shadow-intensity'?: string
        style?: React.CSSProperties
      }
    }
  }
}
