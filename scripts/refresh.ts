/**
 * C.Group P&L Dashboard — Nightly Refresh Script
 *
 * Runs via GitHub Actions every night at 02:00 Brussels time.
 * Refreshes only the CURRENT MONTH's P&L snapshot for each venue.
 *
 * While Adsolut API is inactive: generates fresh mock data for this month.
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

function generateMockMonth(baseRevenue: number, month: number, venueName: string) {
  const sf = venueName === 'PLAGE ODETTE' ? PLAGE_SEASON[month] : SEASON[month]
  if (sf === 0) return null

  const total = jitter(baseRevenue * sf)
  const revFood = round2(total * jitter(0.60))
  const revBev  = round2(total * jitter(0.30))
  const revOther = round2(Math.max(0, total - revFood - revBev))
  const labour = total * jitter(0.34)
  const overhead = total * jitter(0.22)

  return {
    revenue_food:       revFood,
    revenue_beverage:   revBev,
    revenue_other:      revOther,
    cogs_food:          round2(revFood * jitter(0.30)),
    cogs_beverage:      round2(revBev  * jitter(0.22)),
    labour_management:  round2(labour * 0.18),
    labour_service:     round2(labour * 0.47),
    labour_kitchen:     round2(labour * 0.35),
    overhead_rent:      round2(overhead * 0.38),
    overhead_utilities: round2(overhead * 0.17),
    overhead_marketing: round2(overhead * 0.10),
    overhead_other:     round2(overhead * 0.35),
    data_source: 'mock' as const,
    refreshed_at: new Date().toISOString(),
  }
}

async function refresh() {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1

  console.log(`\n🔄  Nightly refresh — ${year}-${String(month).padStart(2,'0')}\n`)

  const { data: venues, error: vErr } = await supabase
    .from('venues')
    .select('id, name, company_id')
    .eq('is_active', true)

  if (vErr || !venues) {
    console.error('Failed to load venues:', vErr)
    process.exit(1)
  }

  // Base revenue per venue name (matches seed.ts)
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

  let updated = 0
  let skipped = 0

  for (const venue of venues) {
    const base = BASE[venue.name]
    if (!base) { skipped++; continue }

    const pl = generateMockMonth(base, month, venue.name)
    if (!pl) { skipped++; continue }   // venue closed this month

    const { error } = await supabase
      .from('pl_snapshots')
      .upsert({
        company_id:  venue.company_id,
        venue_id:    venue.id,
        period_year: year,
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
