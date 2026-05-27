/**
 * C.Group P&L Dashboard — Mock Data Seed Script
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local
 *
 * This script populates Supabase with realistic mock P&L data
 * for all C.Group companies and venues, covering Jan 2024 – May 2025.
 * When the Adsolut API is activated, replace this script's refresh logic
 * with real API calls (see src/fetch_accounting.py for the OAuth flow).
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// ── MASTER DATA ───────────────────────────────────────────────────────────────

const COMPANIES = [
  { adsolut_id: 'f1195bc0-9eb3-43f8-9106-1e2211e9b64c', name: 'C.Group', display_name: 'C.Group', vat: 'BE0888246717' },
  { adsolut_id: 'cc71a9c5-54ad-4d7e-a8e0-f429dcf370d0', name: 'C. Construx', display_name: 'C. Construx', vat: 'BE0832673635' },
  { adsolut_id: '86122b8b-ed6b-4e3a-9485-2b063ed47a70', name: 'Century', display_name: 'Century', vat: 'BE0432276243' },
  { adsolut_id: '6bff204e-3f7c-4268-81ab-8df917603dc3', name: 'Green Valley Hospitality', display_name: 'Green Valley', vat: 'BE0762770683' },
  { adsolut_id: '86133332-ba53-473e-84fb-01ad70d173de', name: 'Blue Ocean Hospitality', display_name: 'Blue Ocean', vat: 'BE0737641844' },
  { adsolut_id: 'a15dd588-cdbd-45ea-8f5a-671d54f1b465', name: 'R&R FIN', display_name: 'R&R FIN', vat: 'BE0738952235' },
  { adsolut_id: 'f29982fb-160c-4b3a-8b17-553f5ad5f331', name: 'Customizze', display_name: 'Customizze', vat: 'BE0739578577' },
  { adsolut_id: '6a99ee7f-6078-46d1-a60c-cdf0361e686c', name: 'Mia Mensa', display_name: 'Mia Mensa', vat: 'BE0702979388' },
  { adsolut_id: '2efefa26-ab20-41fb-af3d-478af6652bbb', name: 'C. Corda', display_name: 'C. Corda', vat: 'BE0559919236' },
  { adsolut_id: 'ef5902d1-0e2d-46a0-ba3b-cfccbc32752a', name: 'HasHotel', display_name: 'HasHotel', vat: 'BE0464301980' },
  { adsolut_id: 'a3fc8e8b-7700-4304-be22-d7ae565dab04', name: 'C. Outdoor', display_name: 'C. Outdoor', vat: 'BE0831615741' },
]

// Venue definitions: mapped to their parent company by adsolut_id
// NOTE: Mapping is our best estimate — confirm with Emiel and adjust if needed
const VENUE_DEFS = [
  // HasHotel
  { companyAdsolutId: 'ef5902d1-0e2d-46a0-ba3b-cfccbc32752a', name: 'HASHOTEL', type: 'hotel' as const, pos: 'trivec' as const, baseRevenue: 180000 },
  { companyAdsolutId: 'ef5902d1-0e2d-46a0-ba3b-cfccbc32752a', name: 'BRAGOÛT', type: 'restaurant' as const, pos: 'lightspeed' as const, baseRevenue: 85000 },
  // Century
  { companyAdsolutId: '86122b8b-ed6b-4e3a-9485-2b063ed47a70', name: 'THE CENTURY', type: 'hotel' as const, pos: 'trivec' as const, baseRevenue: 220000 },
  // Mia Mensa
  { companyAdsolutId: '6a99ee7f-6078-46d1-a60c-cdf0361e686c', name: 'MIA MENSA', type: 'restaurant' as const, pos: 'trivec' as const, baseRevenue: 55000 },
  // C. Corda
  { companyAdsolutId: '2efefa26-ab20-41fb-af3d-478af6652bbb', name: 'HET CORDAAT', type: 'restaurant' as const, pos: 'trivec' as const, baseRevenue: 70000 },
  { companyAdsolutId: '2efefa26-ab20-41fb-af3d-478af6652bbb', name: 'CORDA.BAR', type: 'bar' as const, pos: 'trivec' as const, baseRevenue: 42000 },
  { companyAdsolutId: '2efefa26-ab20-41fb-af3d-478af6652bbb', name: 'CORDA.CUISINE', type: 'restaurant' as const, pos: 'trivec' as const, baseRevenue: 95000 },
  // Green Valley Hospitality
  { companyAdsolutId: '6bff204e-3f7c-4268-81ab-8df917603dc3', name: 'ODIEL BISTRONOMIE', type: 'restaurant' as const, pos: 'trivec' as const, baseRevenue: 78000 },
  { companyAdsolutId: '6bff204e-3f7c-4268-81ab-8df917603dc3', name: 'ATELIER V', type: 'restaurant' as const, pos: 'trivec' as const, baseRevenue: 62000 },
  { companyAdsolutId: '6bff204e-3f7c-4268-81ab-8df917603dc3', name: 'TRENTANOVE', type: 'restaurant' as const, pos: 'trivec' as const, baseRevenue: 105000 },
  { companyAdsolutId: '6bff204e-3f7c-4268-81ab-8df917603dc3', name: 'MAISON MATHIS', type: 'restaurant' as const, pos: 'trivec' as const, baseRevenue: 118000 },
  { companyAdsolutId: '6bff204e-3f7c-4268-81ab-8df917603dc3', name: 'TERLAND', type: 'restaurant' as const, pos: 'trivec' as const, baseRevenue: 52000 },
  { companyAdsolutId: '6bff204e-3f7c-4268-81ab-8df917603dc3', name: 'VANHARTE', type: 'restaurant' as const, pos: 'trivec' as const, baseRevenue: 68000 },
  { companyAdsolutId: '6bff204e-3f7c-4268-81ab-8df917603dc3', name: 'DE COMMANDEUR', type: 'restaurant' as const, pos: 'trivec' as const, baseRevenue: 74000 },
  // Blue Ocean Hospitality
  { companyAdsolutId: '86133332-ba53-473e-84fb-01ad70d173de', name: 'C.BAR', type: 'bar' as const, pos: 'trivec' as const, baseRevenue: 58000 },
  { companyAdsolutId: '86133332-ba53-473e-84fb-01ad70d173de', name: 'BAR BOUFFE JESSA', type: 'restaurant' as const, pos: 'trivec' as const, baseRevenue: 48000 },
  { companyAdsolutId: '86133332-ba53-473e-84fb-01ad70d173de', name: 'BAR BOUFFE ZOL', type: 'restaurant' as const, pos: 'trivec' as const, baseRevenue: 45000 },
  { companyAdsolutId: '86133332-ba53-473e-84fb-01ad70d173de', name: 'BAR BOUFFE ST-BARBARA', type: 'restaurant' as const, pos: 'trivec' as const, baseRevenue: 40000 },
  { companyAdsolutId: '86133332-ba53-473e-84fb-01ad70d173de', name: 'BAR BOUFFE ZMK', type: 'restaurant' as const, pos: 'trivec' as const, baseRevenue: 38000 },
  { companyAdsolutId: '86133332-ba53-473e-84fb-01ad70d173de', name: 'BAR BOUFFE TRUDO', type: 'restaurant' as const, pos: 'trivec' as const, baseRevenue: 42000 },
  { companyAdsolutId: '86133332-ba53-473e-84fb-01ad70d173de', name: 'THE ALLEY\'S', type: 'restaurant' as const, pos: 'trivec' as const, baseRevenue: 72000 },
  // C. Outdoor
  { companyAdsolutId: 'a3fc8e8b-7700-4304-be22-d7ae565dab04', name: 'PLAGE ODETTE', type: 'restaurant' as const, pos: 'trivec' as const, baseRevenue: 120000 },
]

// Monthly seasonality index (1.0 = average month)
const SEASON: Record<number, number> = {
  1: 0.74, 2: 0.80, 3: 0.90,
  4: 0.95, 5: 1.02, 6: 1.08,
  7: 1.05, 8: 0.98, 9: 1.05,
  10: 1.00, 11: 1.06, 12: 1.22,
}

// PLAGE ODETTE is seasonal — closed Nov-Mar
const PLAGE_SEASON: Record<number, number> = {
  1: 0, 2: 0, 3: 0,
  4: 0.18, 5: 0.52, 6: 0.85,
  7: 1.30, 8: 1.35, 9: 0.72,
  10: 0.20, 11: 0, 12: 0,
}

const MOCK_SUPPLIERS = [
  'Sligro Belgium', 'Bidfood België', 'Metro Cash & Carry', 'Horeca Totaal',
  'Belfius Lease', 'Fluvius', 'Proximus', 'Sodastream Pro', 'Van Marcke',
  'Lyreco Office', 'PG&D Cleaning', 'Ecolab Hygiene', 'Securitas',
  'Van Hool Transport', 'Torfs Accountancy', 'SD Worx HR Services',
  'Vlam Promotions', 'Unilin Flooring', 'Winterthur Insurance',
]

const USALI_CATEGORIES = [
  'Food & Beverage Supplies', 'Utilities', 'Rent & Occupancy',
  'Repairs & Maintenance', 'Marketing & Promotions', 'Cleaning & Linen',
  'Insurance', 'IT & Communications', 'HR & Payroll Services', 'Other Operating',
]

// ── HELPERS ───────────────────────────────────────────────────────────────────

function jitter(value: number, pct = 0.06): number {
  return value * (1 + (Math.random() - 0.5) * 2 * pct)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function buildPlRow(
  companyId: string,
  venueId: string | null,
  year: number,
  month: number,
  baseRevenue: number,
  seasonFactor: number
) {
  const totalRev = jitter(baseRevenue * seasonFactor)

  // USALI revenue split
  const revFood = round2(totalRev * jitter(0.60))
  const revBev  = round2(totalRev * jitter(0.30))
  const revOther = round2(Math.max(0, totalRev - revFood - revBev))

  // Cost of sales
  const cogsFood = round2(revFood * jitter(0.30))   // ~30% food cost
  const cogsBev  = round2(revBev  * jitter(0.22))   // ~22% beverage cost

  // Labour (~34% total revenue)
  const totalLabour = totalRev * jitter(0.34)
  const labMgmt   = round2(totalLabour * 0.18)
  const labService = round2(totalLabour * 0.47)
  const labKitchen = round2(totalLabour - labMgmt - labService)

  // Overhead
  const overhead = totalRev * jitter(0.22)
  const ovRent   = round2(overhead * 0.38)
  const ovUtil   = round2(overhead * 0.17)
  const ovMktg   = round2(overhead * 0.10)
  const ovOther  = round2(overhead - ovRent - ovUtil - ovMktg)

  return {
    company_id: companyId,
    venue_id: venueId,
    period_year: year,
    period_month: month,
    revenue_food:       revFood,
    revenue_beverage:   revBev,
    revenue_other:      revOther,
    cogs_food:          cogsFood,
    cogs_beverage:      cogsBev,
    labour_management:  labMgmt,
    labour_service:     labService,
    labour_kitchen:     labKitchen,
    overhead_rent:      ovRent,
    overhead_utilities: ovUtil,
    overhead_marketing: ovMktg,
    overhead_other:     ovOther,
    data_source: 'mock' as const,
    refreshed_at: new Date().toISOString(),
  }
}

function buildInvoices(
  companyId: string,
  venueId: string | null,
  year: number,
  month: number,
  count: number
) {
  const invoices = []
  for (let i = 0; i < count; i++) {
    const day = Math.floor(Math.random() * 28) + 1
    const invoiceDate = new Date(year, month - 1, day)
    const dueDate = new Date(invoiceDate)
    dueDate.setDate(dueDate.getDate() + 30)

    const exclVat = round2(Math.random() * 4500 + 300)
    const vatRate = [0.06, 0.12, 0.21][Math.floor(Math.random() * 3)]
    const vatAmt  = round2(exclVat * vatRate)

    const daysAgo = (Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    const status: 'paid' | 'pending' | 'overdue' =
      daysAgo > 0 && Math.random() > 0.85 ? 'overdue'
      : daysAgo > 0 ? 'paid'
      : 'pending'

    const num = `INV-${year}${String(month).padStart(2,'0')}-${String(i + 1).padStart(3,'0')}`
    invoices.push({
      company_id:         companyId,
      venue_id:           venueId,
      invoice_number:     num,
      invoice_date:       invoiceDate.toISOString().split('T')[0],
      due_date:           dueDate.toISOString().split('T')[0],
      supplier_name:      MOCK_SUPPLIERS[Math.floor(Math.random() * MOCK_SUPPLIERS.length)],
      amount_excl_vat:    exclVat,
      vat_amount:         vatAmt,
      amount_incl_vat:    round2(exclVat + vatAmt),
      usali_category:     USALI_CATEGORIES[Math.floor(Math.random() * USALI_CATEGORIES.length)],
      status,
      pdf_url:            null,
      is_archived:        false,
    })
  }
  return invoices
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱  C.Group mock data seed starting…\n')

  // 1. Insert companies
  console.log('Inserting companies…')
  const { data: insertedCompanies, error: compErr } = await supabase
    .from('companies')
    .upsert(
      COMPANIES.map(c => ({
        adsolut_id:   c.adsolut_id,
        name:         c.name,
        display_name: c.display_name,
        vat_number:   c.vat,
        is_active:    true,
      })),
      { onConflict: 'adsolut_id' }
    )
    .select()

  if (compErr) { console.error('Companies error:', compErr); process.exit(1) }
  console.log(`  ✓  ${insertedCompanies!.length} companies`)

  const companyMap = new Map(insertedCompanies!.map((c: { adsolut_id: string; id: string }) => [c.adsolut_id, c.id]))

  // 2. Insert venues
  console.log('Inserting venues…')
  const venueRows = VENUE_DEFS.map(v => ({
    company_id: companyMap.get(v.companyAdsolutId)!,
    name:       v.name,
    type:       v.type,
    pos_system: v.pos,
    is_active:  true,
  }))

  let venueResult: { name: string; id: string; company_id: string }[] = []

  const { data: upsertedVenues, error: venErr } = await supabase
    .from('venues')
    .upsert(venueRows, { onConflict: 'company_id,name' } as { onConflict: string })
    .select()

  if (venErr) {
    // Fallback: delete & re-insert if upsert constraint doesn't exist yet
    await supabase.from('venues').delete().not('id', 'is', null)
    const { data: iv2, error: e2 } = await supabase.from('venues').insert(venueRows).select()
    if (e2) { console.error('Venues error:', e2); process.exit(1) }
    venueResult = iv2 ?? []
    console.log(`  ✓  ${venueResult.length} venues (fresh insert)`)
  } else {
    venueResult = upsertedVenues ?? []
    console.log(`  ✓  ${venueResult.length} venues`)
  }

  const venueMap = new Map(
    venueResult.map(v => [`${v.company_id}::${v.name}`, v.id])
  )

  // 3. Generate P&L snapshots for Jan 2024 – May 2025
  const months: Array<{ year: number; month: number }> = []
  for (let y = 2024; y <= 2025; y++) {
    const maxMonth = y === 2025 ? 5 : 12
    for (let m = 1; m <= maxMonth; m++) {
      months.push({ year: y, month: m })
    }
  }

  console.log(`\nGenerating P&L snapshots for ${months.length} months…`)

  const plRows = []
  const invoiceRows = []

  for (const venueDef of VENUE_DEFS) {
    const companyId = companyMap.get(venueDef.companyAdsolutId)!
    const venueId   = venueMap.get(`${companyId}::${venueDef.name}`) ?? null

    for (const { year, month } of months) {
      const isSeasonal = venueDef.name === 'PLAGE ODETTE'
      const sf = isSeasonal ? PLAGE_SEASON[month] : SEASON[month]

      if (sf === 0) continue   // venue closed this month

      plRows.push(buildPlRow(companyId, venueId, year, month, venueDef.baseRevenue, sf))

      // 3–8 invoices per venue per month
      const invoiceCount = Math.floor(Math.random() * 6) + 3
      invoiceRows.push(...buildInvoices(companyId, venueId, year, month, invoiceCount))
    }
  }

  // Batch upsert P&L snapshots
  console.log(`  Upserting ${plRows.length} P&L rows…`)
  for (let i = 0; i < plRows.length; i += 200) {
    const batch = plRows.slice(i, i + 200)
    const { error } = await supabase
      .from('pl_snapshots')
      .upsert(batch, { onConflict: 'company_id,venue_id,period_year,period_month' } as { onConflict: string })
    if (error) { console.error('P&L batch error:', error); process.exit(1) }
    process.stdout.write(`\r  ✓  ${Math.min(i + 200, plRows.length)} / ${plRows.length}`)
  }
  console.log()

  // Batch insert invoices (delete existing mock first to avoid duplicates)
  console.log(`  Inserting ${invoiceRows.length} invoices…`)
  await supabase.from('invoices').delete().not('id', 'is', null)
  for (let i = 0; i < invoiceRows.length; i += 200) {
    const batch = invoiceRows.slice(i, i + 200)
    const { error } = await supabase.from('invoices').insert(batch)
    if (error) { console.error('Invoice batch error:', error); process.exit(1) }
    process.stdout.write(`\r  ✓  ${Math.min(i + 200, invoiceRows.length)} / ${invoiceRows.length}`)
  }
  console.log()

  console.log('\n✅  Seed complete.')
  console.log('   Companies:', insertedCompanies!.length)
  console.log('   Venues:   ', venueResult.length)
  console.log('   P&L rows: ', plRows.length)
  console.log('   Invoices: ', invoiceRows.length)
}

seed().catch(err => { console.error(err); process.exit(1) })
