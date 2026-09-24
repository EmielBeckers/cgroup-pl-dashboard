'use client'

// Side-by-side venue comparison. Honesty rules baked in:
//  - columns are the same pl_venue rows the venue statements render —
//    block sums via the shared blockOf(), so they cannot disagree;
//  - LINE-level rows show only lines present in EVERY selected column
//    (comparing a line one venue doesn't book is noise, not signal);
//  - an in-progress year is labeled YTD through the last complete month —
//    a YTD column next to a full-year column is flagged, not hidden;
//  - visible caveat: venue results contain allocated costs only. Central/
//    entity-level costs differ per entity, so a cross-entity comparison
//    compares OPERATIONS, not full P&L burden.

import React, { useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatCurrency } from '@/lib/utils'
import {
  PlVenueRow, VENUE_ENTITIES, META_VENUES, YEARS,
  entityName, venueName, blockOf, NON_OPERATING_BLOCKS,
} from '@/lib/pl-live'

interface Col { dossier: string; venue: string; year: number; rows: PlVenueRow[] }

const LADDER: { key: string; label: string; kind: 'block' | 'subtotal' }[] = [
  { key: 'Revenue', label: 'Operating Revenue', kind: 'block' },
  { key: 'Cost of Sales', label: 'Cost of Sales', kind: 'block' },
  { key: 'GP', label: 'Gross Profit', kind: 'subtotal' },
  { key: 'Labour', label: 'Payroll & Related Expenses', kind: 'block' },
  { key: 'Other Operating Expenses', label: 'Other Expenses', kind: 'block' },
  { key: 'GOP', label: 'Gross Operating Profit (GOP)', kind: 'subtotal' },
  { key: 'Management Fees', label: 'Management Fees', kind: 'block' },
  { key: 'NONOP', label: 'Non-Operating (net, incl. D&A/interest/taxes)', kind: 'block' },
  { key: 'NET', label: 'Net Income', kind: 'subtotal' },
]

function colSums(rows: PlVenueRow[], year: number) {
  const s: Record<string, number> = { Revenue: 0, 'Cost of Sales': 0, Labour: 0, 'Other Operating Expenses': 0, 'Management Fees': 0, NONOP: 0, UNMAPPED: 0, NET: 0 }
  for (const r of rows) {
    if (r.calendar_year !== year) continue
    const b = blockOf(r)
    s.NET += r.amount
    if (NON_OPERATING_BLOCKS.includes(b)) s.NONOP += r.amount
    else if (b === 'UNMAPPED') s.UNMAPPED += r.amount
    else s[b] = (s[b] ?? 0) + r.amount
  }
  s.GP = s.Revenue + s['Cost of Sales']
  s.GOP = s.GP + s.Labour + s['Other Operating Expenses']
  return s
}

function Cell({ v, tor, bold }: { v: number; tor: number; bold?: boolean }) {
  if (Math.round(v) === 0) return <td className="px-3 py-1 text-right text-text-faint border-l border-border/50">—</td>
  return (
    <td className="px-3 py-1 text-right whitespace-nowrap border-l border-border/50">
      <div className={cn('text-xs', bold && 'font-semibold', v < 0 ? 'text-danger' : 'text-text')}>{formatCurrency(v)}</div>
      <div className="text-[9px] text-text-faint tabular-nums">{tor !== 0 ? `${(v / tor * 100).toFixed(1)}%` : ' '}</div>
    </td>
  )
}

