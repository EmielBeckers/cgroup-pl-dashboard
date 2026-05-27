export type UserRole = 'board' | 'accounting' | 'manager'
export type VenueType = 'restaurant' | 'hotel' | 'bar' | 'other'
export type PosSystem = 'trivec' | 'lightspeed' | 'none'
export type DataSource = 'adsolut_live' | 'mock'
export type InvoiceStatus = 'pending' | 'paid' | 'overdue'

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

export interface PlSnapshot {
  id: string
  company_id: string
  venue_id: string | null
  period_year: number
  period_month: number
  // Revenue
  revenue_food: number
  revenue_beverage: number
  revenue_other: number
  // Cost of Sales
  cogs_food: number
  cogs_beverage: number
  // Labour
  labour_management: number
  labour_service: number
  labour_kitchen: number
  // Overhead
  overhead_rent: number
  overhead_utilities: number
  overhead_marketing: number
  overhead_other: number
  data_source: DataSource
  refreshed_at: string
  created_at: string
}

export interface PlDerived extends PlSnapshot {
  total_revenue: number
  total_cogs: number
  gross_profit: number
  total_labour: number
  total_overhead: number
  ebitda: number
  gross_margin_pct: number
  labour_pct: number
  ebitda_margin_pct: number
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
  amount_excl_vat: number
  vat_amount: number
  amount_incl_vat: number
  usali_category: string | null
  status: InvoiceStatus
  pdf_url: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
  company?: Company
  venue?: Venue
}
