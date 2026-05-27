import { cn, formatCurrency, formatMargin } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: number
  isCurrency?: boolean
  isPercent?: boolean
  vsLastMonth?: number   // absolute change
  compact?: boolean
  className?: string
}

export function KpiCard({
  label, value, isCurrency = false, isPercent = false,
  vsLastMonth, compact = false, className,
}: KpiCardProps) {
  const formatted = isCurrency
    ? formatCurrency(value, compact)
    : isPercent
      ? formatMargin(value)
      : value.toLocaleString('nl-BE')

  const trend = vsLastMonth
  const trendPct = vsLastMonth && Math.abs(vsLastMonth) > 0
    ? (vsLastMonth / (value - vsLastMonth)) * 100
    : undefined

  return (
    <div className={cn(
      'bg-surface border border-border rounded-lg px-5 py-4 flex flex-col gap-1',
      className
    )}>
      <p className="text-xs font-medium text-text-muted uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-semibold text-text">{formatted}</p>
      {trendPct !== undefined && (
        <p className={cn(
          'text-xs flex items-center gap-1',
          trend! > 0 ? 'text-success' : trend! < 0 ? 'text-danger' : 'text-text-muted'
        )}>
          {trend! > 0 ? <TrendingUp size={12} /> : trend! < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
          {trendPct > 0 ? '+' : ''}{trendPct.toFixed(1)}% vs vorige maand
        </p>
      )}
    </div>
  )
}
