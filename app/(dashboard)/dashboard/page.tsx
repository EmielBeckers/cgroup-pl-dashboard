'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TopBar } from '@/components/layout/top-bar'
import { KpiCard } from '@/components/ui/kpi-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlStatement } from '@/components/pl/pl-statement'
import { derivePl, formatCurrency, formatMargin, monthLabel, sumSnapshots } from '@/lib/utils'
import Link from 'next/link'
import { PlSnapshot, PlFull, Company } from '@/lib/types'
import { ArrowRight } from 'lucide-react'

type SnapshotRow = PlSnapshot & { company: Company }
type CompanyRow  = PlFull & { company: Company; prevRevenue: number }

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

export default function DashboardPage() {
  const now = new Date()
  const year      = now.getFullYear()
  const month     = now.getMonth() + 1
  const prevCalMonth = month === 1 ? 12 : month - 1
  const prevCalYear  = month === 1 ? year - 1 : year

  const [current,   setCurrent]   = useState<PlFull | null>(null)
  const [prevMonth, setPrevMonth] = useState<PlFull | null>(null)
  const [prevYear,  setPrevYear]  = useState<PlFull | null>(null)
  const [ytd,       setYtd]       = useState<PlFull | null>(null)
  const [companyPl, setCompanyPl] = useState<CompanyRow[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    createClient()
      .from('pl_snapshots')
      .select('*, company:companies(id, name, display_name)')
      .not('venue_id', 'is', null)
      .in('period_year', [year - 1, year])
      .limit(1000)
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); setLoading(false); return }

        const rows        = (data ?? []) as SnapshotRow[]
        const curRows     = rows.filter(r => r.period_year === year        && r.period_month === month)
        const pmRows      = rows.filter(r => r.period_year === prevCalYear && r.period_month === prevCalMonth)
        const pyRows      = rows.filter(r => r.period_year === year - 1    && r.period_month === month)
        const ytdRows     = rows.filter(r => r.period_year === year        && r.period_month <= month)

        setCurrent(groupAndDerive(curRows))
        setPrevMonth(groupAndDerive(pmRows))
        setPrevYear(groupAndDerive(pyRows))
        setYtd(groupAndDerive(ytdRows))

        const curByComp  = aggregateByCompany(curRows)
        const pmByComp   = aggregateByCompany(pmRows)
        setCompanyPl(
          curByComp
            .map(d => {
              const p = pmByComp.find(r => r.company_id === d.company_id)
              return { ...d, prevRevenue: p?.total_operating_revenue ?? 0 }
            })
            .sort((a, b) => b.total_operating_revenue - a.total_operating_revenue)
        )
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isHotel = (current?.revenue_rooms ?? 0) > 0

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="Groep P&L"
        subtitle="Geconsolideerd overzicht — alle entiteiten"
        period={{ year, month }}
      />

      <div className="p-6 flex flex-col gap-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Totale omzet"
            value={current?.total_operating_revenue ?? 0}
            isCurrency compact
            vsLastMonth={current && prevMonth
              ? current.total_operating_revenue - prevMonth.total_operating_revenue
              : undefined}
          />
          <KpiCard
            label="GOP"
            value={current?.gop ?? 0}
            isCurrency compact
            vsLastMonth={current && prevMonth ? current.gop - prevMonth.gop : undefined}
          />
          <KpiCard
            label="EBITDA"
            value={current?.ebitda ?? 0}
            isCurrency compact
            vsLastMonth={current && prevMonth ? current.ebitda - prevMonth.ebitda : undefined}
          />
          <KpiCard
            label="EBITDA-marge"
            value={current?.ebitda_margin_pct ?? 0}
            isPercent
          />
        </div>

        {/* Group USALI P&L — primary content */}
        {error ? (
          <p className="text-sm text-danger px-1">{error}</p>
        ) : loading ? (
          <Card>
            <CardContent className="py-16 text-center text-text-muted text-sm animate-pulse">
              Laden…
            </CardContent>
          </Card>
        ) : current ? (
          <Card>
            <CardHeader>
              <CardTitle>
                Groep P&L — {monthLabel(year, month)}
                <span className="ml-2 text-xs font-normal text-text-muted">
                  vs {monthLabel(prevCalYear, prevCalMonth)}
                  {' · '}vs {monthLabel(year - 1, month)}
                  {' · '}YTD {year}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-4">
              <PlStatement
                current={current}
                prevMonth={prevMonth}
                prevYear={prevYear}
                ytd={ytd}
                isHotel={isHotel}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-16 text-center text-text-muted text-sm">
              Geen data gevonden voor {monthLabel(year, month)}.
            </CardContent>
          </Card>
        )}

        {/* Per-entity comparison — secondary */}
        {companyPl.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Entiteiten — {monthLabel(year, month)}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wide">
                      <th className="text-left px-5 py-3">Entiteit</th>
                      <th className="text-right px-4 py-3">Omzet</th>
                      <th className="text-right px-4 py-3">GOP</th>
                      <th className="text-right px-4 py-3">EBITDA</th>
                      <th className="text-right px-4 py-3">EBITDA-%</th>
                      <th className="text-right px-4 py-3">vs VM</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {companyPl.map(row => {
                      const delta = row.prevRevenue > 0
                        ? ((row.total_operating_revenue - row.prevRevenue) / row.prevRevenue) * 100
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
                            <Badge variant={row.ebitda_margin_pct >= 10 ? 'success' : row.ebitda_margin_pct >= 0 ? 'warning' : 'danger'}>
                              {formatMargin(row.ebitda_margin_pct)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right text-xs tabular-nums">
                            {delta !== null
                              ? <span className={delta >= 0 ? 'text-success' : 'text-danger'}>
                                  {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                                </span>
                              : '—'}
                          </td>
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
