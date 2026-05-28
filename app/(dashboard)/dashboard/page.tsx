import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/top-bar'
import { KpiCard } from '@/components/ui/kpi-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { derivePl, formatCurrency, formatMargin, monthLabel, sumSnapshots } from '@/lib/utils'
import Link from 'next/link'
import { PlSnapshot, PlFull, Company } from '@/lib/types'
import { ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

type SnapshotRow = PlSnapshot & { company: Company }

// Aggregate venue-level rows into one per company, then derive P&L
function aggregateByCompany(rows: SnapshotRow[]): Array<PlFull & { company: Company }> {
  const byCompany = new Map<string, SnapshotRow[]>()
  for (const r of rows) {
    const group = byCompany.get(r.company_id) ?? []
    group.push(r)
    byCompany.set(r.company_id, group)
  }
  return Array.from(byCompany.values()).map(group => {
    const agg = group.length === 1 ? group[0] : sumSnapshots(group)
    const full = derivePl(agg) as PlFull & { company: Company }
    // Preserve the company join from the first row
    full.company = group[0].company
    return full
  })
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear  = month === 1 ? year - 1 : year

  // ── Diagnostics (visible in Vercel Function logs) ─────────────────────────
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  console.log('[dashboard] auth.uid:', user?.id ?? 'null', '| authErr:', authErr?.message ?? 'none')
  console.log('[dashboard] querying period_year in', [year, prevYear], 'period_month in', [month, prevMonth])

  // Fetch venue-level rows for current + previous month (all companies)
  const { data: snapshots, error: snapErr, count } = await supabase
    .from('pl_snapshots')
    .select('*, company:companies(id, name, display_name)', { count: 'exact' })
    .not('venue_id', 'is', null)
    .in('period_year', [year, prevYear])
    .in('period_month', [month, prevMonth])
    .limit(500)

  console.log('[dashboard] pl_snapshots rows returned:', count ?? snapshots?.length ?? 0, '| snapErr:', snapErr?.message ?? 'none')

  const rows = (snapshots ?? []) as SnapshotRow[]

  const currentRows = rows.filter(r => r.period_year === year  && r.period_month === month)
  const prevRows    = rows.filter(r => r.period_year === prevYear && r.period_month === prevMonth)

  const currentDerived = aggregateByCompany(currentRows)
  const prevDerived    = aggregateByCompany(prevRows)

  const totalRev     = currentDerived.reduce((s, d) => s + d.total_operating_revenue, 0)
  const prevRev      = prevDerived.reduce((s, d) => s + d.total_operating_revenue, 0)
  const totalGop     = currentDerived.reduce((s, d) => s + d.gop, 0)
  const totalEbitda  = currentDerived.reduce((s, d) => s + d.ebitda, 0)
  const ebitdaMargin = totalRev > 0 ? (totalEbitda / totalRev) * 100 : 0

  const companyPl = currentDerived
    .map(d => {
      const p = prevDerived.find(r => r.company_id === d.company_id)
      return { ...d, prevRevenue: p?.total_operating_revenue ?? 0 }
    })
    .sort((a, b) => b.total_operating_revenue - a.total_operating_revenue)

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title="Dashboard"
        subtitle="Overzicht van alle entiteiten"
        period={{ year, month }}
      />

      <div className="p-6 flex flex-col gap-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Totale omzet"
            value={totalRev}
            isCurrency compact
            vsLastMonth={totalRev - prevRev}
          />
          <KpiCard label="GOP"    value={totalGop}    isCurrency compact />
          <KpiCard label="EBITDA" value={totalEbitda} isCurrency compact />
          <KpiCard label="EBITDA-marge" value={ebitdaMargin} isPercent />
        </div>

        {/* Company table */}
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
                    <th className="text-right px-4 py-3">Nettomarge</th>
                    <th className="text-right px-4 py-3">vs VM</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {companyPl.map(row => {
                    const revDelta = row.prevRevenue > 0
                      ? ((row.total_operating_revenue - row.prevRevenue) / row.prevRevenue) * 100
                      : null
                    return (
                      <tr key={row.company_id} className="hover:bg-surface-raised transition-colors">
                        <td className="px-5 py-3.5 font-medium text-text">
                          {row.company?.display_name ?? '—'}
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-text">
                          {formatCurrency(row.total_operating_revenue, true)}
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums">
                          <span className={row.gop >= 0 ? 'text-text-muted' : 'text-danger'}>
                            {formatCurrency(row.gop, true)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums">
                          <span className={row.ebitda >= 0 ? 'text-success' : 'text-danger'}>
                            {formatCurrency(row.ebitda, true)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Badge variant={row.ebitda_margin_pct >= 10 ? 'success' : row.ebitda_margin_pct >= 0 ? 'warning' : 'danger'}>
                            {formatMargin(row.ebitda_margin_pct)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs text-text-muted tabular-nums">
                          {formatMargin(row.net_margin_pct)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs tabular-nums">
                          {revDelta !== null ? (
                            <span className={revDelta >= 0 ? 'text-success' : 'text-danger'}>
                              {revDelta >= 0 ? '+' : ''}{revDelta.toFixed(1)}%
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
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
                  {companyPl.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-text-muted text-sm">
                        Geen data gevonden voor {monthLabel(year, month)}.
                        <br />
                        <span className="text-xs text-text-faint">Voer het seed script uit om testdata te laden.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
