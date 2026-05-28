'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { PL_ROWS } from '@/lib/pl-structure'
import { PlFull } from '@/lib/types'
import { cn, formatCurrency, formatDelta, formatDeltaPct } from '@/lib/utils'

interface Props {
  current: PlFull
  prevMonth?: PlFull | null
  prevYear?: PlFull | null
  ytd?: PlFull | null
  isHotel?: boolean
}

export function PlStatement({ current, prevMonth, prevYear, ytd, isHotel = false }: Props) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const toggle = (group: string) =>
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })

  const revBase = current.total_operating_revenue || 1

  function pctOfRev(value: number, pctBase?: keyof PlFull): string {
    const base = pctBase ? ((current[pctBase] as number) || 1) : revBase
    return `${((value / base) * 100).toFixed(1)}%`
  }

  function ytdPctOfRev(value: number, pctBase?: keyof PlFull): string {
    if (!ytd) return '—'
    const base = pctBase
      ? ((ytd[pctBase] as number) || 1)
      : (ytd.total_operating_revenue || 1)
    return `${((value / base) * 100).toFixed(1)}%`
  }

  function deltaClass(delta: number, kind: string): string {
    if (kind === 'neutral' || delta === 0) return 'text-text-faint'
    const goodIfPositive = kind === 'revenue' || kind === 'profit'
    const positive = delta > 0
    return (goodIfPositive ? positive : !positive) ? 'text-success' : 'text-danger'
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[880px]">
        <thead>
          <tr className="border-b border-border text-text-faint text-[11px] uppercase tracking-wider">
            <th className="text-left px-4 py-2.5 w-[260px]" />
            <th className="text-right px-3 py-2.5 w-[88px]">€</th>
            <th className="text-right px-2 py-2.5 w-[52px]">%</th>
            <th className="text-right px-3 py-2.5 w-[80px]">vs VM</th>
            <th className="text-right px-2 py-2.5 w-[52px]">Δ%</th>
            <th className="text-right px-3 py-2.5 w-[80px]">vs VJ</th>
            <th className="text-right px-2 py-2.5 w-[52px]">Δ%</th>
            <th className="text-right px-3 py-2.5 w-[88px]">YTD</th>
            <th className="text-right px-2 py-2.5 w-[52px]">%</th>
          </tr>
        </thead>
        <tbody>
          {PL_ROWS.map(row => {
            // Visibility filters
            if (row.showWhen === 'hotel' && !isHotel) return null
            if (row.showWhen === 'nonzero' && row.field) {
              if (!(current[row.field] as number)) return null
            }
            // Collapse filter
            if (row.collapseGroup && !expandedGroups.has(row.collapseGroup)) return null

            if (row.rowType === 'spacer') {
              return <tr key={row.key}><td colSpan={9} className="h-2.5" /></tr>
            }

            const controlsGroup =
              row.key === 'labour_header' ? 'labour' :
              row.key === 'other_exp_header' ? 'other_expenses' :
              null

            if (row.rowType === 'section') {
              return (
                <tr key={row.key} className="select-none">
                  <td colSpan={9} className="px-4 pt-3 pb-1">
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
                        controlsGroup ? 'text-text-muted group-hover:text-text cursor-pointer' : 'text-text-faint',
                      )}>
                        {row.label}
                      </span>
                    </button>
                  </td>
                </tr>
              )
            }

            const value    = row.field ? (current[row.field] as number) : 0
            const lmValue  = prevMonth && row.field ? (prevMonth[row.field] as number) : null
            const lyValue  = prevYear  && row.field ? (prevYear[row.field]  as number) : null
            const ytdValue = ytd       && row.field ? (ytd[row.field]       as number) : null
            const deltaLm  = lmValue != null ? value - lmValue : null
            const deltaLy  = lyValue != null ? value - lyValue : null

            const isTotal    = row.rowType === 'total'
            const isSubtotal = row.rowType === 'subtotal'

            const indentClass =
              row.indent === 2 ? 'pl-10' :
              row.indent === 1 ? 'pl-7'  : 'pl-4'

            const profitColor =
              (isTotal || isSubtotal) && row.kind === 'profit'
                ? value >= 0 ? 'text-success' : 'text-danger'
                : null

            return (
              <tr
                key={row.key}
                className={cn(
                  'border-b border-border/25',
                  isTotal    && 'bg-surface-raised border-t border-border',
                  isSubtotal && 'border-t border-border/50',
                  !isTotal   && 'hover:bg-surface-raised/40',
                )}
              >
                {/* Label */}
                <td className={cn(
                  'py-2 text-xs',
                  indentClass,
                  isTotal    ? 'font-semibold text-text' :
                  isSubtotal ? 'font-medium text-text-muted' : 'text-text-muted',
                )}>
                  {row.label}
                </td>

                {/* € current */}
                <td className={cn(
                  'py-2 px-3 text-right tabular-nums text-xs',
                  profitColor ?? 'text-text',
                  isTotal    && 'font-semibold',
                  isSubtotal && 'font-medium',
                )}>
                  {row.field ? formatCurrency(value, true) : ''}
                </td>

                {/* % current */}
                <td className="py-2 px-2 text-right tabular-nums text-[11px] text-text-faint">
                  {row.field ? pctOfRev(value, row.pctBase) : ''}
                </td>

                {/* vs LM */}
                <td className={cn('py-2 px-3 text-right tabular-nums text-[11px]',
                  deltaLm != null ? deltaClass(deltaLm, row.kind) : 'text-text-faint',
                )}>
                  {deltaLm != null ? formatDelta(deltaLm) : '—'}
                </td>

                {/* vs LM Δ% */}
                <td className={cn('py-2 px-2 text-right tabular-nums text-[11px]',
                  deltaLm != null ? deltaClass(deltaLm, row.kind) : 'text-text-faint',
                )}>
                  {deltaLm != null && lmValue != null ? formatDeltaPct(value, lmValue) : '—'}
                </td>

                {/* vs LY */}
                <td className={cn('py-2 px-3 text-right tabular-nums text-[11px]',
                  deltaLy != null ? deltaClass(deltaLy, row.kind) : 'text-text-faint',
                )}>
                  {deltaLy != null ? formatDelta(deltaLy) : '—'}
                </td>

                {/* vs LY Δ% */}
                <td className={cn('py-2 px-2 text-right tabular-nums text-[11px]',
                  deltaLy != null ? deltaClass(deltaLy, row.kind) : 'text-text-faint',
                )}>
                  {deltaLy != null && lyValue != null ? formatDeltaPct(value, lyValue) : '—'}
                </td>

                {/* YTD € */}
                <td className={cn(
                  'py-2 px-3 text-right tabular-nums text-[11px]',
                  (isTotal || isSubtotal) && row.kind === 'profit'
                    ? ytdValue != null && ytdValue >= 0 ? 'text-success' : 'text-danger'
                    : 'text-text-muted',
                )}>
                  {ytdValue != null ? formatCurrency(ytdValue, true) : '—'}
                </td>

                {/* YTD % */}
                <td className="py-2 px-2 text-right tabular-nums text-[11px] text-text-faint">
                  {ytdValue != null && row.field ? ytdPctOfRev(ytdValue, row.pctBase) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
