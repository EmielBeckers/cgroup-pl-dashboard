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

export const PL_ROWS: PlRowDef[] = [
  // ── Operating Revenue ────────────────────────────────────────────────────
  { key: 'rev_header', label: 'Operating Revenue', indent: 0, rowType: 'section', kind: 'revenue', showWhen: 'always' },
  { key: 'revenue_rooms', label: 'Rooms', indent: 1, rowType: 'line', kind: 'revenue', field: 'revenue_rooms', showWhen: 'hotel' },
  { key: 'revenue_food', label: 'Food', indent: 1, rowType: 'line', kind: 'revenue', field: 'revenue_food', showWhen: 'always' },
  { key: 'revenue_beverage', label: 'Beverage', indent: 1, rowType: 'line', kind: 'revenue', field: 'revenue_beverage', showWhen: 'always' },
  { key: 'revenue_other_operated_depts', label: 'Other Operated Departments', indent: 1, rowType: 'line', kind: 'revenue', field: 'revenue_other_operated_depts', showWhen: 'nonzero' },
  { key: 'revenue_misc_income', label: 'Miscellaneous Income', indent: 1, rowType: 'line', kind: 'revenue', field: 'revenue_misc_income', showWhen: 'nonzero' },
  { key: 'total_revenue', label: 'Total Operating Revenue', indent: 0, rowType: 'subtotal', kind: 'revenue', field: 'total_operating_revenue', showWhen: 'always' },

  { key: 'sp1', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── Cost of Sales ────────────────────────────────────────────────────────
  { key: 'cos_header', label: 'Cost of Sales', indent: 0, rowType: 'section', kind: 'cost', showWhen: 'always' },
  { key: 'cogs_rooms', label: 'Cost of Rooms', indent: 1, rowType: 'line', kind: 'cost', field: 'cogs_rooms', showWhen: 'hotel', pctBase: 'revenue_rooms' },
  { key: 'cogs_food', label: 'Cost of Food', indent: 1, rowType: 'line', kind: 'cost', field: 'cogs_food', showWhen: 'always', pctBase: 'revenue_food' },
  { key: 'cogs_beverage', label: 'Cost of Beverage', indent: 1, rowType: 'line', kind: 'cost', field: 'cogs_beverage', showWhen: 'always', pctBase: 'revenue_beverage' },
  { key: 'cogs_other', label: 'Cost of Other Operated Departments', indent: 1, rowType: 'line', kind: 'cost', field: 'cogs_other_operated_depts', showWhen: 'nonzero', pctBase: 'revenue_other_operated_depts' },
  { key: 'total_cogs', label: 'Total Cost of Sales', indent: 0, rowType: 'subtotal', kind: 'cost', field: 'total_cogs', showWhen: 'always' },

  { key: 'sp2', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── Gross Profit ─────────────────────────────────────────────────────────
  { key: 'gross_profit', label: 'Gross Profit', indent: 0, rowType: 'total', kind: 'profit', field: 'gross_profit', showWhen: 'always' },

  { key: 'sp3', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── Labour (collapsed) ───────────────────────────────────────────────────
  { key: 'labour_header', label: 'Labour & Related Expenses', indent: 0, rowType: 'section', kind: 'cost', showWhen: 'always' },
  { key: 'labour_management', label: 'Management Salaries', indent: 1, rowType: 'line', kind: 'cost', field: 'labour_management', showWhen: 'always', collapseGroup: 'labour' },
  { key: 'labour_service', label: 'Service Staff', indent: 1, rowType: 'line', kind: 'cost', field: 'labour_service', showWhen: 'always', collapseGroup: 'labour' },
  { key: 'labour_kitchen', label: 'Kitchen Staff', indent: 1, rowType: 'line', kind: 'cost', field: 'labour_kitchen', showWhen: 'always', collapseGroup: 'labour' },
  { key: 'total_labour', label: 'Total Labour', indent: 0, rowType: 'subtotal', kind: 'cost', field: 'total_labour', showWhen: 'always' },

  { key: 'sp4', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── Other Expenses (collapsed) ───────────────────────────────────────────
  { key: 'other_exp_header', label: 'Other Expenses', indent: 0, rowType: 'section', kind: 'cost', showWhen: 'always' },
  { key: 'exp_banquet', label: 'Banquet Expenses', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_banquet', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_china', label: 'China', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_china', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_cleaning_supplies', label: 'Cleaning Supplies', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_cleaning_supplies', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_cluster_services', label: 'Cluster Services', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_cluster_services', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_commissions', label: 'Commissions', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_commissions', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_complimentary', label: 'Complimentary Services & Gifts', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_complimentary', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_contract_services', label: 'Contract Services', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_contract_services', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_corporate_office', label: 'Corporate Office Reimbursables', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_corporate_office', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_decorations', label: 'Decorations', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_decorations', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_dishwashing', label: 'Dishwashing Supplies', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_dishwashing', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_dues_subscriptions', label: 'Dues and Subscriptions', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_dues_subscriptions', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_entertainment_inhouse', label: 'Entertainment—In-House', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_entertainment_inhouse', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_equipment_rental', label: 'Equipment Rental', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_equipment_rental', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_flatware', label: 'Flatware', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_flatware', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_glassware', label: 'Glassware', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_glassware', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_ice', label: 'Ice', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_ice', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_kitchen_fuel', label: 'Kitchen Fuel', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_kitchen_fuel', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_kitchen_smallwares', label: 'Kitchen Smallwares', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_kitchen_smallwares', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_laundry', label: 'Laundry and Dry Cleaning', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_laundry', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_licenses', label: 'Licenses and Permits', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_licenses', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_linen', label: 'Linen', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_linen', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_menus', label: 'Menus and Beverage Lists', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_menus', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_miscellaneous', label: 'Miscellaneous', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_miscellaneous', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_music_entertainment', label: 'Music and Entertainment', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_music_entertainment', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_operating_supplies', label: 'Operating Supplies', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_operating_supplies', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_paper_plastics', label: 'Paper and Plastics', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_paper_plastics', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_postage', label: 'Postage and Overnight Delivery', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_postage', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_printing', label: 'Printing and Stationery', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_printing', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_reservations', label: 'Reservations', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_reservations', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_royalty_fees', label: 'Royalty Fees', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_royalty_fees', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_training', label: 'Training', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_training', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_travel_meals', label: 'Travel—Meals and Entertainment', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_travel_meals', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_travel_other', label: 'Travel—Other', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_travel_other', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_uniform_costs', label: 'Uniform Costs', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_uniform_costs', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_uniform_laundry', label: 'Uniform Laundry', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_uniform_laundry', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_utensils', label: 'Utensils', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_utensils', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_admin_general', label: 'Administrative and General', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_admin_general', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_it_systems', label: 'Information and Telecommunications Systems', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_it_systems', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_sales_marketing', label: 'Sales and Marketing', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_sales_marketing', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_property_maintenance', label: 'Property Operation and Maintenance', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_property_maintenance', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'exp_utilities', label: 'Utilities', indent: 1, rowType: 'line', kind: 'cost', field: 'exp_utilities', showWhen: 'nonzero', collapseGroup: 'other_expenses' },
  { key: 'total_other_expenses', label: 'Total Other Expenses', indent: 0, rowType: 'subtotal', kind: 'cost', field: 'total_other_expenses', showWhen: 'always' },

  { key: 'sp5', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── Gross Operating Profit ───────────────────────────────────────────────
  { key: 'gop', label: 'Gross Operating Profit (GOP)', indent: 0, rowType: 'total', kind: 'profit', field: 'gop', showWhen: 'always' },

  { key: 'sp6', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── Management Fees ──────────────────────────────────────────────────────
  { key: 'management_fees', label: 'Management Fees', indent: 1, rowType: 'line', kind: 'fee', field: 'management_fees', showWhen: 'nonzero' },

  // ── Income Before NOI ────────────────────────────────────────────────────
  { key: 'income_before_noi', label: 'Income Before Non-Operating Income & Expenses', indent: 0, rowType: 'subtotal', kind: 'profit', field: 'income_before_noi', showWhen: 'always' },

  { key: 'sp7', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── Non-Operating ────────────────────────────────────────────────────────
  { key: 'noi_header', label: 'Non-Operating Income and Expenses', indent: 0, rowType: 'section', kind: 'neutral', showWhen: 'always' },
  { key: 'nonop_rent', label: 'Rent', indent: 1, rowType: 'line', kind: 'cost', field: 'nonop_rent', showWhen: 'nonzero' },
  { key: 'nonop_taxes', label: 'Property and Other Taxes', indent: 1, rowType: 'line', kind: 'cost', field: 'nonop_taxes', showWhen: 'nonzero' },
  { key: 'nonop_insurance', label: 'Insurance', indent: 1, rowType: 'line', kind: 'cost', field: 'nonop_insurance', showWhen: 'nonzero' },
  { key: 'nonop_other', label: 'Other', indent: 1, rowType: 'line', kind: 'neutral', field: 'nonop_other', showWhen: 'nonzero' },
  { key: 'total_noi', label: 'Total Non-Operating', indent: 0, rowType: 'subtotal', kind: 'cost', field: 'total_noi', showWhen: 'always' },

  { key: 'sp8', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── EBITDA ───────────────────────────────────────────────────────────────
  { key: 'ebitda', label: 'EBITDA', indent: 0, rowType: 'total', kind: 'profit', field: 'ebitda', showWhen: 'always' },

  { key: 'sp9', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── Interest, Depreciation, Amortization ─────────────────────────────────
  { key: 'ida_header', label: 'Interest, Depreciation and Amortization', indent: 0, rowType: 'section', kind: 'neutral', showWhen: 'always' },
  { key: 'interest', label: 'Interest', indent: 1, rowType: 'line', kind: 'cost', field: 'interest', showWhen: 'nonzero' },
  { key: 'depreciation', label: 'Depreciation', indent: 1, rowType: 'line', kind: 'cost', field: 'depreciation', showWhen: 'nonzero' },
  { key: 'amortization', label: 'Amortization', indent: 1, rowType: 'line', kind: 'cost', field: 'amortization', showWhen: 'nonzero' },
  { key: 'total_ida', label: 'Total IDA', indent: 0, rowType: 'subtotal', kind: 'cost', field: 'total_ida', showWhen: 'always' },

  { key: 'sp10', label: '', indent: 0, rowType: 'spacer', kind: 'neutral', showWhen: 'always' },

  // ── Net Income ───────────────────────────────────────────────────────────
  { key: 'income_before_taxes', label: 'Income Before Income Taxes', indent: 0, rowType: 'subtotal', kind: 'profit', field: 'income_before_taxes', showWhen: 'always' },
  { key: 'income_taxes', label: 'Income Taxes', indent: 1, rowType: 'line', kind: 'cost', field: 'income_taxes', showWhen: 'nonzero' },
  { key: 'net_income', label: 'Net Income', indent: 0, rowType: 'total', kind: 'profit', field: 'net_income', showWhen: 'always' },
]
