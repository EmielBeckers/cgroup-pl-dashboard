'use client'

import { LiveStatement } from '@/components/pl/group-table'
import { PlVenueRow, YEARS } from '@/lib/pl-live'

// Statement table for a single venue. Invoice drill stays off here: the
// drill RPC works per entity P&L line, not per venue — showing entity-wide
// invoices under a venue line would overstate coverage.
export function VenueStatement({ rows, dossier }: { rows: PlVenueRow[]; dossier: string }) {
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
          <LiveStatement rows={rows} dossier={dossier} drill={false} indentBase="pl-4" />
        </tbody>
      </table>
      <p className="px-3 py-3 text-[11px] text-text-faint">
        Detail verschijnt enkel waar echte gemapte rekeningen met activiteit bestaan.
        Factuur-drilldown is beschikbaar op entiteitsniveau (per P&L-lijn, niet per venue).
      </p>
    </div>
  )
}
