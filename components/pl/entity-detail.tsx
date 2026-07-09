'use client'

import { LiveStatement, VenueDrill, HotelDrill } from '@/components/pl/group-table'
import { PlEntityRow, PlVenueRow, PlHotelRow, YEARS, VENUE_ENTITIES, HOTEL_ENTITIES } from '@/lib/pl-live'

// Real data only: entity statement from pl_entity; venue breakdown from
// pl_venue (validated venue->dossier attribution); hotels via pl_hotel with
// their caveats and Mews placeholders; unmapped entities get totals + note.
export function EntityDetail({ dossier, entityRows, venueRows, hotelRows }: {
  dossier: string
  entityRows: PlEntityRow[]
  venueRows: PlVenueRow[] | null
  hotelRows: PlHotelRow[] | null
}) {
  const unmapped = !VENUE_ENTITIES.includes(dossier) && !HOTEL_ENTITIES.includes(dossier)
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
          {unmapped && (
            <tr><td colSpan={1 + YEARS.length} className="px-4 py-1 text-[11px] text-text-faint">
              {dossier === 'MIAMENSA'
                ? 'Enkele venue — entiteit = venue. USALI-mapping nog niet opgezet: enkel totalen, geen verzonnen detail.'
                : 'USALI-mapping nog niet opgezet voor deze entiteit — enkel totalen (omzet per rekeningklasse), geen verzonnen detail.'}
            </td></tr>
          )}
          <LiveStatement rows={entityRows} dossier={dossier} indentBase="pl-4" />
          {hotelRows && hotelRows.length > 0 && (
            <>
              <tr><td colSpan={1 + YEARS.length} className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-text-faint">Departementen (hotel)</td></tr>
              <HotelDrill rows={hotelRows} />
            </>
          )}
          {venueRows && venueRows.length > 0 && (
            <>
              <tr><td colSpan={1 + YEARS.length} className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-text-faint">Venues</td></tr>
              <VenueDrill rows={venueRows} dossier={dossier} />
            </>
          )}
        </tbody>
      </table>
      <p className="px-3 py-3 text-[11px] text-text-faint">
        Detail verschijnt enkel waar echte gemapte rekeningen met activiteit bestaan — lijnen verschillen per venue, dat is correct.
      </p>
    </div>
  )
}
