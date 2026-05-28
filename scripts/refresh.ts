/**
 * C.Group P&L Dashboard — Nightly Refresh Script
 *
 * Runs via GitHub Actions every night at 02:00 Brussels time.
 * 1. Refreshes current month P&L for all venues (mock data; replace with Adsolut API when live)
 * 2. Calls the AI categorisation endpoint to process pending_ai invoices
 *
 * When Adsolut API is live: replace generateMockMonth() with a real API call.
 * See ../src/fetch_accounting.py for the existing Adsolut OAuth flow.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

function round2(n: number) { return Math.round(n * 100) / 100 }
function jitter(v: number, pct = 0.06) { return v * (1 + (Math.random() - 0.5) * 2 * pct) }

const SEASON: Record<number, number> = {
  1: 0.74, 2: 0.80, 3: 0.90, 4: 0.95, 5: 1.02, 6: 1.08,
  7: 1.05, 8: 0.98, 9: 1.05, 10: 1.00, 11: 1.06, 12: 1.22,
}
const PLAGE_SEASON: Record<number, number> = {
  1: 0, 2: 0, 3: 0, 4: 0.18, 5: 0.52, 6: 0.85,
  7: 1.30, 8: 1.35, 9: 0.72, 10: 0.20, 11: 0, 12: 0,
}

const EXP_DIST: Record<string, number> = {
  exp_cleaning_supplies: 0.045, exp_contract_services: 0.090, exp_dishwashing: 0.025,
  exp_dues_subscriptions: 0.010, exp_equipment_rental: 0.035, exp_kitchen_fuel: 0.020,
  exp_kitchen_smallwares: 0.015, exp_laundry: 0.065, exp_licenses: 0.010,
  exp_linen: 0.055, exp_menus: 0.012, exp_miscellaneous: 0.018,
  exp_music_entertainment: 0.025, exp_operating_supplies: 0.055, exp_paper_plastics: 0.030,
  exp_postage: 0.005, exp_printing: 0.012, exp_admin_general: 0.115,
  exp_it_systems: 0.040, exp_sales_marketing: 0.070, exp_property_maintenance: 0.100,
  exp_utilities: 0.150, exp_training: 0.018, exp_uniform_costs: 0.012,
  exp_uniform_laundry: 0.008, exp_glassware: 0.010, exp_china: 0.010,
  exp_flatware: 0.008, exp_utensils: 0.008,
}

const HOTEL_VENUES = new Set(['HASHOTEL', 'THE CENTURY'])

function generateMockMonth(baseRevenue: number, month: number, venueName: string) {
  const sf = venueName === 'PLAGE ODETTE' ? PLAGE_SEASON[month] : SEASON[month]
  if (sf === 0) return null

  const isHotel = HOTEL_VENUES.has(venueName)
  const total = jitter(baseRevenue * sf)

  let revRooms = 0, revFood = 0, revBev = 0, revOtherOps = 0, revMisc = 0
  if (isHotel) {
    revRooms    = round2(total * jitter(0.50))
    revFood     = round2(total * jitter(0.28))
    revBev      = round2(total * jitter(0.14))
    revOtherOps = round2(total * jitter(0.05))
    revMisc     = round2(Math.max(0, total - revRooms - revFood - revBev - revOtherOps))
  } else {
    revFood = round2(total * jitter(0.60))
    revBev  = round2(total * jitter(0.32))
    revMisc = round2(Math.max(0, total - revFood - revBev))
  }

  const labour  = total * jitter(0.34)
  const expPool = total * jitter(0.22)
  const expCols: Record<string, number> = {}
  for (const [col, share] of Object.entries(EXP_DIST)) {
    expCols[col] = round2(expPool * jitter(share, 0.20))
  }

  return {
    revenue_rooms:                revRooms,
    revenue_food:                 revFood,
    revenue_beverage:             revBev,
    revenue_other_operated_depts: revOtherOps,
    revenue_misc_income:          revMisc,
    revenue_other:                0,
    cogs_rooms:                   isHotel ? round2(revRooms * jitter(0.28)) : 0,
    cogs_food:                    round2(revFood * jitter(0.30)),
    cogs_beverage:                round2(revBev  * jitter(0.22)),
    cogs_other_operated_depts:    isHotel ? round2(revOtherOps * jitter(0.35)) : 0,
    labour_management:            round2(labour * 0.18),
    labour_service:               round2(labour * 0.47),
    labour_kitchen:               round2(labour * 0.35),
    ...expCols,
    overhead_rent: 0, overhead_utilities: 0, overhead_marketing: 0, overhead_other: 0,
    management_fees:    round2(total * jitter(0.02, 0.10)),
    nonop_rent:         round2(total * jitter(0.04)),
    nonop_taxes:        round2(total * jitter(0.005)),
    nonop_insurance:    round2(total * jitter(0.008)),
    nonop_other:        round2(total * jitter(0.003)),
    interest:           isHotel ? round2(total * jitter(0.015)) : 0,
    depreciation:       round2(total * jitter(0.018)),
    amortization:       round2(total * jitter(0.004)),
    income_taxes:       round2(total * jitter(0.01)),
    data_source: 'mock' as const,
    refreshed_at: new Date().toISOString(),
  }
}

const BASE: Record<string, number> = {
  'HASHOTEL': 180000, 'BRAGOÛT': 85000, 'THE CENTURY': 220000,
  'MIA MENSA': 55000, 'HET CORDAAT': 70000, 'CORDA.BAR': 42000,
  'CORDA.CUISINE': 95000, 'ODIEL BISTRONOMIE': 78000, 'ATELIER V': 62000,
  'TRENTANOVE': 105000, 'MAISON MATHIS': 118000, 'TERLAND': 52000,
  'VANHARTE': 68000, 'DE COMMANDEUR': 74000, 'C.BAR': 58000,
  'BAR BOUFFE JESSA': 48000, 'BAR BOUFFE ZOL': 45000,
  'BAR BOUFFE ST-BARBARA': 40000, 'BAR BOUFFE ZMK': 38000,
  'BAR BOUFFE TRUDO': 42000, "THE ALLEY'S": 72000, 'PLAGE ODETTE': 120000,
}

async function refresh() {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1

  console.log(`\n🔄  Nightly refresh — ${year}-${String(month).padStart(2, '0')}\n`)

  const { data: venues, error: vErr } = await supabase
    .from('venues')
    .select('id, name, company_id')
    .eq('is_active', true)

  if (vErr || !venues) {
    console.error('Failed to load venues:', vErr)
    process.exit(1)
  }

  let updated = 0
  let skipped = 0

  for (const venue of venues) {
    const base = BASE[venue.name]
    if (!base) { skipped++; continue }

    const pl = generateMockMonth(base, month, venue.name)
    if (!pl) { skipped++; continue }

    const { error } = await supabase
      .from('pl_snapshots')
      .upsert({
        company_id:   venue.company_id,
        venue_id:     venue.id,
        period_year:  year,
        period_month: month,
        ...pl,
      }, { onConflict: 'company_id,venue_id,period_year,period_month' } as { onConflict: string })

    if (error) {
      console.error(`  ✗  ${venue.name}:`, error.message)
    } else {
      console.log(`  ✓  ${venue.name}`)
      updated++
    }
  }

  // Call AI categorisation for new pending invoices
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('\n🤖  Running AI invoice categorisation…')
    try {
      const res = await fetch(`${SITE_URL}/api/categorize-invoices?limit=100`, { method: 'POST' })
      const json = await res.json() as { processed: number; autoConfirmed: number; pendingReview: number }
      console.log(`  ✓  ${json.processed} processed, ${json.autoConfirmed} auto-confirmed, ${json.pendingReview} pending review`)
    } catch (err) {
      console.warn('  ⚠  AI categorisation failed:', err)
    }
  } else {
    console.log('\n⚠  ANTHROPIC_API_KEY not set — skipping AI categorisation')
  }

  // Log the run
  await supabase.from('refresh_log').insert({
    status: 'success',
    records_fetched: updated,
  })

  console.log(`\nDone. Updated: ${updated}, skipped: ${skipped}`)
}

refresh().catch(async (err) => {
  console.error('Refresh failed:', err)
  await supabase.from('refresh_log').insert({
    status: 'failed',
    error_message: String(err),
    records_fetched: 0,
  })
  process.exit(1)
})
