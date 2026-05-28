'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { TopBar } from '@/components/layout/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { KpiCard } from '@/components/ui/kpi-card'
import { PlStatement } from '@/components/pl/pl-statement'
import { derivePl, formatCurrency, sumSnapshots, monthLabel, MONTH_NAMES } from '@/lib/utils'
import { PlSnapshot, PlFull, Venue } from '@/lib/types'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [venue,    setVenue]    = useState<(Venue & { company?: { id: string; display_name: string } }) | null>(null)
  const [timeline, setTimeline] = useState<PlFull[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

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
      setTimeline(((snaps ?? []) as PlSnapshot[]).map(derivePl))
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const latest   = timeline[timeline.length - 1] ?? null
  const prevOne  = timeline[timeline.length - 2] ?? null
  const prevYear = latest
    ? timeline.find(d => d.period_year === latest.period_year - 1 && d.period_month === latest.period_month) ?? null
    : null
  const ytdRows = latest
    ? timeline.filter(d => d.period_year === latest.period_year && d.period_month <= latest.period_month)
    : []
  const ytd = ytdRows.length > 0 ? derivePl(sumSnapshots(ytdRows)) : null

  const isHotel = venue?.type === 'hotel'

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
        {error && <p className="text-sm text-danger">{error}</p>}

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

            {/* Full USALI P&L — primary content */}
            <Card>
              <CardHeader>
                <CardTitle>
                  P&L — {monthLabel(latest.period_year, latest.period_month)}
                  <span className="ml-2 text-xs font-normal text-text-muted">
                    {prevOne && <>vs {monthLabel(prevOne.period_year, prevOne.period_month)} · </>}
                    {prevYear && <>vs {monthLabel(prevYear.period_year, prevYear.period_month)} · </>}
                    YTD {latest.period_year}
                  </span>
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
                      {[...timeline].reverse().map(row => (
                        <tr key={`${row.period_year}-${row.period_month}`} className="hover:bg-surface-raised">
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
