'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TopBar } from '@/components/layout/top-bar'
import { KpiCard } from '@/components/ui/kpi-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlStatement } from '@/components/pl/pl-statement'
import { PeriodSelector } from '@/components/ui/period-selector'
import {
  PeriodState, CompState, DateRange,
  latestPeriod, resolvePeriodRange, resolveCompRange, filterRows, rangeLabel,
} from '@/lib/period'
import { derivePl, formatCurrency, formatMargin, sumSnapshots } from '@/lib/utils'
import Link from 'next/link'
import { PlSnapshot, PlFull, Company } from '@/lib/types'
import { ArrowRight } from 'lucide-react'

type SnapshotRow = PlSnapshot & { company: Company }

function groupAndDerive(rows: PlSnapshot[]): PlFull | null {
  if (rows.length === 0) return null
  return derivePl(rows.length === 1 ? rows[0] : sumSnapshots(rows))
}

function aggregateByCompany(rows: SnapshotRow[]): Array<PlFull & { company: Company }> {
  const map = new Map<string, SnapshotRow[]>()
  for (const r of rows) {
    const g = map.get(r.company_id) ?? []
    g.push(r)
    map.set(r.company_id, g)
  }
  return Array.from(map.values()).map(g => {
    const full = derivePl(g.length === 1 ? g[0] : sumSnapshots(g)) as PlFull & { company: Company }
    full.company = g[0].company
    return full
  })
}

function computeData(
  rows: SnapshotRow[],
  range: DateRange,
): { primary: PlFull | null; byCompany: Array<PlFull & { company: Company }> } {
  const inRange = filterRows(rows, range)
  return {
    primary:   groupAndDerive(inRange),
    byCompany: aggregateByCompany(inRange).sort(
      (a, b) => b.total_operating_revenue - a.total_operating_revenue
    ),
  }
}

export default function DashboardPage() {
  const [rows,       setRows]       = useState<SnapshotRow[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  // Period selector state — default: YTD vs same period last year
  const [period, setPeriod] = useState<PeriodState>({ type: 'ytd' })
  const [comp,   setComp]   = useState<CompState>({ type: 'vs_last_year' })

  useEffect(() => {
    const now = new Date()
    const year = now.getFullYear()
    createClient()
      .from('pl_snapshots')
      .select('*, company:companies(id, name, display_name)')
      .not('venue_id', 'is', null)
      .gte('period_year', year - 2)
      .limit(2000)
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); setLoading(false); return }
        setRows((data ?? []) as SnapshotRow[])
        setLoading(false)
      })
  }, [])

  // Resolve ranges from latest available data point
  const latest        = latestPeriod(rows)
  const primaryRange  = latest ? resolvePeriodRange(period, latest) : null
  const compRange     = primaryRange ? resolveCompRange(comp, primaryRange) : null

  const { primary, byCompany } = primaryRange
    ? computeData(rows, primaryRange)
    : { primary: null, byCompany: [] }

  const comparison = compRange ? groupAndDerive(filterRows(rows, compRange)) : null
  const compByCompany = compRange
    ? aggregateByCompany(filterRows(rows, compRange))
    : []

  const primaryLabel  = primaryRange  ? rangeLabel(primaryRange)  : '—'
  const compLabel     = compRange     ? rangeLabel(compRange)      : undefined

  const isHotel = (primary?.revenue_rooms ?? 0) > 0

  function handlePeriodChange(p: PeriodState, c: CompState) {
    setPeriod(p)
    setComp(c)
  }

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="Groep P&L"
        subtitle="Geconsolideerd overzicht — alle entiteiten"
      />

      <div className="p-6 flex flex-col gap-6">
        {/* Period selector */}
        <div className="flex items-center gap-4 flex-wrap">
          {!loading && latest && (
            <PeriodSelector
              period={period}
              comp={comp}
              onChange={handlePeriodChange}
            />
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Totale omzet"
            value={primary?.total_operating_revenue ?? 0}
            isCurrency compact
            vsLastMonth={primary && comparison
              ? primary.total_operating_revenue - comparison.total_operating_revenue
              : undefined}
          />
          <KpiCard
            label="GOP"
            value={primary?.gop ?? 0}
            isCurrency compact
            vsLastMonth={primary && comparison ? primary.gop - comparison.gop : undefined}
          />
          <KpiCard
            label="EBITDA"
            value={primary?.ebitda ?? 0}
            isCurrency compact
            vsLastMonth={primary && comparison ? primary.ebitda - comparison.ebitda : undefined}
          />
          <KpiCard
            label="EBITDA-marge"
            value={primary?.ebitda_margin_pct ?? 0}
            isPercent
          />
        </div>

        {/* Group USALI P&L */}
        {error ? (
          <p className="text-sm text-danger px-1">{error}</p>
        ) : loading ? (
          <Card>
            <CardContent className="py-16 text-center text-text-muted text-sm animate-pulse">
              Laden…
            </CardContent>
          </Card>
        ) : primary ? (
          <Card>
            <CardHeader>
              <CardTitle>Groep P&L — {primaryLabel}</CardTitle>
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
        ) : (
          <Card>
            <CardContent className="py-16 text-center text-text-muted text-sm">
              Geen data gevonden voor {primaryLabel}.
            </CardContent>
          </Card>
        )}

        {/* Per-entity comparison */}
        {byCompany.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Entiteiten — {primaryLabel}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-faint text-xs uppercase tracking-wide">
                      <th className="text-left px-5 py-3">Entiteit</th>
                      <th className="text-right px-4 py-3">Omzet</th>
                      <th className="text-right px-4 py-3">GOP</th>
                      <th className="text-right px-4 py-3">EBITDA</th>
                      <th className="text-right px-4 py-3">EBITDA-%</th>
                      {compRange && <th className="text-right px-4 py-3">vs {compLabel}</th>}
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {byCompany.map(row => {
                      const compRow = compByCompany.find(r => r.company_id === row.company_id)
                      const delta = compRow && compRow.total_operating_revenue > 0
                        ? ((row.total_operating_revenue - compRow.total_operating_revenue) / compRow.total_operating_revenue) * 100
                        : null
                      return (
                        <tr key={row.company_id} className="hover:bg-surface-raised transition-colors">
                          <td className="px-5 py-3 font-medium text-text">
                            {row.company?.display_name ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-text">
                            {formatCurrency(row.total_operating_revenue, true)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            <span className={row.gop >= 0 ? 'text-text-muted' : 'text-danger'}>
                              {formatCurrency(row.gop, true)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            <span className={row.ebitda >= 0 ? 'text-success' : 'text-danger'}>
                              {formatCurrency(row.ebitda, true)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Badge variant={
                              row.ebitda_margin_pct >= 10 ? 'success' :
                              row.ebitda_margin_pct >= 0  ? 'warning' : 'danger'
                            }>
                              {formatMargin(row.ebitda_margin_pct)}
                            </Badge>
                          </td>
                          {compRange && (
                            <td className="px-4 py-3 text-right text-xs tabular-nums">
                              {delta !== null
                                ? <span className={delta >= 0 ? 'text-success' : 'text-danger'}>
                                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                                  </span>
                                : '—'}
                            </td>
                          )}
                          <td className="px-5 py-3 text-right">
                            <Link
                              href={`/companies/${row.company_id}`}
                              className="text-text-faint hover:text-gold transition-colors inline-flex items-center gap-1 text-xs"
                            >
                              Details <ArrowRight size={12} />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
