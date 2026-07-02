import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: {}, supabaseAdmin: null }))

const { ArtworkService } = await import('./artwork.service')

const row = {
  id: 'a1', slug: 's', title_pt: 't', title_en: 't', year: 2026,
  medium_pt: 'm', medium_en: 'm', dimensions: '185 x 285 cm',
  category: 'painting', images: [], for_sale: false,
  created_at: '2026-01-01', updated_at: '2026-01-01',
}

describe('transformArtworkFromDB numeric dimensions', () => {
  it('maps height_cm/width_cm to numbers (PostgREST may send strings)', () => {
    const t = (ArtworkService as any).transformArtworkFromDB({ ...row, height_cm: '185.0', width_cm: 285 })
    expect(t.heightCm).toBe(185)
    expect(t.widthCm).toBe(285)
  })
  it('leaves them undefined when NULL', () => {
    const t = (ArtworkService as any).transformArtworkFromDB({ ...row, height_cm: null, width_cm: null })
    expect(t.heightCm).toBeUndefined()
    expect(t.widthCm).toBeUndefined()
  })
})
