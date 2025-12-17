import { getHighlightedParts } from '@/lib/utils'

interface HighlightTextProps {
  text: string
  query: string
  className?: string
}

export function HighlightText({ text, query, className }: HighlightTextProps) {
  if (!text) return null
  
  const parts = getHighlightedParts(text, query)
  
  return (
    <span className={className}>
      {parts.map((part, index) => 
        part.highlight ? (
          <mark 
            key={index} 
            className="bg-highlight-bg text-highlight-fg rounded-sm px-0.5 font-medium"
          >
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </span>
  )
}
