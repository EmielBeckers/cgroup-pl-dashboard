import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { KpiCard } from '@/components/ui/kpi-card'
import { RevenueTrend } from '@/components/charts/revenue-trend'
import { PlWaterfall } from '@/components/charts/pl-waterfall'
import { derivePl, formatCurrency, MONTH_NAMES, monthLabel } from '@/lib/utils'
import { PlSnapshot } from '@/lib/types'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: venue } = await supabase
    .from('venues')
    .select('*, company:companies(id, display_name, vat_number)')
    .eq('id', id)
    .single()

  if (!venue) notFound()

  const { data: snapshots } = await supabase
    .from('pl_snapshots')
    .select('*')
    .eq('venue_id', id)
    .order('period_year', { ascending: true })
    .order('period_month', { ascending: true })
    .limit(20)

  const rows = (snapshots ?? []) as PlSnapshot[]
  const derived = rows.map(derivePl)
  const latest  = derived[derived.length - 1]
  const prevOne = derived[derived.length - 2]

  return (
    <div className="flex flex-col flex-1">
      <TopBar
        title={venue.name}
        subtitle={venue.company?.display_name ?? undefined}
        period={latest ? { year: latest.period_year, month: latest.period_month } : undefined}
      >
        <Link
          href={`/companies/${venue.company_id}`}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-gold transition-colors"
        >
          <ArrowLeft size={13} /> Terug naar entiteit
        </Link>
      </TopBar>

      <div className="p-6 flex flex-col gap-6">
        {latest ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Omzet" value={latest.total_revenue} isCurrency compact
                vsLastMonth={prevOne ? latest.total_revenue - prevOne.total_revenue : undefined} />
              <KpiCard label="Brutowinst" value={latest.gross_profit} isCurrency compact />
              <KpiCard label="EBITDA" value={latest.ebitda} isCurrency compact
                vsLastMonth={prevOne ? latest.ebitda - prevOne.ebitda : undefined} />
              <KpiCard label="EBITDA-marge" value={latest.ebitda_margin_pct} isPercent />
            </div>

            <Card>
              <CardHeader><CardTitle>Omzet & EBITDA — trend</CardTitle></CardHeader>
              <CardContent>
                <RevenueTrend snapshots={derived} />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <Card className="lg:col-span-3">
                <CardHeader><CardTitle>Maandelijks overzicht</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wide">
                        <th className="text-left px-5 py-3">Maand</th>
                        <th className="text-right px-4 py-3">Omzet</th>
                        <th className="text-right px-4 py-3">COS</th>
                        <th className="text-right px-5 py-3">EBITDA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[...derived].reverse().map((row) => (
                        <tr key={row.id} className="hover:bg-surface-raised">
                          <td className="px-5 py-3 text-text-muted">{MONTH_NAMES[row.period_month - 1]} {row.period_year}</td>
                          <td className="px-4 py-3 text-right text-text">{formatCurrency(row.total_revenue, true)}</td>
                          <td className="px-4 py-3 text-right text-text-muted">{formatCurrency(row.total_cogs, true)}</td>
                          <td className="px-5 py-3 text-right">
                            <span className={row.ebitda >= 0 ? 'text-success' : 'text-danger'}>
                              {formatCurrency(row.ebitda, true)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{MONTH_NAMES[latest.period_month - 1]} {latest.period_year} — P&L</CardTitle>
                </CardHeader>
                <CardContent>
                  <PlWaterfall snapshot={latest} />
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <p className="text-text-muted text-sm">Geen P&L data voor {venue.name}.</p>
        )}
      </div>
    </div>
  )
}
