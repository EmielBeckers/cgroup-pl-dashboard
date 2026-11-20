'use client'

import { useMemo, useState } from 'react'
import type { DiscountTx } from '@/lib/staff-discount'
import { employerName } from '@/lib/staff-discount'
import { TxTable } from './tx-table'

// Uses within a selectable period (default: last 30 days, served with the
// page so the initial load is unchanged), filterable by venue and by the
// colleague's home vennootschap. Other periods fetch from
// /api/staff-discount/transactions (board-only, hr_sync views — the same
// source, just a different window). Client-side pagination keeps "alles"
// renderable; the server caps a window at 5000 rows and says so.

type PeriodKey = '30d' | '90d' | 'year' | 'lastyear' | 'all' | 'custom'
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: '30d', label: 'Laatste 30 dagen' },
  { key: '90d', label: 'Laatste 90 dagen' },
  { key: 'year', label: 'Dit jaar' },
  { key: 'lastyear', label: 'Vorig jaar' },
  { key: 'all', label: 'Alles' },
  { key: 'custom', label: 'Aangepast…' },
]
const PAGE_SIZE = 50

function isoToday(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Brussels' })
}
function isoDaysAgo(days: number): string {
  const d = new Date(Date.now() - days * 86400000)
  return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Brussels' })
}
function windowFor(key: Exclude<PeriodKey, 'custom'>): { from: string; to: string } {
  const to = isoToday()
  const year = Number(to.slice(0, 4))
  switch (key) {
    // the server page's original window is use_date > today-30, i.e. >= today-29
    case '30d': return { from: isoDaysAgo(29), to }
    case '90d': return { from: isoDaysAgo(89), to }
    case 'year': return { from: `${year}-01-01`, to }
    case 'lastyear': return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` }
    case 'all': return { from: '2000-01-01', to }
  }
}

export function RecentTransactions({ rows: initialRows, notCounted: initialNotCounted }: {
  rows: DiscountTx[]; notCounted: number
}) {
  const [venue, setVenue] = useState('')
  const [home, setHome] = useState('')
  const [period, setPeriod] = useState<PeriodKey>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState(isoToday())
  const [fetched, setFetched] = useState<{ rows: DiscountTx[]; notCounted: number; truncated: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const rows = period === '30d' ? initialRows : (fetched?.rows ?? [])
  const notCounted = period === '30d' ? initialNotCounted : (fetched?.notCounted ?? 0)
  const truncated = period === '30d' ? false : (fetched?.truncated ?? false)

  async function load(from: string, to: string) {
    setLoading(true); setError(null); setPage(0)
    try {
      const res = await fetch(`/api/staff-discount/transactions?from=${from}&to=${to}`)
      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`)
      setFetched(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setFetched({ rows: [], notCounted: 0, truncated: false })
    } finally {
      setLoading(false)
    }
  }

  function changePeriod(key: PeriodKey) {
    setPeriod(key); setPage(0); setError(null)
    if (key === '30d') { setFetched(null); return }
    if (key === 'custom') { setFetched(null); return } // waits for "Toon"
    const { from, to } = windowFor(key)
    load(from, to)
  }

  const venues = useMemo(() => Array.from(new Set(rows.map(r => r.venue_group))).sort(), [rows])
  const homes = useMemo(
    () => Array.from(new Set(rows.flatMap(r => r.home_employer_codes ?? ['unresolved'])))
      .sort((a, b) => employerName(a).localeCompare(employerName(b))),
    [rows],
  )
  const filtered = rows.filter(r =>
    (!venue || r.venue_group === venue) &&
    (!home || (r.home_employer_codes ?? ['unresolved']).includes(home)))
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pages - 1)
  const pageRows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  const select = 'bg-surface border border-border rounded-md px-2 py-1 text-xs text-text'
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
        <label className="flex items-center gap-1.5">
          Periode
          <select className={select} value={period} onChange={e => changePeriod(e.target.value as PeriodKey)}>
            {PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </label>
        {period === 'custom' && (
          <span className="flex items-center gap-1.5">
            <input type="date" className={select} value={customFrom} max={customTo}
              onChange={e => setCustomFrom(e.target.value)} />
            –
            <input type="date" className={select} value={customTo} min={customFrom} max={isoToday()}
              onChange={e => setCustomTo(e.target.value)} />
            <button
              className="border border-border rounded-md px-2 py-1 text-xs text-text hover:border-gold disabled:opacity-40"
              disabled={!customFrom || !customTo || customFrom > customTo || loading}
              onClick={() => load(customFrom, customTo)}>
              Toon
            </button>
          </span>
        )}
        <label className="flex items-center gap-1.5">
          Zaak
          <select className={select} value={venue} onChange={e => { setVenue(e.target.value); setPage(0) }}>
            <option value="">Alle</option>
            {venues.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          Eigen vennootschap
          <select className={select} value={home} onChange={e => { setHome(e.target.value); setPage(0) }}>
            <option value="">Alle</option>
            {homes.map(h => <option key={h} value={h}>{employerName(h)}</option>)}
          </select>
        </label>
        <span className="text-text-faint">{loading ? 'laden…' : `${filtered.length} van ${rows.length}`}</span>
      </div>
      {error && <p className="text-xs text-red-700">Kon transacties niet laden: {error}</p>}
      {truncated && (
        <p className="text-xs text-amber-800">
          Meer dan 5.000 rijen in deze periode — de nieuwste 5.000 worden getoond. Kies een kortere periode voor het volledige beeld.
        </p>
      )}
      {!loading && (period !== 'custom' || fetched !== null) && (
        <TxTable rows={pageRows} empty="Geen gebruik in deze periode voor deze filter." />
      )}
      {period === 'custom' && fetched === null && !loading && (
        <p className="text-xs text-text-faint py-2">Kies een van/tot-datum en klik Toon.</p>
      )}
      {pages > 1 && (
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <button className="border border-border rounded-md px-2 py-0.5 disabled:opacity-40 hover:border-gold"
            disabled={safePage === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Vorige</button>
          <span>pagina {safePage + 1} van {pages}</span>
          <button className="border border-border rounded-md px-2 py-0.5 disabled:opacity-40 hover:border-gold"
            disabled={safePage >= pages - 1} onClick={() => setPage(p => p + 1)}>Volgende</button>
        </div>
      )}
      <p className="text-[11px] text-text-faint">
        Betaald = wat de collega betaalde, na korting. Het kortingsbedrag wordt niet door Trivec doorgegeven.
        {notCounted > 0 && <> {notCounted} teruggedraaide of pre-launch registratie(s) in deze periode tellen niet mee.</>}
      </p>
    </div>
  )
}
