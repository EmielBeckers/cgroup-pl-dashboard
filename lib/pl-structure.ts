import { PlFull, PlSnapshot } from './types'

// ── USALI expense category list (used by AI + review dropdown) ────────────
export const USALI_EXPENSE_CATEGORIES = [
  'Cost of Food',
  'Cost of Beverage',
  'Cost of Rooms',
  'Cost of Other Operated Departments',
  'Banquet Expenses',
  'China',
  'Cleaning Supplies',
  'Cluster Services',
  'Commissions',
  'Complimentary Services and Gifts',
  'Contract Services',
  'Corporate Office Reimbursables',
  'Decorations',
  'Dishwashing Supplies',
  'Dues and Subscriptions',
  'Entertainment—In-House',
  'Equipment Rental',
  'Flatware',
  'Glassware',
  'Ice',
  'Kitchen Fuel',
  'Kitchen Smallwares',
  'Laundry and Dry Cleaning',
  'Licenses and Permits',
  'Linen',
  'Menus and Beverage Lists',
  'Miscellaneous',
  'Music and Entertainment',
  'Operating Supplies',
  'Paper and Plastics',
  'Postage and Overnight Delivery',
  'Printing and Stationery',
  'Reservations',
  'Royalty Fees',
  'Training',
  'Travel—Meals and Entertainment',
  'Travel—Other',
  'Uniform Costs',
  'Uniform Laundry',
  'Utensils',
  'Administrative and General',
  'Information and Telecommunications Systems',
  'Sales and Marketing',
  'Property Operation and Maintenance',
  'Utilities',
  'Management Fees',
] as const

export type UsaliCategory = typeof USALI_EXPENSE_CATEGORIES[number]

// Maps USALI category name → pl_snapshots column key
export const USALI_TO_COLUMN: Partial<Record<string, keyof PlSnapshot>> = {
  'Cost of Food':                          'cogs_food',
  'Cost of Beverage':                      'cogs_beverage',
  'Cost of Rooms':                         'cogs_rooms',
  'Cost of Other Operated Departments':    'cogs_other_operated_depts',
  'Banquet Expenses':                      'exp_banquet',
  'China':                                 'exp_china',
  'Cleaning Supplies':                     'exp_cleaning_supplies',
  'Cluster Services':                      'exp_cluster_services',
  'Commissions':                           'exp_commissions',
  'Complimentary Services and Gifts':      'exp_complimentary',
  'Contract Services':                     'exp_contract_services',
  'Corporate Office Reimbursables':        'exp_corporate_office',
  'Decorations':                           'exp_decorations',
  'Dishwashing Supplies':                  'exp_dishwashing',
  'Dues and Subscriptions':                'exp_dues_subscriptions',
  'Entertainment—In-House':               'exp_entertainment_inhouse',
  'Equipment Rental':                      'exp_equipment_rental',
  'Flatware':                              'exp_flatware',
  'Glassware':                             'exp_glassware',
  'Ice':                                   'exp_ice',
  'Kitchen Fuel':                          'exp_kitchen_fuel',
  'Kitchen Smallwares':                    'exp_kitchen_smallwares',
  'Laundry and Dry Cleaning':             'exp_laundry',
  'Licenses and Permits':                  'exp_licenses',
  'Linen':                                 'exp_linen',
  'Menus and Beverage Lists':             'exp_menus',
  'Miscellaneous':                         'exp_miscellaneous',
  'Music and Entertainment':               'exp_music_entertainment',
  'Operating Supplies':                    'exp_operating_supplies',
  'Paper and Plastics':                    'exp_paper_plastics',
  'Postage and Overnight Delivery':        'exp_postage',
  'Printing and Stationery':               'exp_printing',
  'Reservations':                          'exp_reservations',
  'Royalty Fees':                          'exp_royalty_fees',
  'Training':                              'exp_training',
  'Travel—Meals and Entertainment':       'exp_travel_meals',
  'Travel—Other':                         'exp_travel_other',
  'Uniform Costs':                         'exp_uniform_costs',
  'Uniform Laundry':                       'exp_uniform_laundry',
  'Utensils':                              'exp_utensils',
  'Administrative and General':            'exp_admin_general',
  'Information and Telecommunications Systems': 'exp_it_systems',
  'Sales and Marketing':                   'exp_sales_marketing',
  'Property Operation and Maintenance':    'exp_property_maintenance',
  'Utilities':                             'exp_utilities',
  'Management Fees':                       'management_fees',
}

// ── P&L row structure definition ─────────────────────────────────────────────

