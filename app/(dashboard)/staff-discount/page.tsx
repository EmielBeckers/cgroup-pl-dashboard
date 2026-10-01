import { redirect } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getStaffDiscountData } from '@/lib/hr-db'
import { employerName, type StaffDiscountData } from '@/lib/staff-discount'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AdoptionTrend } from './adoption-trend'
import { RecentTransactions } from './recent-transactions'
import { TopColleagues } from './top-colleagues'
import { TxTable } from './tx-table'

export const dynamic = 'force-dynamic'

// Personeelskorting — staff discount (25% on food, Leat pass scanned in
// Trivec). BOARD ONLY: this is per-person data about colleagues, so managers
// and accounting never see it. Data: SDWorx hr_sync.v_discount_* views via the
// read-only role in lib/hr-db.ts. Every figure is read from a view; nothing is
// estimated. "Betaald" = what the colleague paid after discount; no gross or
// discount euros are derived (drinks are full price on the same ticket).
export default async function StaffDiscountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'board') redirect('/group')

  let data: StaffDiscountData | null = null
  let loadError: string | null = null
  try {
    data = await getStaffDiscountData(profile)
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e)
  }

  return (
    <main className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text">Personeelskorting</h1>
        <p className="text-xs text-text-muted mt-0.5">
          25% op food via de Leat-pas in Trivec · bron: Leat-transacties, uurlijks gesynchroniseerd
          {data?.latestTransaction && <> · laatste transactie {data.latestTransaction}</>}
        </p>
      </div>

      {loadError || !data ? (
        <Card className="border-danger/40">
          <CardContent className="pt-5 text-sm text-danger flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>Personeelskorting-gegevens konden niet geladen worden ({loadError}). Er worden geen cijfers getoond.</span>
          </CardContent>
        </Card>
      ) : (
        <>
          <AdoptionSection data={data} />
          <Card>
            <CardHeader><CardTitle>2 · Top collega’s · sinds lancering</CardTitle></CardHeader>
            <CardContent>
              <TopColleagues rows={data.colleagues} />
            </CardContent>
          </Card>
          <ViolationsSection data={data} />
          <PerVenueSection data={data} />
          <Card>
            <CardHeader><CardTitle>5 · Recente transacties · laatste 30 dagen</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <RecentTransactions rows={data.recent} />
              <p className="text-[11px] text-text-faint">
                Betaald = wat de collega betaalde, na korting. Het kortingsbedrag wordt niet door Trivec doorgegeven.
                {data.recentNotCounted > 0 && <> {data.recentNotCounted} teruggedraaide of pre-launch registratie(s) in deze periode tellen niet mee.</>}
              </p>
            </CardContent>
          </Card>
          <WarningsSection data={data} />
        </>
      )}
    </main>
  )
}

const pct = (v: number | null) => v == null ? '—' : `${v.toLocaleString('nl-BE', { maximumFractionDigits: 1 })}%`
const eur = (v: number | null) => v == null ? '—' : `€ ${v.toLocaleString('nl-BE', { maximumFractionDigits: 0 })}`
// Share of a count, one decimal (counts only; never applied to amounts).
const share = (n: number, d: number) => d > 0 ? Math.round((1000 * n) / d) / 10 : null

/* ---------------------------------------------------------------- 1. adoption */

