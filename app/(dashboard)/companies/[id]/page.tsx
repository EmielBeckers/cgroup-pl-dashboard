import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { KpiCard } from '@/components/ui/kpi-card'
import { Badge } from '@/components/ui/badge'
import { RevenueTrend } from '@/components/charts/revenue-trend'
import { PlWaterfall } from '@/components/charts/pl-waterfall'
import { derivePl, formatCurrency, formatMargin, monthLabel, MONTH_NAMES } from '@/lib/utils'
import { PlSnapshot, Venue } from '@/lib/types'
import Link from 'next/link'
import { MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: company } = await supabase.from('companies').select('*').eq('id', id).single()
  if (!company) notFound()

  const { data: venues } = await supabase
    .from('venues')
    .select('*')
    .eq('company_id', id)
    .eq('is_active', true)
    .order('name')

  // Last 17 months of company-level P&L
  const { data: snapshots } = await supabase
    .from('pl_snapshots')
    .select('*')
    .eq('company_id', id)
    .is('venue_id', null)
    .order('period_year', { ascending: true })
    .order('period_month', { ascending: true })
    .limit(20)

  const rows = (snapshots ?? []) as PlSnapshot[]
  const derived = rows.map(derivePl)
  const latest  = derived[derived.length - 1]
  const prevOne = derived[derived.length - 2]

  // YoY: find same month last year
  const yoy = latest
    ? derived.find(d => d.period_year === latest.period_year - 1 && d.period_month === latest.period_month)
    : null

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title={company.display_name}
        subtitle={company.vat_number ?? undefined}
        period={latest ? { year: latest.period_year, month: latest.period_month } : undefined}
      />

      <div className="p-6 flex flex-col gap-6">
        {latest ? (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Omzet" value={latest.total_revenue} isCurrency compact
                vsLastMonth={prevOne ? latest.total_revenue - prevOne.total_revenue : undefined} />
              <KpiCard label="Brutowinst" value={latest.gross_profit} isCurrency compact />
              <KpiCard label="EBITDA" value={latest.ebitda} isCurrency compact
                vsLastMonth={prevOne ? latest.ebitda - prevOne.ebitda : undefined} />
              <KpiCard label="EBITDA-marge" value={latest.ebitda_margin_pct} isPercent />
            </div>

            {/* Trend chart */}
            <Card>
              <CardHeader>
                <CardTitle>Omzet & EBITDA — trend</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueTrend snapshots={derived} />
              </CardContent>
            </Card>

            {/* Monthly detail table + waterfall */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <Card className="lg:col-span-3">
                <CardHeader><CardTitle>Maandelijks overzicht</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wide">
                          <th className="text-left px-5 py-3">Maand</th>
                          <th className="text-right px-4 py-3">Omzet</th>
                          <th className="text-right px-4 py-3">COS</th>
                          <th className="text-right px-4 py-3">Personeel</th>
                          <th className="text-right px-5 py-3">EBITDA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {[...derived].reverse().map((row) => (
                          <tr key={row.id} className="hover:bg-surface-raised">
                            <td className="px-5 py-3 text-text-muted">{MONTH_NAMES[row.period_month - 1]} {row.period_year}</td>
                            <td className="px-4 py-3 text-right text-text">{formatCurrency(row.total_revenue, true)}</td>
                            <td className="px-4 py-3 text-right text-text-muted">{formatCurrency(row.total_cogs, true)}</td>
                            <td className="px-4 py-3 text-right text-text-muted">{formatCurrency(row.total_labour, true)}</td>
                            <td className="px-5 py-3 text-right">
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

              {/* Latest month waterfall */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{MONTH_NAMES[latest.period_month - 1]} {latest.period_year} — P&L</CardTitle>
                </CardHeader>
                <CardContent>
                  <PlWaterfall snapshot={latest} />
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: 'Voeding', value: formatCurrency(latest.revenue_food, true), sub: true },
                      { label: 'Dranken', value: formatCurrency(latest.revenue_beverage, true), sub: true },
                      { label: 'Voedingskosten', value: `${formatMargin(latest.revenue_food > 0 ? (latest.cogs_food / latest.revenue_food) * 100 : 0)}`, sub: true },
                      { label: 'Drankkosten', value: `${formatMargin(latest.revenue_beverage > 0 ? (latest.cogs_beverage / latest.revenue_beverage) * 100 : 0)}`, sub: true },
                      { label: 'Loonkosten', value: `${formatMargin(latest.labour_pct)}`, sub: true },
                      { label: 'Huur', value: formatCurrency(latest.overhead_rent, true), sub: true },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-text-muted">{label}</span>
                        <span className="text-text">{value}</span>
                      </div>
                    ))}
                  </div>
                  {yoy && (
                    <div className="mt-4 pt-4 border-t border-border text-xs">
                      <p className="text-text-muted mb-2">Jaar-op-jaar ({monthLabel(yoy.period_year, yoy.period_month)})</p>
                      <div className="flex justify-between">
                        <span className="text-text-muted">Omzet</span>
                        <span className={latest.total_revenue >= yoy.total_revenue ? 'text-success' : 'text-danger'}>
                          {latest.total_revenue >= yoy.total_revenue ? '+' : ''}
                          {(((latest.total_revenue - yoy.total_revenue) / yoy.total_revenue) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-text-muted">EBITDA</span>
                        <span className={latest.ebitda >= yoy.ebitda ? 'text-success' : 'text-danger'}>
                          {latest.ebitda >= yoy.ebitda ? '+' : ''}
                          {yoy.ebitda !== 0 ? (((latest.ebitda - yoy.ebitda) / Math.abs(yoy.ebitda)) * 100).toFixed(1) : '—'}%
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
            Geen P&L data beschikbaar voor {company.display_name}.
          </div>
        )}

        {/* Venues list */}
        {(venues ?? []).length > 0 && (
          <Card>
            <CardHeader><CardTitle>Venues</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {(venues as Venue[]).map(v => (
                  <Link key={v.id} href={`/venues/${v.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-raised transition-colors group">
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