export function CompareClient({ allVenues }: { allVenues: { dossier_code: string; venue: string }[] }) {
  const selectable = allVenues
    .filter(v => VENUE_ENTITIES.includes(v.dossier_code) && !META_VENUES.includes(v.venue))
    .sort((a, b) => (a.dossier_code + venueName(a.venue)).localeCompare(b.dossier_code + venueName(b.venue)))
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [years, setYears] = useState<Set<number>>(new Set([2025]))
  const [cols, setCols] = useState<Col[] | null>(null)
  const [loading, setLoading] = useState(false)

  const lastComplete = useMemo(() => {
    const d = new Date(); const m = d.getMonth() // 0-based = 1-based previous month
    return m < 1 ? 12 : m
  }, [])
  const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  const currentYear = new Date().getFullYear()

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const sel = Array.from(picked).map(k => { const [d, v] = k.split('~'); return { d, v } })
    const yrs = Array.from(years).sort()
    const fetched = await Promise.all(sel.map(({ d, v }) =>
      supabase.from('pl_venue').select('*').eq('dossier_code', d).eq('venue', v).in('calendar_year', yrs)
        .then(({ data }) => ({ d, v, rows: (data ?? []) as PlVenueRow[] }))
    ))
    const out: Col[] = []
    for (const f of fetched) for (const y of yrs) out.push({ dossier: f.d, venue: f.v, year: y, rows: f.rows })
    setCols(out)
    setLoading(false)
  }

  // shared lines: present (nonzero) in EVERY column
  const sharedLines = useMemo(() => {
    if (!cols || cols.length === 0) return []
    const perCol = cols.map(c => {
      const m = new Map<string, number>()
      for (const r of c.rows) if (r.calendar_year === c.year) {
        const k = `${r.usali_department}~${r.usali_line}`
        m.set(k, (m.get(k) ?? 0) + r.amount)
      }
      return m
    })
    const first = perCol[0]
    return Array.from(first.keys())
      .filter(k => perCol.every(m => Math.round(m.get(k) ?? 0) !== 0))
      .sort()
      .map(k => ({ key: k, label: k.split('~')[1], dept: k.split('~')[0], per: perCol.map(m => m.get(k) ?? 0) }))
  }, [cols])

  const sums = useMemo(() => (cols ?? []).map(c => colSums(c.rows, c.year)), [cols])
  const anyYtd = (cols ?? []).some(c => c.year === currentYear)
  const anyUnmapped = sums.some(s => Math.round(s.UNMAPPED) !== 0)

  return (
    <div className="space-y-3">
      <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-text-faint mb-1.5">Venues (over entiteiten heen)</p>
          <div className="flex flex-wrap gap-1.5">
            {selectable.map(v => {
              const k = `${v.dossier_code}~${v.venue}`
              const on = picked.has(k)
              return (
                <button key={k} onClick={() => setPicked(p => { const n = new Set(p); if (on) n.delete(k); else n.add(k); return n })}
                  className={cn('px-2 py-1 rounded text-[11px] border transition-colors',
                    on ? 'border-gold text-gold bg-gold/10' : 'border-border text-text-muted hover:text-text')}>
                  {venueName(v.venue)} <span className="text-text-faint">· {entityName(v.dossier_code)}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-faint mb-1.5">Jaren</p>
            <div className="flex gap-1.5">
              {YEARS.map(y => (
                <button key={y} onClick={() => setYears(p => { const n = new Set(p); if (n.has(y)) n.delete(y); else n.add(y); return n })}
                  className={cn('px-2 py-1 rounded text-[11px] border',
                    years.has(y) ? 'border-gold text-gold bg-gold/10' : 'border-border text-text-muted hover:text-text')}>
                  {y}{y === currentYear && ` (YTD t/m ${MONTHS[lastComplete - 1]})`}
                </button>
              ))}
            </div>
          </div>
          <button onClick={load} disabled={picked.size === 0 || years.size === 0 || loading}
            className="px-3 py-1.5 rounded-md text-xs border border-gold text-gold bg-gold/10 hover:bg-gold/20 disabled:opacity-40">
            {loading ? 'Laden…' : 'Vergelijk'}
          </button>
        </div>
      </div>

      {cols && cols.length > 0 && (
        <div className="bg-surface border border-border rounded-lg">
          <div className="mx-4 mt-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
            <Info size={11} className="inline mr-1.5" />
            Venue-resultaten bevatten enkel <strong>toegewezen</strong> kosten. Centrale en niet-verdeelde
            entiteitskosten (UNALLOCATED) verschillen per entiteit en zitten hier NIET in — over entiteiten
            heen vergelijk je operaties, geen volledige P&amp;L-last.
            {anyYtd && <> Kolommen {currentYear} zijn YTD (boekingen t/m de laatste sync) naast volledige jaren — vergelijk die niet 1-op-1.</>}
          </div>
          <div className="overflow-x-auto p-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-text-faint">
                  <td className="px-3 py-2" />
                  {cols.map((c, i) => (
                    <td key={i} className="px-3 py-2 text-right border-l border-border/50">
                      <div className="text-text normal-case tracking-normal font-medium">{venueName(c.venue)}</div>
                      <div>{entityName(c.dossier)} · {c.year}{c.year === currentYear && ' YTD'}</div>
                    </td>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LADDER.map(row => (
                  <tr key={row.key} className={cn(row.kind === 'subtotal' && 'border-t border-border/60 bg-surface-raised/40')}>
                    <td className={cn('px-3 py-1 text-xs', row.kind === 'subtotal' ? 'font-semibold text-text' : 'text-text-muted')}>{row.label}</td>
                    {sums.map((s, i) => (
                      <Cell key={i} v={s[row.key] ?? 0} tor={s.Revenue} bold={row.kind === 'subtotal'} />
                    ))}
                  </tr>
                ))}
                {anyUnmapped && (
                  <tr>
                    <td className="px-3 py-1 text-xs text-amber-800">Niet gemapt — REVIEW</td>
                    {sums.map((s, i) => <Cell key={i} v={s.UNMAPPED} tor={s.Revenue} />)}
                  </tr>
                )}
                {sharedLines.length > 0 && (
                  <tr><td colSpan={1 + cols.length} className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-widest text-text-faint">
                    Gedeelde lijnen (aanwezig in élke kolom — {sharedLines.length})
                  </td></tr>
                )}
                {sharedLines.map(l => (
                  <tr key={l.key} className="hover:bg-surface-raised/40">
                    <td className="px-3 py-0.5 text-[11px] text-text-muted pl-6 max-w-80 truncate">{l.label}</td>
                    {l.per.map((v, i) => <Cell key={i} v={v} tor={sums[i].Revenue} />)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="px-4 pb-3 text-[10px] text-text-faint">
            Zelfde gevalideerde viewrijen als de venue-P&amp;L&apos;s (venue + UNALLOCATED = entiteit, tot op de euro).
            Lijnen die niet in élke kolom voorkomen worden bewust niet vergeleken.
          </p>
        </div>
      )}
    </div>
  )
}