export type PlRowType = 'section' | 'line' | 'subtotal' | 'total' | 'spacer'
export type LineKind = 'revenue' | 'cost' | 'profit' | 'fee' | 'neutral'
export type ShowWhen = 'always' | 'hotel' | 'nonzero'

export interface PlRowDef {
  key: string
  label: string
  indent: 0 | 1 | 2
  rowType: PlRowType
  kind: LineKind
  // field in PlFull; null = computed subtotal
  field?: keyof PlFull
  // which collapse group this row belongs to (null = always visible)
  collapseGroup?: 'labour' | 'other_expenses'
  showWhen: ShowWhen
  // for cost lines: % = field / pctBase (not / total revenue)
  pctBase?: keyof PlFull
}

// HONEST MODE (permanent, 2026-07-08): every line/section row was removed —
// they rendered FABRICATED mock splits (ratio-generated by the old
// scripts/seed.ts & refresh.ts, both DELETED 2026-08-03 with the Nightly
// P&L Refresh workflow — mock regeneration no longer exists as a
// capability). Only totals remain, and pages using this component carry a
// DEMO banner. Real, GL-tied figures live in the /group page (adsolut views).
// Do NOT re-add split lines here — see README 'Honest data rule' and
// scripts/check-honesty.mjs, which fails the build if ratios reappear.
export const PL_ROWS: PlRowDef[] = [
  // ── Operating Revenue ────────────────────────────────────────────────────
  { key: 'total_revenue', label: 'Total Operating Revenue', indent: 0, rowType: 'subtotal', kind: 'revenue', field: 'total_operating_revenue', showWhen: 'always' },

  { key: 'sp1', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── Cost of Sales ────────────────────────────────────────────────────────
  { key: 'total_cogs', label: 'Total Cost of Sales', indent: 0, rowType: 'subtotal', kind: 'cost', field: 'total_cogs', showWhen: 'always' },

  { key: 'sp2', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── Gross Profit ─────────────────────────────────────────────────────────
  { key: 'gross_profit', label: 'Gross Profit', indent: 0, rowType: 'total', kind: 'profit', field: 'gross_profit', showWhen: 'always' },

  { key: 'sp3', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── Labour (collapsed) ───────────────────────────────────────────────────
  // Function split (management/service/kitchen) REMOVED 2026-07-08: it was
  // fabricated by the mock seeder (fixed ratios), no GL basis. Only the
  // total is shown; real departmental labour lives in the live views.
  { key: 'total_labour', label: 'Total Labour', indent: 0, rowType: 'subtotal', kind: 'cost', field: 'total_labour', showWhen: 'always' },

  { key: 'sp4', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── Other Expenses (collapsed) ───────────────────────────────────────────
  { key: 'total_other_expenses', label: 'Total Other Expenses', indent: 0, rowType: 'subtotal', kind: 'cost', field: 'total_other_expenses', showWhen: 'always' },

  { key: 'sp5', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── Gross Operating Profit ───────────────────────────────────────────────
  { key: 'gop', label: 'Gross Operating Profit (GOP)', indent: 0, rowType: 'total', kind: 'profit', field: 'gop', showWhen: 'always' },

  { key: 'sp6', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── Management Fees ──────────────────────────────────────────────────────

  // ── Income Before NOI ────────────────────────────────────────────────────
  { key: 'income_before_noi', label: 'Income Before Non-Operating Income & Expenses', indent: 0, rowType: 'subtotal', kind: 'profit', field: 'income_before_noi', showWhen: 'always' },

  { key: 'sp7', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── Non-Operating ────────────────────────────────────────────────────────
  { key: 'total_noi', label: 'Total Non-Operating', indent: 0, rowType: 'subtotal', kind: 'cost', field: 'total_noi', showWhen: 'always' },

  { key: 'sp8', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── EBITDA ───────────────────────────────────────────────────────────────
  { key: 'ebitda', label: 'EBITDA', indent: 0, rowType: 'total', kind: 'profit', field: 'ebitda', showWhen: 'always' },

  { key: 'sp9', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── Interest, Depreciation, Amortization ─────────────────────────────────
  { key: 'total_ida', label: 'Total IDA', indent: 0, rowType: 'subtotal', kind: 'cost', field: 'total_ida', showWhen: 'always' },

  { key: 'sp10', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── Net Income ───────────────────────────────────────────────────────────
  { key: 'income_before_taxes', label: 'Income Before Income Taxes', indent: 0, rowType: 'subtotal', kind: 'profit', field: 'income_before_taxes', showWhen: 'always' },
  { key: 'net_income', label: 'Net Income', indent: 0, rowType: 'total', kind: 'profit', field: 'net_income', showWhen: 'always' },
]
