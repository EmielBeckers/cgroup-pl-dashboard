import type { DiscountTx } from '@/lib/staff-discount'
import { employerName } from '@/lib/staff-discount'

// Plain table (no hooks): usable from the server page and from the client
// filter component alike. The amount column shows the ticket exactly as
// Trivec posted it; it is never converted into a gross or discount amount.
export function TxTable({ rows, empty }: { rows: DiscountTx[]; empty: string }) {
  if (rows.length === 0) return <p className="text-xs text-text-faint py-2">{empty}</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-text-faint border-b border-border">
            <th className="py-2 pr-3 font-medium">Datum / tijd</th>
            <th className="py-2 pr-3 font-medium">Collega</th>
            <th className="py-2 pr-3 font-medium">Eigen vennootschap</th>
            <th className="py-2 pr-3 font-medium">Zaak</th>
            <th className="py-2 pl-3 font-medium text-right" title="Bedrag zoals door Trivec gepost. Nog niet bevestigd of dit vóór of na de 25% korting is.">
              Ticket zoals gepost*
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.uuid} className="border-b border-border-subtle last:border-0">
              <td className="py-1.5 pr-3 tabular-nums text-text-muted whitespace-nowrap">{r.local_time}</td>
              <td className="py-1.5 pr-3 text-text">{r.employee_name ?? '—'}</td>
              <td className="py-1.5 pr-3 text-text-muted">
                {(r.home_employer_codes ?? ['unresolved']).map(employerName).join(' / ')}
              </td>
              <td className="py-1.5 pr-3 text-text-muted">{r.venue_group}</td>
              <td className="py-1.5 pl-3 text-right tabular-nums text-text">
                {r.ticket_as_posted == null ? '—' : `€ ${r.ticket_as_posted.toLocaleString('nl-BE')}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