function AdoptionSection({ data }: { data: StaffDiscountData }) {
  const k = data.kpis
  const weeks = Array.from(new Set(data.adoption.map(r => r.week_start))).sort()
  const latest = weeks[weeks.length - 1]
  const all = data.adoption.filter(r => r.employer_code === 'ALL')
  const now = all.find(r => r.week_start === latest)
  const perEntity = data.adoption
    .filter(r => r.week_start === latest && r.employer_code !== 'ALL')
    .sort((a, b) => employerName(a.employer_code).localeCompare(employerName(b.employer_code)))

  return (
    <Card>
      <CardHeader><CardTitle>1 · Gebruik</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Kortingen toegepast" value={String(k.uses_total)}
                sub={`laatste 30 d: ${k.uses_30d}`} />
          <Stat label="Collega’s die ze gebruikten" value={String(k.colleagues_total)}
                sub={`laatste 30 d: ${k.colleagues_30d}`} />
          <Stat label="Adoptie" value={pct(share(k.adopted_total, k.eligible_count))}
                sub={`laatste 30 d: ${pct(share(k.adopted_30d, k.eligible_count))} · ${k.adopted_total} van ${k.eligible_count}`} />
          <Stat label="Betaald door collega’s, totaal" value={eur(k.paid_total)}
                sub={`laatste 30 d: ${eur(k.paid_30d)}`} />
        </div>
        <p className="text-[11px] text-text-faint -mt-2">Sinds lancering (11 sept); tweede lijn = laatste 30 dagen.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <p className="text-xs font-medium text-text-muted mb-2">Wekelijkse evolutie sinds lancering (11 sept)</p>
            <AdoptionTrend rows={all} />
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted mb-2">Per vennootschap · {now?.iso_week}</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-text-faint border-b border-border">
                  <th className="py-1.5 pr-3 font-medium">Vennootschap</th>
                  <th className="py-1.5 px-2 font-medium text-right">Geschikt</th>
                  <th className="py-1.5 px-2 font-medium text-right">Ooit gebruikt</th>
                  <th className="py-1.5 pl-2 font-medium text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {perEntity.map(r => (
                  <tr key={r.employer_code} className="border-b border-border-subtle last:border-0">
                    <td className="py-1.5 pr-3 text-text">
                      {employerName(r.employer_code)} <span className="text-text-faint">{r.employer_code}</span>
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-text-muted">{r.eligible_count}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-text">{r.used_cumulative_count}</td>
                    <td className="py-1.5 pl-2 text-right tabular-nums text-text">{pct(r.used_cumulative_pct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-[11px] text-text-faint">
          Noemer = de huidige actieve, geschikte medewerkers volgens de SD Worx-sync; vorige weken worden met die huidige
          noemer herberekend. Een collega die in twee vennootschappen actief is, telt in beide mee maar één keer in het totaal.
        </p>
      </CardContent>
    </Card>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-surface-raised border border-border rounded-lg px-4 py-3">
      <p className="text-[11px] font-medium text-text-muted uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-semibold text-text mt-0.5">{value}</p>
      <p className="text-[11px] text-text-faint">{sub}</p>
    </div>
  )
}

/* -------------------------------------------------------------- 2. violations */

function ViolationsSection({ data }: { data: StaffDiscountData }) {
  const n = data.violations.length
  return (
    <Card className={cn(n > 0 && 'border-danger/50')}>
      <CardHeader><CardTitle>3 · Regelovertredingen · eigen vennootschap</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {n > 0 ? (
          <div className="rounded-md bg-danger/10 text-danger px-4 py-3 text-sm font-medium flex items-center gap-2">
            <AlertTriangle size={16} />
            {n} keer korting gegeven bij de eigen vennootschap van de collega — Trivec/Leat-configuratie nakijken.
          </div>
        ) : (
          <div className="rounded-md bg-success/10 text-success px-4 py-3 text-sm font-medium flex items-center gap-2">
            <CheckCircle2 size={16} />
            0 — Trivec config holding
          </div>
        )}
        {n > 0 && <TxTable rows={data.violations} empty="" />}
        {data.unresolvedUses > 0 && (
          <p className="text-xs text-warning flex items-start gap-1.5">
            <Info size={13} className="shrink-0 mt-0.5" />
            {data.unresolvedUses} gebruik(en) konden niet gecontroleerd worden: voor die datum is geen lopend geschikt
            contract van de collega gekend. Ze tellen niet mee als overtreding én niet als in orde.
          </p>
        )}
        <p className="text-[11px] text-text-faint">
          Eigen vennootschap = de werkgever van het vaste contract waarmee de collega in aanmerking komt, op de dag van gebruik.
          Flexi- of studentencontracten elders tellen niet.
        </p>
      </CardContent>
    </Card>
  )
}

/* ---------------------------------------------------------------- 3. per venue */

function PerVenueSection({ data }: { data: StaffDiscountData }) {
  const homesByShop: Record<string, { code: string; colleagues: number }[]> = {}
  for (const h of data.venueHomeEntities) {
    ;(homesByShop[h.shop_uuid] ??= []).push({ code: h.home_employer_code, colleagues: h.colleagues })
  }
  return (
    <Card>
      <CardHeader><CardTitle>4 · Per zaak</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-text-faint border-b border-border">
                <th className="py-2 pr-3 font-medium">Zaak</th>
                <th className="py-2 pr-3 font-medium">Vennootschap</th>
                <th className="py-2 px-2 font-medium text-right">Bezoeken</th>
                <th className="py-2 px-2 font-medium text-right">Unieke collega’s</th>
                <th className="py-2 px-2 font-medium text-right">Laatste 30 d</th>
                <th className="py-2 pl-3 font-medium">Collega’s komen van</th>
              </tr>
            </thead>
            <tbody>
              {data.perVenue.map(v => (
                <tr key={v.shop_uuid} className={cn('border-b border-border-subtle last:border-0', v.uses_total === 0 && 'text-text-faint')}>
                  <td className="py-1.5 pr-3">
                    <span className={v.uses_total === 0 ? '' : 'text-text'}>{v.venue_group}</span>
                    {v.unmapped && <Badge variant="warning" className="ml-2">niet gekoppeld</Badge>}
                  </td>
                  <td className="py-1.5 pr-3 text-text-muted">{employerName(v.venue_employer_code)}</td>
                  <td className="py-1.5 px-2 text-right tabular-nums">{v.uses_total}</td>
                  <td className="py-1.5 px-2 text-right tabular-nums">{v.colleagues_total}</td>
                  <td className="py-1.5 px-2 text-right tabular-nums">{v.uses_30d}</td>
                  <td className="py-1.5 pl-3">
                    <div className="flex gap-1 whitespace-nowrap">
                      {(homesByShop[v.shop_uuid] ?? []).map(h => (
                        <span key={h.code} title={`${employerName(h.code)}: ${h.colleagues} collega(’s)`}>
                          <Badge className="text-[10px] px-1.5 py-0 tabular-nums cursor-default">
                            {h.code === 'unresolved' ? '?' : h.code} · {h.colleagues}
                          </Badge>
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-text-faint mt-2">
          Bezoeken = kortingsgebruiken sinds lancering. Gecombineerde Leat-winkels (bv. HasHotel + Bragoût) worden samen gerapporteerd;
          Trivec geeft niet door aan welke van de twee zaken het ticket hoort. Badges = werkgeverscode · aantal collega’s (hover voor de naam).
        </p>
      </CardContent>
    </Card>
  )
}

/* ---------------------------------------------------------------- 5. warnings */

function WarningsSection({ data }: { data: StaffDiscountData }) {
  return (
    <Card className={cn(data.unmappedShops.length > 0 && 'border-warning/50')}>
      <CardHeader><CardTitle>Koppeling Leat-winkels</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-xs">
        {data.unmappedShops.length > 0 ? (
          <div className="rounded-md bg-warning/10 text-warning px-4 py-3 space-y-1">
            <p className="font-medium flex items-center gap-1.5">
              <AlertTriangle size={14} /> {data.unmappedShops.length} Leat-winkel(s) zonder koppeling aan een zaak/vennootschap
            </p>
            {data.unmappedShops.map(s => (
              <p key={s.shop_uuid}>{s.shop_name} · {s.transactions} transacties, {s.uses} gebruik(en) — telt niet mee in de regelcontrole tot gekoppeld.</p>
            ))}
          </div>
        ) : (
          <p className="text-text-muted flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-success" /> Alle Leat-winkels zijn gekoppeld aan een zaak en vennootschap.
          </p>
        )}
        {data.coverageGaps.length > 0 && (
          <div className="text-text-muted">
            <p className="font-medium text-text">Zaken zonder kortingsregistratie:</p>
            {data.coverageGaps.map(c => (
              <p key={c.venue_name}>
                {c.venue_name} ({employerName(c.employer_code)}) — {
                  c.status === 'not connected' ? 'niet aangesloten (korting niet van toepassing)'
                  : c.status === 'shop excluded' ? 'Leat-winkel uitgesloten'
                  : 'geen Leat-winkel'
                }
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
