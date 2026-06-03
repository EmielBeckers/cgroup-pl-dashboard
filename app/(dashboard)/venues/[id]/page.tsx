'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TopBar } from '@/components/layout/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { KpiCard } from '@/components/ui/kpi-card'
import { PlStatement } from '@/components/pl/pl-statement'
import { PeriodSelector } from '@/components/ui/period-selector'
import {
  PeriodState, CompState, DateRange,
  latestPeriod, resolvePeriodRange, resolveCompRange, filterRows, rangeLabel,
} from '@/lib/period'
import { derivePl, formatCurrency, sumSnapshots, MONTH_NAMES } from '@/lib/utils'
import { PlSnapshot, PlFull, Venue } from '@/lib/types'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

function deriveRange(rows: PlSnapshot[], range: DateRange): PlFull | null {
  const inRange = filterRows(rows, range)
  if (!inRange.length) return null
  return derivePl(inRange.length === 1 ? inRange[0] : sumSnapshots(inRange))
}

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [venue,   setVenue]   = useState<(Venue & { company?: { id: string; display_name: string } }) | null>(null)
  const [rows,    setRows]    = useState<PlSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const [period, setPeriod] = useState<PeriodState>({ type: 'ytd' })
  const [comp,   setComp]   = useState<CompState>({ type: 'vs_last_year' })

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('venues').select('*, company:companies(id, display_name)').eq('id', id).single(),
      supabase.from('pl_snapshots').select('*').eq('venue_id', id)
        .order('period_year', { ascending: true })
        .order('period_month', { ascending: true }),
    ]).then(([{ data: v, error: e1 }, { data: snaps, error: e2 }]) => {
      if (e1 || e2) { setError((e1 ?? e2)!.message); setLoading(false); return }
      setVenue(v as Venue & { company?: { id: string; display_name: string } })
      setRows((snaps ?? []) as PlSnapshot[])
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const latest        = latestPeriod(rows)
  const primaryRange  = latest ? resolvePeriodRange(period, latest) : null
  const compRange     = primaryRange ? resolveCompRange(comp, primaryRange) : null

  const primary    = primaryRange ? deriveRange(rows, primaryRange) : null
  const comparison = compRange    ? deriveRange(rows, compRange)    : null

  const primaryLabel = primaryRange ? rangeLabel(primaryRange) : '—'
  const compLabel    = compRange    ? rangeLabel(compRange)    : undefined

  const isHotel = venue?.type === 'hotel'

  // Full timeline for history table
  const timeline: PlFull[] = rows.map(derivePl).sort((a, b) =>
    a.period_year !== b.period_year
      ? a.period_year - b.period_year
      : a.period_month - b.period_month
  )

  if (loading) {
    return (
      <div className="flex flex-col flex-1">
        <TopBar title="Laden…" subtitle="" />
        <div className="p-6">
          <Card>
            <CardContent className="py-16 text-center text-text-muted text-sm animate-pulse">Laden…</CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!venue) {
    return (
      <div className="flex flex-col flex-1">
        <TopBar title="Niet gevonden" subtitle="" />
        <div className="p-6 text-text-muted text-sm">{error ?? 'Venue niet gevonden.'}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title={venue.name}
        subtitle={venue.company?.display_name ?? undefined}
      >
        <Link
          href={`/companies/${venue.company_id}`}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-gold transition-colors"
        >
          <ArrowLeft size={13} /> Terug naar entiteit
        </Link>
      </TopBar>

      <div className="p-6 flex flex-col gap-6">
        {error && <p className="text-sm text-danger">{error}</p>}

        {/* Period selector */}
        {latest && (
          <PeriodSelector
            period={period}
            comp={comp}
            onChange={(p, c) => { setPeriod(p); setComp(c) }}
          />
        )}

        {primary ? (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Omzet"
                value={primary.total_operating_revenue}
                isCurrency compact
                vsLastMonth={comparison
                  ? primary.total_operating_revenue - comparison.total_operating_revenue
                  : undefined}
              />
              <KpiCard
                label="GOP"
                value={primary.gop}
                isCurrency compact
                vsLastMonth={comparison ? primary.gop - comparison.gop : undefined}
              />
              <KpiCard
                label="EBITDA"
                value={primary.ebitda}
                isCurrency compact
                vsLastMonth={comparison ? primary.ebitda - comparison.ebitda : undefined}
              />
              <KpiCard label="EBITDA-marge" value={primary.ebitda_margin_pct} isPercent />
            </div>

            {/* Full USALI P&L */}
            <Card>
              <CardHeader>
                <CardTitle>P&L — {primaryLabel}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pb-4">
                <PlStatement
                  primary={primary}
                  primaryLabel={primaryLabel}
                  comparison={comparison}
                  comparisonLabel={compLabel}
                  isHotel={isHotel}
                />
              </CardContent>
            </Card>

            {/* Monthly history */}
            <Card>
              <CardHeader><CardTitle>Maandelijks overzicht</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead>
                      <tr className="border-b border-border text-text-faint text-xs uppercase tracking-wide bg-surface-raised/50">
                        <th className="text-left px-5 py-3">Maand</th>
                        <th className="text-right px-4 py-3">Omzet</th>
                        <th className="text-right px-4 py-3">Brutowinst</th>
                        <th className="text-right px-4 py-3">GOP</th>
                        <th className="text-right px-5 py-3">EBITDA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[...timeline].reverse().map(row => (
                        <tr key={`${row.period_year}-${row.period_month}`} className="hover:bg-surface-raised transition-colors">
                          <td className="px-5 py-3 text-text-muted text-xs">
                            {MONTH_NAMES[row.period_month - 1]} {row.period_year}
                          </td>
                          <td className="px-4 py-3 text-right text-text text-xs tabular-nums">
                            {formatCurrency(row.total_operating_revenue, true)}
                          </td>
                          <td className="px-4 py-3 text-right text-text-muted text-xs tabular-nums">
                            {formatCurrency(row.gross_profit, true)}
                          </td>
                          <td className="px-4 py-3 text-right text-xs tabular-nums">
                            <span className={row.gop >= 0 ? 'text-text-muted' : 'text-danger'}>
                              {formatCurrency(row.gop, true)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-xs tabular-nums">
                            <span className={row.ebitda >= 0 ? 'text-success' : 'text-danger'}>
                              {formatCurrency(row.ebitda, true)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <p className="text-text-muted text-sm py-10 text-center">
            Geen P&L data voor {venue.name}.
          </p>
        )}
      </div>
    </div>
  )
}
