'use client'

import { Quote } from '@/services/quotes.service'

interface PressClipProps {
  quote: Quote
}

export default function PressClip({ quote }: PressClipProps) {
  return (
    <div className="border border-dashed border-[#e0d8cc] p-3.5 px-4 bg-white">
      <div className="text-[8px] tracking-[3px] uppercase text-[#b8956a] mb-1.5">
        Press {quote.source ? `· ${quote.source}` : ''}
      </div>
      <blockquote className="font-serif text-sm italic leading-snug mb-1.5">
        &ldquo;{quote.quoteEn || quote.quotePt}&rdquo;
      </blockquote>
      <small className="text-[9px] text-[#9a9080]">
        {quote.author && <span>{quote.author}</span>}
        {quote.sourceDate && (
          <span>
            {quote.author ? ' · ' : ''}
            {new Date(quote.sourceDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        )}
      </small>
    </div>
  )
}
