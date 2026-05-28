import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { KpiCard } from '@/components/ui/kpi-card'
import { RevenueTrend } from '@/components/charts/revenue-trend'
import { PlStatement } from '@/components/pl/pl-statement'
import { derivePl, formatCurrency, MONTH_NAMES, monthLabel, sumSnapshots } from '@/lib/utils'
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

  const rows = (snapshots ?? []) as PlSnapshot[]
  const derived = rows.map(derivePl)
  const latest  = derived[derived.length - 1]
  const prevOne = derived[derived.length - 2]

  const prevYear = latest
    ? derived.find(d => d.period_year === latest.period_year - 1 && d.period_month === latest.period_month)
    : null

  const ytdRows = latest
    ? derived.filter(d => d.period_year === latest.period_year && d.period_month <= latest.period_month)
    : []
  const ytd = ytdRows.length > 0 ? derivePl(sumSnapshots(ytdRows)) : null

  const isHotel = venue.type === 'hotel'

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
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Omzet"
                value={latest.total_operating_revenue}
                isCurrency compact
                vsLastMonth={prevOne ? latest.total_operating_revenue - prevOne.total_operating_revenue : undefined}
              />
              <KpiCard
                label="GOP"
                value={latest.gop}
                isCurrency compact
                vsLastMonth={prevOne ? latest.gop - prevOne.gop : undefined}
              />
              <KpiCard
                label="EBITDA"
                value={latest.ebitda}
                isCurrency compact
                vsLastMonth={prevOne ? latest.ebitda - prevOne.ebitda : undefined}
              />
              <KpiCard label="EBITDA-marge" value={latest.ebitda_margin_pct} isPercent />
            </div>

            {/* Trend */}
            <Card>
              <CardHeader><CardTitle>Omzet & EBITDA — trend</CardTitle></CardHeader>
              <CardContent>
                <RevenueTrend snapshots={derived} />
              </CardContent>
            </Card>

            {/* Full USALI P&L */}
            <Card>
              <CardHeader>
                <CardTitle>
                  P&L — {monthLabel(latest.period_year, latest.period_month)}
                  {prevYear && (
                    <span className="ml-2 text-xs font-normal text-text-muted">
                      vs {monthLabel(prevYear.period_year, prevYear.period_month)} · YTD {latest.period_year}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 pb-4">
                <PlStatement
                  current={latest}
                  prevMonth={prevOne ?? null}
                  prevYear={prevYear ?? null}
                  ytd={ytd}
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
                      <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wide">
                        <th className="text-left px-5 py-3">Maand</th>
                        <th className="text-right px-4 py-3">Omzet</th>
                        <th className="text-right px-4 py-3">Brutowinst</th>
                        <th className="text-right px-4 py-3">GOP</th>
                        <th className="text-right px-5 py-3">EBITDA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[...derived].reverse().map(row => (
                        <tr key={row.id} className="hover:bg-surface-raised">
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
