import { describe, it, expect } from 'vitest'
import { MAX_INDENT, plainFromRich, richFromElement, richFromPlain, richToHtml, setParagraphAlign, setParagraphIndent } from './rich'
import type { RichText } from './types'

const el = (html: string): HTMLElement => {
  const d = document.createElement('div')
  d.innerHTML = html
  return d
}

describe('richFromPlain / plainFromRich', () => {
  it('splits on blank lines and round trips', () => {
    const rich = richFromPlain('One line.\n\nSecond paragraph.')
    expect(rich).toEqual([{ runs: [{ text: 'One line.' }] }, { runs: [{ text: 'Second paragraph.' }] }])
    expect(plainFromRich(rich)).toBe('One line.\n\nSecond paragraph.')
  })
  it('gives one empty paragraph for empty text', () => {
    expect(richFromPlain('')).toEqual([{ runs: [] }])
    expect(plainFromRich([{ runs: [] }])).toBe('')
  })
  it('drops blank paragraphs and trims', () => {
    expect(richFromPlain('  A  \n\n\n\n  B ')).toEqual([{ runs: [{ text: 'A' }] }, { runs: [{ text: 'B' }] }])
  })
})

describe('richToHtml', () => {
  it('emits only paragraphs and the three marks', () => {
    const rich: RichText = [{ runs: [{ text: 'plain ' }, { text: 'bold', marks: ['bold'] }, { text: ' and ' }, { text: 'both', marks: ['italic', 'underline'] }] }]
    const html = richToHtml(rich)
    expect(html).toBe('<p>plain <strong>bold</strong> and <em><u>both</u></em></p>')
  })
  it('escapes text', () => {
    expect(richToHtml([{ runs: [{ text: '<script>a & b</script>' }] }])).toBe('<p>&lt;script&gt;a &amp; b&lt;/script&gt;</p>')
  })
  it('carries alignment and indent', () => {
    const html = richToHtml([{ runs: [{ text: 'x' }], align: 'center', indent: 2 }])
    expect(html).toContain('text-align:center')
    expect(html).toContain('padding-left:64px')
  })
  it('keeps an empty paragraph visible', () => {
    expect(richToHtml([{ runs: [] }])).toBe('<p><br></p>')
  })
})

describe('richFromElement', () => {
  it('reads paragraphs, marks and nesting', () => {
    expect(richFromElement(el('<p>plain <b>bold <i>both</i></b></p>'))).toEqual([
      { runs: [{ text: 'plain ' }, { text: 'bold ', marks: ['bold'] }, { text: 'both', marks: ['bold', 'italic'] }] },
    ])
  })
  it('treats div and br as blocks', () => {
    expect(richFromElement(el('<div>one</div><div>two</div>'))).toEqual([
      { runs: [{ text: 'one' }] },
      { runs: [{ text: 'two' }] },
    ])
  })
  it('keeps text from unknown tags and drops dangerous ones', () => {
    const rich = richFromElement(el('<p><span style="color:red">kept</span><script>alert(1)</script></p>'))
    expect(rich).toEqual([{ runs: [{ text: 'kept' }] }])
  })
  it('reads alignment and indent from the block style', () => {
    expect(richFromElement(el('<p style="text-align:right;padding-left:64px">x</p>'))).toEqual([
      { runs: [{ text: 'x' }], align: 'right', indent: 2 },
    ])
  })
  it('merges neighbouring runs with the same marks', () => {
    expect(richFromElement(el('<p><b>a</b><b>b</b></p>'))).toEqual([{ runs: [{ text: 'ab', marks: ['bold'] }] }])
  })
  it('gives one empty paragraph for an empty element', () => {
    expect(richFromElement(el(''))).toEqual([{ runs: [] }])
    expect(richFromElement(el('<p><br></p>'))).toEqual([{ runs: [] }])
  })
  it('survives a full round trip', () => {
    const rich: RichText = [
      { runs: [{ text: 'A ' }, { text: 'bold', marks: ['bold'] }] },
      { runs: [{ text: 'B' }], align: 'center', indent: 1 },
    ]
    expect(richFromElement(el(richToHtml(rich)))).toEqual(rich)
  })
})

describe('paragraph setters', () => {
  const rich: RichText = [{ runs: [{ text: 'a' }] }, { runs: [{ text: 'b' }] }]
  it('sets alignment on one paragraph only', () => {
    const next = setParagraphAlign(rich, 1, 'center')
    expect(next[1].align).toBe('center')
    expect(next[0].align).toBeUndefined()
    expect(rich[1].align).toBeUndefined()
  })
  it('removes alignment when set back to left', () => {
    expect(setParagraphAlign(setParagraphAlign(rich, 0, 'right'), 0, 'left')[0].align).toBeUndefined()
  })
  it('steps indent and clamps at both ends', () => {
    expect(setParagraphIndent(rich, 0, 1)[0].indent).toBe(1)
    expect(setParagraphIndent(rich, 0, -1)[0].indent).toBeUndefined()
    let r = rich
    for (let i = 0; i < 20; i++) r = setParagraphIndent(r, 0, 1)
    expect(r[0].indent).toBe(MAX_INDENT)
  })
  it('ignores an index out of range', () => {
    expect(setParagraphAlign(rich, 9, 'center')).toEqual(rich)
  })
})
