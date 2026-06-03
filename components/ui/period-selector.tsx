'use client'

import { PeriodState, CompState, PeriodType, CompType, MonthYear } from '@/lib/period'
import { MONTH_NAMES } from '@/lib/utils'
import { cn } from '@/lib/utils'

const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'this_month', label: 'Deze maand' },
  { value: 'last_month', label: 'Vorige maand' },
  { value: 'ytd',        label: 'Dit jaar (YTD)' },
  { value: 'last_year',  label: 'Vorig jaar (volledig)' },
  { value: 'custom',     label: 'Aangepast…' },
]

const COMP_OPTIONS: { value: CompType; label: string }[] = [
  { value: 'none',          label: 'Geen vergelijking' },
  { value: 'vs_last_month', label: 'vs vorige maand' },
  { value: 'vs_last_year',  label: 'vs zelfde periode vorig jaar' },
  { value: 'custom',        label: 'Aangepast…' },
]

const currentYear = new Date().getFullYear()
const YEARS = [currentYear - 2, currentYear - 1, currentYear]

interface Props {
  period: PeriodState
  comp: CompState
  onChange: (period: PeriodState, comp: CompState) => void
  className?: string
}

function MonthYearPicker({
  value,
  onChange,
  label,
}: {
  value: MonthYear
  onChange: (v: MonthYear) => void
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-text-faint text-xs">{label}</span>
      <select
        value={value.month}
        onChange={e => onChange({ ...value, month: Number(e.target.value) })}
        className={selectClass}
      >
        {MONTH_NAMES.map((name, i) => (
          <option key={i} value={i + 1}>{name.slice(0, 3)}</option>
        ))}
      </select>
      <select
        value={value.year}
        onChange={e => onChange({ ...value, year: Number(e.target.value) })}
        className={selectClass}
      >
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </span>
  )
}

const selectClass = cn(
  'h-7 rounded-md border border-border bg-surface px-2 py-0 text-xs text-text',
  'focus:outline-none focus:ring-1 focus:ring-gold/50',
  'appearance-none cursor-pointer',
)

export function PeriodSelector({ period, comp, onChange, className }: Props) {
  const defaultMY: MonthYear = { year: currentYear, month: new Date().getMonth() + 1 }

  function setPeriodType(type: PeriodType) {
    const next: PeriodState = {
      ...period,
      type,
      customStart: period.customStart ?? defaultMY,
      customEnd:   period.customEnd   ?? defaultMY,
    }
    onChange(next, comp)
  }

  function setCompType(type: CompType) {
    const next: CompState = {
      ...comp,
      type,
      customStart: comp.customStart ?? defaultMY,
      customEnd:   comp.customEnd   ?? defaultMY,
    }
    onChange(period, next)
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted font-medium">Periode</span>
        <select
          value={period.type}
          onChange={e => setPeriodType(e.target.value as PeriodType)}
          className={selectClass}
        >
          {PERIOD_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {period.type === 'custom' && (
          <span className="flex items-center gap-2">
            <MonthYearPicker
              label="van"
              value={period.customStart ?? defaultMY}
              onChange={v => onChange({ ...period, customStart: v }, comp)}
            />
            <MonthYearPicker
              label="t/m"
              value={period.customEnd ?? defaultMY}
              onChange={v => onChange({ ...period, customEnd: v }, comp)}
            />
          </span>
        )}
      </div>

      <span className="text-border text-sm hidden sm:block">|</span>

      {/* Comparison selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted font-medium">Vergelijk</span>
        <select
          value={comp.type}
          onChange={e => setCompType(e.target.value as CompType)}
          className={selectClass}
        >
          {COMP_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {comp.type === 'custom' && (
          <span className="flex items-center gap-2">
            <MonthYearPicker
              label="van"
              value={comp.customStart ?? defaultMY}
              onChange={v => onChange(period, { ...comp, customStart: v })}
            />
            <MonthYearPicker
              label="t/m"
              value={comp.customEnd ?? defaultMY}
              onChange={v => onChange(period, { ...comp, customEnd: v })}
            />
          </span>
        )}
      </div>
    </div>
  )
}
