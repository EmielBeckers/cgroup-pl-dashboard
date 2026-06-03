'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { PL_ROWS } from '@/lib/pl-structure'
import { PlFull } from '@/lib/types'
import { cn, formatCurrency, formatDelta, formatDeltaPct } from '@/lib/utils'

interface Props {
  primary: PlFull
  primaryLabel: string
  comparison?: PlFull | null
  comparisonLabel?: string
  isHotel?: boolean
}

export function PlStatement({
  primary,
  primaryLabel,
  comparison,
  comparisonLabel,
  isHotel = false,
}: Props) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const toggle = (group: string) =>
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })

  const hasComp  = !!comparison
  const colSpan  = hasComp ? 7 : 3  // label + data cols

  function pct(value: number, pl: PlFull, pctBase?: keyof PlFull): string {
    const base = pctBase ? ((pl[pctBase] as number) || 1) : (pl.total_operating_revenue || 1)
    return `${((value / base) * 100).toFixed(1)}%`
  }

  function deltaClass(delta: number, kind: string): string {
    if (kind === 'neutral' || delta === 0) return 'text-text-faint'
    const goodIfPositive = kind === 'revenue' || kind === 'profit'
    return (goodIfPositive ? delta > 0 : delta < 0) ? 'text-success' : 'text-danger'
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth: hasComp ? 780 : 420 }}>
        <thead>
          {/* Group header row — shows period labels spanning columns */}
          <tr className="border-b border-border text-[10px] text-text-faint uppercase tracking-wider">
            <th className="text-left px-4 py-2 w-[260px]" />
            <th colSpan={2} className="text-center px-3 py-2 text-gold font-semibold border-l border-border/40">
              {primaryLabel}
            </th>
            {hasComp && (
              <>
                <th colSpan={2} className="text-center px-3 py-2 border-l border-border/40">
                  {comparisonLabel ?? '—'}
                </th>
                <th colSpan={2} className="text-center px-3 py-2 border-l border-border/40">
                  Verschil
                </th>
              </>
            )}
          </tr>
          {/* Column sub-header */}
          <tr className="border-b border-border text-[10px] text-text-faint uppercase tracking-wider bg-surface-raised/50">
            <th className="text-left px-4 py-2" />
            <th className="text-right px-3 py-2 border-l border-border/40 w-[90px]">€</th>
            <th className="text-right px-2 py-2 w-[50px]">%</th>
            {hasComp && (
              <>
                <th className="text-right px-3 py-2 border-l border-border/40 w-[90px]">€</th>
                <th className="text-right px-2 py-2 w-[50px]">%</th>
                <th className="text-right px-3 py-2 border-l border-border/40 w-[80px]">Δ€</th>
                <th className="text-right px-2 py-2 w-[50px]">Δ%</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {PL_ROWS.map(row => {
            if (row.showWhen === 'hotel' && !isHotel) return null
            if (row.showWhen === 'nonzero' && row.field) {
              if (!(primary[row.field] as number)) return null
            }
            if (row.collapseGroup && !expandedGroups.has(row.collapseGroup)) return null

            if (row.rowType === 'spacer') {
              return <tr key={row.key}><td colSpan={colSpan + 1} className="h-2" /></tr>
            }

            const controlsGroup =
              row.key === 'labour_header'    ? 'labour' :
              row.key === 'other_exp_header' ? 'other_expenses' :
              null

            if (row.rowType === 'section') {
              return (
                <tr key={row.key} className="select-none">
                  <td colSpan={colSpan + 1} className="px-4 pt-3 pb-1">
                    <button
                      className="flex items-center gap-1.5 group cursor-default"
                      onClick={controlsGroup ? () => toggle(controlsGroup) : undefined}
                    >
                      {controlsGroup && (
                        <span className="text-text-faint group-hover:text-text-muted transition-colors">
                          {expandedGroups.has(controlsGroup)
                            ? <ChevronDown size={13} />
                            : <ChevronRight size={13} />}
                        </span>
                      )}
                      <span className={cn(
                        'text-[10px] font-semibold uppercase tracking-widest',
                        controlsGroup
                          ? 'text-text-muted group-hover:text-text cursor-pointer'
                          : 'text-text-faint',
                      )}>
                        {row.label}
                      </span>
                    </button>
                  </td>
                </tr>
              )
            }

            const value     = row.field ? (primary[row.field]    as number) : 0
            const compValue = row.field && comparison ? (comparison[row.field] as number) : null
            const delta     = compValue != null ? value - compValue : null

            const isTotal    = row.rowType === 'total'
            const isSubtotal = row.rowType === 'subtotal'

            const indentClass =
              row.indent === 2 ? 'pl-10' :
              row.indent === 1 ? 'pl-7'  : 'pl-4'

            const profitColor =
              (isTotal || isSubtotal) && row.kind === 'profit'
                ? value >= 0 ? 'text-success' : 'text-danger'
                : null

            const compProfitColor =
              (isTotal || isSubtotal) && row.kind === 'profit' && compValue != null
                ? compValue >= 0 ? 'text-success' : 'text-danger'
                : null

            // Alternating row shading for non-total rows
            const rowBg = cn(
              isTotal    && 'bg-surface-raised border-t border-border font-medium',
              isSubtotal && 'border-t border-border/40',
              !isTotal   && 'even:bg-surface-raised/40 hover:bg-surface-raised/70',
            )

            return (
              <tr key={row.key} className={cn('border-b border-border/20 transition-colors', rowBg)}>
                {/* Label */}
                <td className={cn(
                  'py-2.5 text-xs',
                  indentClass,
                  isTotal    ? 'font-semibold text-text' :
                  isSubtotal ? 'font-medium text-text-muted' : 'text-text-muted',
                )}>
                  {row.label}
                </td>

                {/* Primary € */}
                <td className={cn(
                  'py-2.5 px-3 text-right tabular-nums text-xs border-l border-border/40',
                  profitColor ?? 'text-text',
                  isTotal    && 'font-semibold',
                  isSubtotal && 'font-medium',
                )}>
                  {row.field ? formatCurrency(value, true) : ''}
                </td>

                {/* Primary % */}
                <td className="py-2.5 px-2 text-right tabular-nums text-[11px] text-text-faint">
                  {row.field ? pct(value, primary, row.pctBase) : ''}
                </td>

                {/* Comparison columns */}
                {hasComp && (
                  <>
                    {/* Comp € */}
                    <td className={cn(
                      'py-2.5 px-3 text-right tabular-nums text-xs border-l border-border/40',
                      compProfitColor ?? 'text-text-muted',
                    )}>
                      {compValue != null && row.field ? formatCurrency(compValue, true) : '—'}
                    </td>

                    {/* Comp % */}
                    <td className="py-2.5 px-2 text-right tabular-nums text-[11px] text-text-faint">
                      {compValue != null && row.field && comparison
                        ? pct(compValue, comparison, row.pctBase)
                        : '—'}
                    </td>

                    {/* Δ€ */}
                    <td className={cn(
                      'py-2.5 px-3 text-right tabular-nums text-[11px] border-l border-border/40',
                      delta != null ? deltaClass(delta, row.kind) : 'text-text-faint',
                    )}>
                      {delta != null ? formatDelta(delta) : '—'}
                    </td>

                    {/* Δ% */}
                    <td className={cn(
                      'py-2.5 px-2 text-right tabular-nums text-[11px]',
                      delta != null ? deltaClass(delta, row.kind) : 'text-text-faint',
                    )}>
                      {delta != null && compValue != null
                        ? formatDeltaPct(value, compValue)
                        : '—'}
                    </td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

