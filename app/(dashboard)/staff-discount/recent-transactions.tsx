'use client'

import { useMemo, useState } from 'react'
import type { DiscountTx } from '@/lib/staff-discount'
import { employerName } from '@/lib/staff-discount'
import { TxTable } from './tx-table'

// Last 30 days of uses, filterable by venue and by the colleague's home
// vennootschap. Rows arrive already filtered to uses by the server.
export function RecentTransactions({ rows }: { rows: DiscountTx[] }) {
  const [venue, setVenue] = useState('')
  const [home, setHome] = useState('')

  const venues = useMemo(() => Array.from(new Set(rows.map(r => r.venue_group))).sort(), [rows])
  const homes = useMemo(
    () => Array.from(new Set(rows.flatMap(r => r.home_employer_codes ?? ['unresolved'])))
      .sort((a, b) => employerName(a).localeCompare(employerName(b))),
    [rows],
  )
  const filtered = rows.filter(r =>
    (!venue || r.venue_group === venue) &&
    (!home || (r.home_employer_codes ?? ['unresolved']).includes(home)))

  const select = 'bg-surface border border-border rounded-md px-2 py-1 text-xs text-text'
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
        <label className="flex items-center gap-1.5">
          Zaak
          <select className={select} value={venue} onChange={e => setVenue(e.target.value)}>
            <option value="">Alle</option>
            {venues.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          Eigen vennootschap
          <select className={select} value={home} onChange={e => setHome(e.target.value)}>
            <option value="">Alle</option>
            {homes.map(h => <option key={h} value={h}>{employerName(h)}</option>)}
          </select>
        </label>
        <span className="text-text-faint">{filtered.length} van {rows.length}</span>
      </div>
      <TxTable rows={filtered} empty="Geen gebruik in de laatste 30 dagen voor deze filter." />
    </div>
  )
}
