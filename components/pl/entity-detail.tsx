'use client'

import { Info } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { LiveStatement, VenueDrill, HotelDrill } from '@/components/pl/group-table'
import { PlEntityRow, PlVenueRow, PlHotelRow, PlExclusionRow, YEARS, VENUE_ENTITIES, HOTEL_ENTITIES } from '@/lib/pl-live'

// Real data only: entity statement from pl_entity; venue breakdown from
// pl_venue (validated venue->dossier attribution); hotels via pl_hotel with
// their caveats and Mews placeholders; unmapped entities get totals + note.
// Mapped exclusions (pl_exclusions) render as an unmissable banner: anyone
// tying this P&L to the raw GL must see what was left out and why.
export function EntityDetail({ dossier, entityRows, venueRows, hotelRows, exclusions = [] }: {
  dossier: string
  entityRows: PlEntityRow[]
  venueRows: PlVenueRow[] | null
  hotelRows: PlHotelRow[] | null
  exclusions?: PlExclusionRow[]
}) {
  const unmapped = !VENUE_ENTITIES.includes(dossier) && !HOTEL_ENTITIES.includes(dossier)
  const exclByLabel = new Map<string, PlExclusionRow[]>()
  for (const e of exclusions) {
    if (!exclByLabel.has(e.label)) exclByLabel.set(e.label, [])
    exclByLabel.get(e.label)!.push(e)
  }
  return (
    <div className="overflow-x-auto">
      {exclByLabel.size > 0 && (
        <div className="mx-3 mb-2 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <p className="font-semibold flex items-center gap-1.5">
            <Info size={13} /> Niet in deze P&L (bewuste uitsluiting)
          </p>
          {Array.from(exclByLabel.entries()).map(([label, rows]) => (
            <p key={label} className="mt-1">
              {label} (rek. {rows[0].account_nr}):{' '}
              {rows.sort((a, b) => a.calendar_year - b.calendar_year)
                .map(r => `${r.calendar_year} ${formatCurrency(Number(r.amount))}`).join(' · ')}
              {' — '}intragroepstroom; het resultaat hieronder ligt dus zoveel lager dan het ruwe grootboek.
            </p>
          ))}
        </div>
      )}
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
