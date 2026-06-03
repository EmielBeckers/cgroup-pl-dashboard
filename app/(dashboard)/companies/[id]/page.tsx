'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TopBar } from '@/components/layout/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { KpiCard } from '@/components/ui/kpi-card'
import { Badge } from '@/components/ui/badge'
import { PlStatement } from '@/components/pl/pl-statement'
import { PeriodSelector } from '@/components/ui/period-selector'
import {
  PeriodState, CompState, DateRange,
  latestPeriod, resolvePeriodRange, resolveCompRange, filterRows, rangeLabel,
} from '@/lib/period'
import { derivePl, formatCurrency, sumSnapshots, MONTH_NAMES } from '@/lib/utils'
import { PlSnapshot, PlFull, Venue, Company } from '@/lib/types'
import Link from 'next/link'
import { MapPin } from 'lucide-react'

type SnapshotRow = PlSnapshot

function deriveRange(rows: SnapshotRow[], range: DateRange): PlFull | null {
  const inRange = filterRows(rows, range)
  if (!inRange.length) return null
  return derivePl(inRange.length === 1 ? inRange[0] : sumSnapshots(inRange))
}

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [company,  setCompany]  = useState<Company | null>(null)
  const [venues,   setVenues]   = useState<Venue[]>([])
  const [rows,     setRows]     = useState<SnapshotRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const [period, setPeriod] = useState<PeriodState>({ type: 'ytd' })
  const [comp,   setComp]   = useState<CompState>({ type: 'vs_last_year' })

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('companies').select('*').eq('id', id).single(),
      supabase.from('venues').select('*').eq('company_id', id).eq('is_active', true).order('name'),
      supabase.from('pl_snapshots').select('*').eq('company_id', id).not('venue_id', 'is', null),
    ]).then(([{ data: comp, error: e1 }, { data: v }, { data: snaps, error: e3 }]) => {
      if (e1 || e3) { setError((e1 ?? e3)!.message); setLoading(false); return }
      setCompany(comp as Company)
      setVenues((v ?? []) as Venue[])
      setRows((snaps ?? []) as SnapshotRow[])
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

  // Monthly history (most recent 24 months, for the history table)
  const timeline: PlFull[] = (() => {
    const byPeriod = new Map<string, SnapshotRow[]>()
    for (const r of rows) {
      const key = `${r.period_year}-${r.period_month}`
      const g = byPeriod.get(key) ?? []
      g.push(r)
      byPeriod.set(key, g)
    }
    return Array.from(byPeriod.values())
      .map(g => derivePl(g.length === 1 ? g[0] : sumSnapshots(g)))
      .sort((a, b) => a.period_year !== b.period_year
        ? a.period_year - b.period_year
        : a.period_month - b.period_month)
  })()

  const isHotel = venues.some(v => v.type === 'hotel')

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

  if (!company) {
    return (
      <div className="flex flex-col flex-1">
        <TopBar title="Niet gevonden" subtitle="" />
        <div className="p-6 text-text-muted text-sm">{error ?? 'Entiteit niet gevonden.'}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title={company.display_name}
        subtitle={company.vat_number ?? undefined}
      />

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

            {/* YTD summary strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {[
                { label: 'Netto-inkomen', value: formatCurrency(primary.net_income, true) },
                { label: 'Nettomarge',    value: `${primary.net_margin_pct.toFixed(1)}%` },
                { label: 'Brutowinst',    value: formatCurrency(primary.gross_profit, true) },
                { label: 'GOP-marge',     value: `${primary.gop_margin_pct.toFixed(1)}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface rounded-lg px-4 py-3 flex justify-between items-center border border-border">
                  <span className="text-text-muted text-xs">{label}</span>
                  <span className="text-text font-medium">{value}</span>
                </div>
              ))}
            </div>

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
          <div className="flex-1 flex items-center justify-center text-text-muted text-sm py-20">
            Geen P&L data beschikbaar voor {company.display_name}.
          </div>
        )}

        {/* Venues list */}
        {venues.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Venues</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {venues.map(v => (
                  <Link
                    key={v.id}
                    href={`/venues/${v.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-raised transition-colors group"
                  >
                    <MapPin size={14} className="text-text-faint group-hover:text-gold" />
                    <span className="flex-1 text-sm text-text">{v.name}</span>
                    <Badge variant="default">{v.type}</Badge>
                    <Badge variant={v.pos_system === 'lightspeed' ? 'gold' : 'default'}>
                      {v.pos_system}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
