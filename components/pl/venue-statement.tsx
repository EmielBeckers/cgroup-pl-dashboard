'use client'

import { LiveStatement } from '@/components/pl/group-table'
import { PlVenueRow, YEARS } from '@/lib/pl-live'

// Statement table for a single venue, WITH venue-scoped invoice drill
// (pl_venue_line_invoices mirrors the venue view's blanpla+rules
// attribution; multi-venue invoices show "venue-deel van totaal").
export function VenueStatement({ rows, dossier, venue }: { rows: PlVenueRow[]; dossier: string; venue: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-text-faint">
            <td className="px-3 py-2" />
            {YEARS.map(y => (
              <td key={y} className="px-3 py-2 text-right border-l border-border/50">{y}{y === 2026 && ' YTD'}</td>
            ))}
          </tr>
        </thead>
        <tbody>
          <LiveStatement rows={rows} dossier={dossier} indentBase="pl-4" venue={venue} />
        </tbody>
      </table>
      <p className="px-3 py-3 text-[11px] text-text-faint">
        Detail verschijnt enkel waar echte gemapte rekeningen met activiteit bestaan.
        De factuur-drill toont het deel dat aan deze venue is toegewezen; bij facturen
        die over meerdere venues verdeeld zijn staat het volledige lijnbedrag ernaast.
      </p>
    </div>
  )
}
