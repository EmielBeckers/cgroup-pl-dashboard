// Types + presentation helpers for the LIVE P&L data (public.pl_entity /
// pl_venue / pl_hotel wrappers over the validated adsolut views).
//
// Reconciliation discipline: everything here only GROUPS AND SUMS rows the
// views return — no amounts are derived, no accounts are classified
// (is_revenue comes from the view, caveats come from the view).

export interface PlEntityRow {
  dossier_code: string
  calendar_year: number
  usali_department: string
  usali_line: string
  is_revenue: boolean
  amount: number
}

export interface PlVenueRow extends PlEntityRow {
  venue: string
}

export interface PlHotelRow {
  dossier_code: string
  calendar_year: number
  block: 'REVENUE' | 'LABOUR' | 'UNDISTRIBUTED' | 'NON-OPERATING'
  department: string | null
  line_label: string
  caveat: string | null
  // Provenance flag from adsolut.entity_labour_source — 'blanpla_dept'
  // (real departmental split) or 'none'. Never a guess.
  labour_split_source: 'blanpla_dept' | 'none' | null
  amount: number
}

// Amounts excluded from the P&L by explicit mapping decision (e.g. Century
// dividends) — from public.pl_exclusions, shown visibly, never hardcoded.
export interface PlExclusionRow {
  dossier_code: string
  calendar_year: number
  account_nr: string
  label: string
  amount: number
}

export const YEARS = [2024, 2025, 2026] as const

// Entities whose venue drill uses pl_venue (validated GREEN rollout).
export const VENUE_ENTITIES = ['CUSTOMIZZE', 'CCORDA', 'COUTDOOR', 'BLUEOCEAN']
// Entities whose drill uses pl_hotel (departmental hotel views).
export const HOTEL_ENTITIES = ['HASHOTEL', 'CENTURY']

// Display names only — never used for matching or math.
export const ENTITY_NAMES: Record<string, string> = {
  CUSTOMIZZE: 'Customizze',
  GREENVALLEY: 'Green Valley',
  BLUEOCEAN: 'Blue Ocean',
  CENTURY: 'Century',
  COUTDOOR: 'C. Outdoor',
  CCORDA: 'C. Corda',
  HASHOTEL: 'HasHotel',
  MIAMENSA: 'Mia Mensa',
}

export const VENUE_NAMES: Record<string, string> = {
  ATELV: 'Atelier V', ODIEL: 'Odiel', ORD: 'De Commandeur', PLAGE: 'Plage Odette',
  TCA: "The Alley's", POPUP: 'Pop-up',
  BAR: 'Corda Bar', LATTE: 'Corda Latte', CUISINE: 'Corda Cuisine',
  CORDAAT: 'Cordaat', ARENA: 'Arena', CATERING: 'Catering (invoiced)',
  INTRAGROUP: 'Intragroup', ALGEMEEN: 'Algemeen (shared)',
  ZOLGENK: 'ZOL Genk', JESSA: 'Jessa Hasselt', STBARBARA: 'St Barbara Lanaken',
  ZMK: 'ZMK Maaseik', VANHARTE: 'Van Harte', TRUDO: 'St Trudo',
  AUTOMATEN: 'Drankautomaten', NOORDERHART: 'Noorderhart',
  MAISONMATHIS: 'Maison Mathis', TRENTANOVE: 'Trentanove',
  UNALLOCATED: 'Unallocated',
}

export function entityName(code: string) { return ENTITY_NAMES[code] ?? code }
export function venueName(code: string) { return VENUE_NAMES[code] ?? code }

// Attribution buckets in pl_venue that are not physical venues — shown in
// the P&L drill, but never as navigable venue pages.
export const META_VENUES = ['UNALLOCATED', 'ALGEMEEN', 'INTRAGROUP']

// Block assignment is presentation of the mapping's own output (dept +
// line prefix + is_revenue flag from the views) — never re-classification.
// The Non-Operating department splits into the USALI summary-ladder
// buckets by the mapping's own line labels (D&A, Interest, Income Taxes;
// the rest — rent, property taxes, insurance, other income — stays
// Non-Operating Income & Expenses, per USALI).
export function blockOf(r: Pick<PlEntityRow, 'is_revenue' | 'usali_department' | 'usali_line'>): string {
  if (r.is_revenue) return 'Revenue'
  if (r.usali_department === 'F&B' && r.usali_line.startsWith('Cost of Sales')) return 'Cost of Sales'
  if (r.usali_department === 'Payroll & Related') return 'Labour'
  if (r.usali_department.startsWith('Undistributed') || r.usali_department === 'F&B'
      || r.usali_department === 'Rooms' || r.usali_department === 'Other Operated') {
    return 'Other Operating Expenses' // non-revenue rows in operating depts
  }
  if (r.usali_department === 'Non-Operating') {
    const l = r.usali_line
    if (/depreciation|amorti|impairment/i.test(l)) return 'D&A'
    if (/^interest/i.test(l)) return 'Interest'
    if (/income tax|^tax regularisation$/i.test(l)) return 'Income Taxes'
    return 'Non-Operating'
  }
  return r.usali_department // Management Fees | UNMAPPED
}

// Non-operating ladder buckets (everything below the operating result).
export const NON_OPERATING_BLOCKS = ['Non-Operating', 'D&A', 'Interest', 'Income Taxes']

// Display order for USALI departments (presentation only).
const DEPT_ORDER = [
  'Rooms', 'F&B', 'Other Operated', 'Payroll & Related',
  'Undistributed — S&M', 'Undistributed — Fleet', 'Undistributed — A&G',
  'Undistributed — POM', 'Undistributed — Utilities', 'Undistributed — IT',
  'Undistributed — Housekeeping & linnen',
  'Management Fees', 'Non-Operating', 'UNMAPPED',
]
export function deptRank(dept: string): number {
  const i = DEPT_ORDER.indexOf(dept)
  return i === -1 ? DEPT_ORDER.length : i
}

export interface YearAmounts { [year: number]: number }

export function addYear(target: YearAmounts, year: number, amount: number) {
  target[year] = (target[year] ?? 0) + amount
}

/** Revenue + result per year from any set of rows carrying is_revenue. */
export function revenueAndResult(rows: { calendar_year: number; is_revenue: boolean; amount: number }[]) {
  const revenue: YearAmounts = {}
  const result: YearAmounts = {}
  for (const r of rows) {
    addYear(result, r.calendar_year, r.amount)
    if (r.is_revenue) addYear(revenue, r.calendar_year, r.amount)
  }
  return { revenue, result }
}
