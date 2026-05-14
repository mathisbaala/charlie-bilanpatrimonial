'use client'

interface TooltipProps {
  content: string
  className?: string
}

export function Tooltip({ content, className = '' }: TooltipProps) {
  return (
    <span className={`relative inline-flex items-center group ${className}`}>
      <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full border border-ink-300 text-ink-400 text-[10px] font-medium cursor-help select-none hover:border-gold hover:text-gold transition-colors">
        ?
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg bg-navy px-3 py-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 shadow-lg">
        {content}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy" />
      </span>
    </span>
  )
}
