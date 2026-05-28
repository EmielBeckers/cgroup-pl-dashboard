export type UserRole = 'board' | 'accounting' | 'manager'
export type VenueType = 'restaurant' | 'hotel' | 'bar' | 'other'
export type PosSystem = 'trivec' | 'lightspeed' | 'none'
export type DataSource = 'adsolut_live' | 'mock'
export type InvoiceStatus = 'pending' | 'paid' | 'overdue'
export type ReviewStatus = 'pending_ai' | 'pending_review' | 'auto_confirmed' | 'confirmed' | 'corrected'

export interface Company {
  id: string
  adsolut_id: string
  name: string
  display_name: string
  vat_number: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Venue {
  id: string
  company_id: string
  name: string
  type: VenueType
  pos_system: PosSystem
  is_active: boolean
  created_at: string
  updated_at: string
  company?: Company
}

export interface UserProfile {
  id: string
  role: UserRole
  full_name: string
  venue_ids: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

// Full USALI P&L snapshot — all raw columns from pl_snapshots
export interface PlSnapshot {
  id: string
  company_id: string
  venue_id: string | null
  period_year: number
  period_month: number

  // ── Operating Revenue ───────────────────────────────────
  revenue_rooms: number
  revenue_food: number
  revenue_beverage: number
  revenue_other_operated_depts: number
  revenue_misc_income: number
  // Legacy (kept for backwards compat, mapped to revenue_other_operated_depts)
  revenue_other: number

  // ── Cost of Sales ───────────────────────────────────────
  cogs_rooms: number
  cogs_food: number
  cogs_beverage: number
  cogs_other_operated_depts: number

  // ── Labour & Related Expenses (3 lines) ─────────────────
  labour_management: number
  labour_service: number
  labour_kitchen: number

  // ── Other Expenses (full USALI) ─────────────────────────
  exp_banquet: number
  exp_china: number
  exp_cleaning_supplies: number
  exp_cluster_services: number
  exp_commissions: number
  exp_complimentary: number
  exp_contract_services: number
  exp_corporate_office: number
  exp_decorations: number
  exp_dishwashing: number
  exp_dues_subscriptions: number
  exp_entertainment_inhouse: number
  exp_equipment_rental: number
  exp_flatware: number
  exp_glassware: number
  exp_ice: number
  exp_kitchen_fuel: number
  exp_kitchen_smallwares: number
  exp_laundry: number
  exp_licenses: number
  exp_linen: number
  exp_menus: number
  exp_miscellaneous: number
  exp_music_entertainment: number
  exp_operating_supplies: number
  exp_paper_plastics: number
  exp_postage: number
  exp_printing: number
  exp_reservations: number
  exp_royalty_fees: number
  exp_training: number
  exp_travel_meals: number
  exp_travel_other: number
  exp_uniform_costs: number
  exp_uniform_laundry: number
  exp_utensils: number
  exp_admin_general: number
  exp_it_systems: number
  exp_sales_marketing: number
  exp_property_maintenance: number
  exp_utilities: number

  // ── Legacy overhead (kept, not used in new UI) ──────────
  overhead_rent: number
  overhead_utilities: number
  overhead_marketing: number
  overhead_other: number

  // ── Below GOP ───────────────────────────────────────────
  management_fees: number
  nonop_rent: number
  nonop_taxes: number
  nonop_insurance: number
  nonop_other: number
  interest: number
  depreciation: number
  amortization: number
  income_taxes: number

  data_source: DataSource
  refreshed_at: string
  created_at: string
}

// PlSnapshot + all computed totals
export interface PlFull extends PlSnapshot {
  total_operating_revenue: number
  total_cogs: number
  gross_profit: number
  total_labour: number
  total_other_expenses: number
  gop: number
  income_before_noi: number
  total_noi: number
  ebitda: number
  total_ida: number
  income_before_taxes: number
  net_income: number
  // margin helpers
  gross_margin_pct: number
  labour_pct: number
  gop_margin_pct: number
  ebitda_margin_pct: number
  net_margin_pct: number
}

export interface Invoice {
  id: string
  company_id: string
  venue_id: string | null
  adsolut_invoice_id: string | null
  invoice_number: string
  invoice_date: string
  due_date: string | null
  supplier_name: string
  description: string | null
  amount_excl_vat: number
  vat_amount: number
  amount_incl_vat: number
  usali_category: string | null
  status: InvoiceStatus
  pdf_url: string | null
  is_archived: boolean
  // AI categorisation
  ai_suggested_category: string | null
  ai_confidence: number | null
  ai_categorized_at: string | null
  review_status: ReviewStatus
  reviewed_by: string | null
  reviewed_at: string | null
  confirmed_category: string | null
  created_at: string
  updated_at: string
  company?: Company
  venue?: Venue
}
