// Types + labels for the staff-discount page (/staff-discount).
// Data comes from the SDWorx project's hr_sync.v_discount_* views via
// lib/hr-db.ts (server-only). This file holds no data access and is safe to
// import from client components.
//
// Honesty: ticket_as_posted is what the colleague PAID, after the discount
// (confirmed 2026-10-01), shown as "Betaald". Never derive a gross or discount
// amount from it: drinks are charged at full price on the same ticket, and
// Trivec does not send the discount amount.

// SD Worx employer code -> vennootschap (as agreed 2026-10-01).
export const EMPLOYER_NAMES: Record<string, string> = {
  '1HC0512': 'Century nv',
  '1HH0370': 'HasHotel nv',
  '1HC0514': 'C.Corda bv',
  '1HM0677': 'Mia Mensa bv',
  '1HC0638': 'Customise',
  '1HG0007': 'Green Valley Hospitality nv',
  '1HB0899': 'Blue Ocean Hospitality nv',
  '1HC0513': 'C.Outdoor nv',
  '1HC0529': 'Management',
}

export function employerName(code: string | null | undefined): string {
  if (!code) return '—'
  if (code === 'unresolved') return 'Onbekend'
  return EMPLOYER_NAMES[code] ?? code
}

export interface AdoptionRow {
  week_start: string            // YYYY-MM-DD (Monday)
  iso_week: string              // e.g. 2026-W40
  employer_code: string         // or 'ALL'
  eligible_count: number
  used_cumulative_count: number
  used_in_week_count: number
  used_cumulative_pct: number | null
}

export interface DiscountTx {
  uuid: string
  local_time: string            // YYYY-MM-DD HH:MI, Europe/Brussels
  use_date: string
  employee_name: string | null
  home_employer_codes: string[] | null
  venue_group: string
  venue_employer_code: string | null
  ticket_as_posted: number | null
}

export interface PerVenueRow {
  shop_uuid: string
  venue_group: string
  venue_employer_code: string | null
  unmapped: boolean
  uses_total: number
  colleagues_total: number
  uses_30d: number
  colleagues_30d: number
  last_use: string | null       // YYYY-MM-DD HH:MI, Europe/Brussels
}

export interface VenueHomeEntityRow {
  shop_uuid: string
  home_employer_code: string
  uses: number
  colleagues: number
}

export interface UnmappedShopRow {
  shop_uuid: string
  shop_name: string
  transactions: number
  uses: number
}

export interface CoverageRow {
  venue_name: string
  employer_code: string
  venue_group: string
  status: 'connected' | 'not connected' | 'no shop' | 'shop excluded'
}

export interface DiscountKpis {
  uses_total: number
  uses_30d: number
  colleagues_total: number
  colleagues_30d: number
  paid_total: number | null
  paid_30d: number | null
  eligible_count: number
  adopted_total: number         // currently eligible colleagues with ≥1 use
  adopted_30d: number
}

export interface ColleagueRow {
  contact_uuid: string
  employee_name: string | null
  home_employer_codes: string[] | null
  uses: number
  total_paid: number | null
  uses_with_amount: number
  first_use: string             // YYYY-MM-DD HH:MI, Europe/Brussels
  last_use: string
}

export interface StaffDiscountData {
  kpis: DiscountKpis
  colleagues: ColleagueRow[]    // every colleague with ≥1 use, busiest first
  adoption: AdoptionRow[]
  violations: DiscountTx[]
  unresolvedUses: number        // uses whose own entity could not be determined
  perVenue: PerVenueRow[]
  venueHomeEntities: VenueHomeEntityRow[]
  recent: DiscountTx[]          // uses in the last 30 days
  recentNotCounted: number      // reversed / pre-launch rewards in the last 30 days
  unmappedShops: UnmappedShopRow[]
  coverageGaps: CoverageRow[]   // venues whose status is not 'connected'
  latestTransaction: string | null
}
