interface SectionHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
}

export function SectionHeader({ title, subtitle, icon }: SectionHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-navy-50 flex items-center justify-center text-navy-600">
            {icon}
          </div>
        )}
        <h2 className="font-serif text-2xl text-ink-950">{title}</h2>
      </div>
      {subtitle && <p className="text-ink-600 text-sm ml-12">{subtitle}</p>}
      <div className="mt-4 h-px bg-ink-100" />
    </div>
  )
}
