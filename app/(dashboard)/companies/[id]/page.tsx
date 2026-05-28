import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { KpiCard } from '@/components/ui/kpi-card'
import { Badge } from '@/components/ui/badge'
import { RevenueTrend } from '@/components/charts/revenue-trend'
import { PlStatement } from '@/components/pl/pl-statement'
import { derivePl, formatCurrency, sumSnapshots, monthLabel } from '@/lib/utils'
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

  // All company-level snapshots (no venue_id)
  const { data: snapshots } = await supabase
    .from('pl_snapshots')
    .select('*')
    .eq('company_id', id)
    .is('venue_id', null)
    .order('period_year', { ascending: true })
    .order('period_month', { ascending: true })

  const rows = (snapshots ?? []) as PlSnapshot[]
  const derived = rows.map(derivePl)
  const latest  = derived[derived.length - 1]
  const prevOne = derived[derived.length - 2]

  const prevYear = latest
    ? derived.find(d => d.period_year === latest.period_year - 1 && d.period_month === latest.period_month)
    : null

  // YTD: all snapshots in the current year up to and including the latest month
  const ytdRows = latest
    ? derived.filter(d => d.period_year === latest.period_year && d.period_month <= latest.period_month)
    : []
  const ytd = ytdRows.length > 0 ? derivePl(sumSnapshots(ytdRows)) : null

  const isHotel = (venues ?? []).some((v: { type: string }) => v.type === 'hotel')

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
              <KpiCard
                label="EBITDA-marge"
                value={latest.ebitda_margin_pct}
                isPercent
              />
            </div>

            {/* Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Omzet & EBITDA — trend</CardTitle>
              </CardHeader>
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

            {/* Revenue trend detail */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {[
                { label: 'Omzet YTD', value: formatCurrency(ytd?.total_operating_revenue ?? 0, true) },
                { label: 'EBITDA YTD', value: formatCurrency(ytd?.ebitda ?? 0, true) },
                { label: 'Netto-inkomen', value: formatCurrency(latest.net_income, true) },
                { label: 'Nettomarge', value: `${latest.net_margin_pct.toFixed(1)}%` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface rounded-lg px-4 py-3 flex justify-between items-center">
                  <span className="text-text-muted text-xs">{label}</span>
                  <span className="text-text font-medium">{value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-muted text-sm py-20">
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
