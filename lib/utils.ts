import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { PlSnapshot, PlFull } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, compact = false): string {
  if (compact && Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
      notation: 'compact',
    }).format(amount)
  }
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatMargin(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatDelta(value: number): string {
  return `${value >= 0 ? '+' : ''}${new Intl.NumberFormat('nl-BE', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0, notation: 'compact',
  }).format(value)}`
}

export function formatDeltaPct(current: number, comparison: number): string {
  if (comparison === 0) return '—'
  const pct = ((current - comparison) / Math.abs(comparison)) * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec',
]

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`
}

// Get a numeric value safely from a snapshot (handles undefined/null from DB)
export function n(snapshot: PlSnapshot, field: keyof PlSnapshot): number {
  return Number((snapshot as unknown as Record<string, unknown>)[field] ?? 0)
}

// Compute all derived totals from a raw snapshot
export function derivePl(snapshot: PlSnapshot): PlFull {
  const g = (field: keyof PlSnapshot) => n(snapshot, field)

  const total_operating_revenue =
    g('revenue_rooms') + g('revenue_food') + g('revenue_beverage') +
    g('revenue_other_operated_depts') + g('revenue_misc_income') +
    // backward compat: if new columns are 0 but old exists, use it
    (g('revenue_rooms') === 0 && g('revenue_food') === 0 ? g('revenue_other') : 0)

  // If new columns are all zero, fall back to legacy revenue_other
  const effectiveRevenue = total_operating_revenue > 0
    ? total_operating_revenue
    : g('revenue_food') + g('revenue_beverage') + g('revenue_other')

  const total_cogs =
    g('cogs_rooms') + g('cogs_food') + g('cogs_beverage') + g('cogs_other_operated_depts')

  const gross_profit = effectiveRevenue - total_cogs

  const total_labour =
    g('labour_management') + g('labour_service') + g('labour_kitchen')

  // Sum all exp_* columns
  const total_other_expenses =
    g('exp_banquet') + g('exp_china') + g('exp_cleaning_supplies') +
    g('exp_cluster_services') + g('exp_commissions') + g('exp_complimentary') +
    g('exp_contract_services') + g('exp_corporate_office') + g('exp_decorations') +
    g('exp_dishwashing') + g('exp_dues_subscriptions') + g('exp_entertainment_inhouse') +
    g('exp_equipment_rental') + g('exp_flatware') + g('exp_glassware') +
    g('exp_ice') + g('exp_kitchen_fuel') + g('exp_kitchen_smallwares') +
    g('exp_laundry') + g('exp_licenses') + g('exp_linen') + g('exp_menus') +
    g('exp_miscellaneous') + g('exp_music_entertainment') + g('exp_operating_supplies') +
    g('exp_paper_plastics') + g('exp_postage') + g('exp_printing') +
    g('exp_reservations') + g('exp_royalty_fees') + g('exp_training') +
    g('exp_travel_meals') + g('exp_travel_other') + g('exp_uniform_costs') +
    g('exp_uniform_laundry') + g('exp_utensils') + g('exp_admin_general') +
    g('exp_it_systems') + g('exp_sales_marketing') + g('exp_property_maintenance') +
    g('exp_utilities') +
    // legacy fallback: if new exp columns are all zero, use old overhead columns
    (total_other_expenses_new(snapshot) === 0
      ? g('overhead_rent') + g('overhead_utilities') + g('overhead_marketing') + g('overhead_other')
      : 0)

  const gop = gross_profit - total_labour - total_other_expenses
  const income_before_noi = gop - g('management_fees')

  const total_noi = g('nonop_rent') + g('nonop_taxes') + g('nonop_insurance') + g('nonop_other')
  const ebitda = income_before_noi - total_noi

  const total_ida = g('interest') + g('depreciation') + g('amortization')
  const income_before_taxes = ebitda - total_ida
  const net_income = income_before_taxes - g('income_taxes')

  const rev = effectiveRevenue

  return {
    ...snapshot,
    // ensure new fields default to 0 if missing from DB row
    revenue_rooms: g('revenue_rooms'),
    revenue_other_operated_depts: g('revenue_other_operated_depts'),
    revenue_misc_income: g('revenue_misc_income'),
    cogs_rooms: g('cogs_rooms'),
    cogs_other_operated_depts: g('cogs_other_operated_depts'),
    management_fees: g('management_fees'),
    nonop_rent: g('nonop_rent'),
    nonop_taxes: g('nonop_taxes'),
    nonop_insurance: g('nonop_insurance'),
    nonop_other: g('nonop_other'),
    interest: g('interest'),
    depreciation: g('depreciation'),
    amortization: g('amortization'),
    income_taxes: g('income_taxes'),
    // computed
    total_operating_revenue: rev,
    total_cogs,
    gross_profit,
    total_labour,
    total_other_expenses,
    gop,
    income_before_noi,
    total_noi,
    ebitda,
    total_ida,
    income_before_taxes,
    net_income,
    // margins
    gross_margin_pct:  rev > 0 ? (gross_profit / rev) * 100 : 0,
    labour_pct:        rev > 0 ? (total_labour / rev) * 100 : 0,
    gop_margin_pct:    rev > 0 ? (gop / rev) * 100 : 0,
    ebitda_margin_pct: rev > 0 ? (ebitda / rev) * 100 : 0,
    net_margin_pct:    rev > 0 ? (net_income / rev) * 100 : 0,
  }
}

// Helper: sum only the new exp_* columns (to detect legacy-only data)
function total_other_expenses_new(snapshot: PlSnapshot): number {
  const g = (f: keyof PlSnapshot) => n(snapshot, f)
  return g('exp_cleaning_supplies') + g('exp_contract_services') + g('exp_laundry') +
    g('exp_linen') + g('exp_utilities') + g('exp_admin_general') + g('exp_it_systems') +
    g('exp_sales_marketing') + g('exp_property_maintenance')
}

// Sum an array of snapshots into one (for YTD / group aggregation)
export function sumSnapshots(snapshots: PlSnapshot[]): PlSnapshot {
  if (snapshots.length === 0) throw new Error('Cannot sum empty array')
  const NUM_FIELDS: Array<keyof PlSnapshot> = [
    'revenue_rooms','revenue_food','revenue_beverage','revenue_other_operated_depts',
    'revenue_misc_income','revenue_other',
    'cogs_rooms','cogs_food','cogs_beverage','cogs_other_operated_depts',
    'labour_management','labour_service','labour_kitchen',
    'exp_banquet','exp_china','exp_cleaning_supplies','exp_cluster_services',
    'exp_commissions','exp_complimentary','exp_contract_services','exp_corporate_office',
    'exp_decorations','exp_dishwashing','exp_dues_subscriptions','exp_entertainment_inhouse',
    'exp_equipment_rental','exp_flatware','exp_glassware','exp_ice','exp_kitchen_fuel',
    'exp_kitchen_smallwares','exp_laundry','exp_licenses','exp_linen','exp_menus',
    'exp_miscellaneous','exp_music_entertainment','exp_operating_supplies','exp_paper_plastics',
    'exp_postage','exp_printing','exp_reservations','exp_royalty_fees','exp_training',
    'exp_travel_meals','exp_travel_other','exp_uniform_costs','exp_uniform_laundry',
    'exp_utensils','exp_admin_general','exp_it_systems','exp_sales_marketing',
    'exp_property_maintenance','exp_utilities',
    'overhead_rent','overhead_utilities','overhead_marketing','overhead_other',
    'management_fees','nonop_rent','nonop_taxes','nonop_insurance','nonop_other',
    'interest','depreciation','amortization','income_taxes',
  ]
  const base = { ...snapshots[0] }
  for (const s of snapshots.slice(1)) {
    for (const f of NUM_FIELDS) {
      ;(base as Record<string, unknown>)[f] = n(base as PlSnapshot, f) + n(s, f)
    }
  }
  return base
}
