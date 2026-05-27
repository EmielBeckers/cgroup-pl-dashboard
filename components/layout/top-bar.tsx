import { monthLabel } from '@/lib/utils'

interface TopBarProps {
  title: string
  subtitle?: string
  period?: { year: number; month: number }
  children?: React.ReactNode
}

export function TopBar({ title, subtitle, period, children }: TopBarProps) {
  return (
    <header className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-base font-semibold text-text">{title}</h1>
        {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        {period && (
          <p className="text-xs text-text-muted mt-0.5">
            {monthLabel(period.year, period.month)}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </header>
  )
}
