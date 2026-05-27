import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/top-bar'
import { KpiCard } from '@/components/ui/kpi-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { derivePl, formatCurrency, formatMargin, monthLabel } from '@/lib/utils'
import Link from 'next/link'
import { PlSnapshot, Company } from '@/lib/types'
import { ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  // Current month + previous month snapshots (company-level, venue_id IS NULL)
  const { data: snapshots } = await supabase
    .from('pl_snapshots')
    .select('*, company:companies(id, name, display_name)')
    .is('venue_id', null)
    .in('period_year', [year, year - (month === 1 ? 1 : 0)])
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })

  const rows = (snapshots ?? []) as (PlSnapshot & { company: Company })[]

  const current = rows.filter(r => r.period_year === year && r.period_month === month)
  const prev    = rows.filter(r => {
    const pm = month === 1 ? 12 : month - 1
    const py = month === 1 ? year - 1 : year
    return r.period_year === py && r.period_month === pm
  })

  const sumField = (arr: PlSnapshot[], field: keyof PlSnapshot) =>
    arr.reduce((s, r) => s + Number(r[field] ?? 0), 0)

  const totalRevCurrent  = sumField(current, 'revenue_food') + sumField(current, 'revenue_beverage') + sumField(current, 'revenue_other')
  const totalRevPrev     = sumField(prev, 'revenue_food') + sumField(prev, 'revenue_beverage') + sumField(prev, 'revenue_other')
  const totalCogsCurrent = sumField(current, 'cogs_food') + sumField(current, 'cogs_beverage')
  const totalLabourCurrent = sumField(current, 'labour_management') + sumField(current, 'labour_service') + sumField(current, 'labour_kitchen')
  const totalOverheadCurrent = sumField(current, 'overhead_rent') + sumField(current, 'overhead_utilities') + sumField(current, 'overhead_marketing') + sumField(current, 'overhead_other')
  const ebitda = totalRevCurrent - totalCogsCurrent - totalLabourCurrent - totalOverheadCurrent
  const ebitdaMargin = totalRevCurrent > 0 ? (ebitda / totalRevCurrent) * 100 : 0

  // Per-company current month P&L
  const companyPl = current.map(s => {
    const d = derivePl(s)
    const prev_ = prev.find(p => p.company_id === s.company_id)
    return { ...d, prevRevenue: prev_ ? (prev_.revenue_food + prev_.revenue_beverage + prev_.revenue_other) : 0 }
  }).sort((a, b) => b.total_revenue - a.total_revenue)

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
            value={totalRevCurrent}
            isCurrency
            compact
            vsLastMonth={totalRevCurrent - totalRevPrev}
          />
          <KpiCard
            label="Brutowinst"
            value={totalRevCurrent - totalCogsCurrent}
            isCurrency
            compact
          />
          <KpiCard
            label="EBITDA"
            value={ebitda}
            isCurrency
            compact
          />
          <KpiCard
            label="EBITDA-marge"
            value={ebitdaMargin}
            isPercent
          />
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
                    <th className="text-right px-4 py-3">Brutomarge</th>
                    <th className="text-right px-4 py-3">EBITDA</th>
                    <th className="text-right px-4 py-3">EBITDA-%</th>
                    <th className="text-right px-5 py-3">vs vorige</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {companyPl.map((row) => {
                    const revDelta = row.prevRevenue > 0
                      ? ((row.total_revenue - row.prevRevenue) / row.prevRevenue) * 100
                      : null
                    return (
                      <tr key={row.id} className="hover:bg-surface-raised transition-colors">
                        <td className="px-5 py-3.5 font-medium text-text">
                          {(row as { company?: Company }).company?.display_name ?? '—'}
                        </td>
                        <td className="px-4 py-3.5 text-right text-text">{formatCurrency(row.total_revenue, true)}</td>
                        <td className="px-4 py-3.5 text-right text-text-muted">{formatMargin(row.gross_margin_pct)}</td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={row.ebitda >= 0 ? 'text-success' : 'text-danger'}>
                            {formatCurrency(row.ebitda, true)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Badge variant={row.ebitda_margin_pct >= 10 ? 'success' : row.ebitda_margin_pct >= 0 ? 'warning' : 'danger'}>
                            {formatMargin(row.ebitda_margin_pct)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs">
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
                      <td colSpan={7} className="px-5 py-8 text-center text-text-muted text-sm">
                        Geen data gevonden voor {monthLabel(year, month)}.<br />
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
