import 'server-only'

import postgres from 'postgres'
import type { UserProfile } from '@/lib/types'
import type {
  AdoptionRow, ColleagueRow, CoverageRow, DiscountKpis, DiscountTx, PerVenueRow,
  StaffDiscountData, UnmappedShopRow, VenueHomeEntityRow,
} from '@/lib/staff-discount'

// Second, server-only data source: the SDWorx (HR) Supabase project.
//
// Users sign in against cgroup-pl, and SDWorx doesn't recognise that session,
// so this connects as the read-only Postgres role discount_dashboard_ro. It can
// SELECT the hr_sync.v_discount_* views and nothing else (no employee
// table, no writes). The BOARD-ONLY rule is therefore enforced here and in the
// page, not by SDWorx: getStaffDiscountData() refuses any other role.
//
// SDWORX_DISCOUNT_DB_URL is never NEXT_PUBLIC_ and this module imports
// 'server-only', so importing it from a client component fails the build.

let client: postgres.Sql | undefined

function db(): postgres.Sql {
  if (client) return client
  const url = process.env.SDWORX_DISCOUNT_DB_URL
  if (!url) throw new Error('SDWORX_DISCOUNT_DB_URL is not set')
  client = postgres(url, {
    // Supabase's transaction pooler (PgBouncer-style, port 6543) does not
    // support prepared statements, so turn them off explicitly.
    prepare: false,
    // Each request holds one connection for its read-only transaction (see
    // below); two lets two page loads run side by side. Role limit is 5.
    max: 2,
    idle_timeout: 20,
    connect_timeout: 10,
  })
  return client
}

// Timestamps are formatted as Brussels wall-clock text inside SQL, so no Date
// objects (or the server's timezone) reach rendering.
export async function getStaffDiscountData(profile: Pick<UserProfile, 'role'> | null): Promise<StaffDiscountData> {
  if (profile?.role !== 'board') {
    throw new Error('staff-discount data is board-only')
  }
  // One read-only transaction per request, queries strictly in sequence.
  // postgres.js pipelines queries that share a connection, and pipelining
  // hangs behind Supabase's transaction pooler. That happened both with
  // Promise.all inside one request AND with two overlapping page loads on the
  // shared pool (verified 2026-10-01). A transaction reserves its connection,
  // so nothing else can pipeline onto it; it also gives every figure on the
  // page the same snapshot.
  return db().begin('isolation level repeatable read read only', async sql => {
    const queries = [
        () => sql<AdoptionRow[]>`
          select week_start::text, iso_week, employer_code,
                 eligible_count::int, used_cumulative_count::int, used_in_week_count::int,
                 used_cumulative_pct::float8 as used_cumulative_pct
          from hr_sync.v_discount_adoption
          order by week_start, employer_code`,
        () => sql<DiscountTx[]>`
          select uuid::text, to_char(created_at at time zone 'Europe/Brussels', 'YYYY-MM-DD HH24:MI') as local_time, use_date::text, employee_name,
                 home_employer_codes, venue_group, venue_employer_code,
                 ticket_as_posted::float8 as ticket_as_posted
          from hr_sync.v_discount_rule_violations
          order by created_at desc`,
        () => sql<{ n: number }[]>`
          select count(*)::int as n
          from hr_sync.v_discount_transactions
          where is_use and is_own_entity is null`,
        () => sql<PerVenueRow[]>`
          select shop_uuid::text, venue_group, venue_employer_code, unmapped,
                 uses_total::int, colleagues_total::int, uses_30d::int, colleagues_30d::int,
                 to_char(last_use_at at time zone 'Europe/Brussels', 'YYYY-MM-DD HH24:MI') as last_use
          from hr_sync.v_discount_per_venue
          order by uses_total desc, venue_group`,
        () => sql<VenueHomeEntityRow[]>`
          select shop_uuid::text, home_employer_code, uses::int, colleagues::int
          from hr_sync.v_discount_venue_home_entities
          order by shop_uuid, uses desc`,
        () => sql<DiscountTx[]>`
          select uuid::text, to_char(created_at at time zone 'Europe/Brussels', 'YYYY-MM-DD HH24:MI') as local_time, use_date::text, employee_name,
                 home_employer_codes, venue_group, venue_employer_code,
                 ticket_as_posted::float8 as ticket_as_posted
          from hr_sync.v_discount_transactions
          where is_use
            and use_date > (now() at time zone 'Europe/Brussels')::date - 30
          order by created_at desc`,
        () => sql<{ n: number }[]>`
          select count(*)::int as n
          from hr_sync.v_discount_transactions
          where row_role in ('reversed_use', 'pre_launch_reward')
            and use_date > (now() at time zone 'Europe/Brussels')::date - 30`,
        () => sql<UnmappedShopRow[]>`
          select shop_uuid::text, shop_name, transactions::int, uses::int
          from hr_sync.v_discount_unmapped_shops
          order by shop_name`,
        () => sql<CoverageRow[]>`
          select venue_name, employer_code, venue_group, status
          from hr_sync.v_discount_venue_coverage
          where status <> 'connected'
          order by venue_name`,
        () => sql<{ t: string | null }[]>`
          select to_char(max(created_at) at time zone 'Europe/Brussels', 'YYYY-MM-DD HH24:MI') as t
          from hr_sync.v_discount_transactions`,
        () => sql<DiscountKpis[]>`
          select uses_total::int, uses_30d::int, colleagues_total::int, colleagues_30d::int,
                 paid_total::float8 as paid_total, paid_30d::float8 as paid_30d,
                 eligible_count::int, adopted_total::int, adopted_30d::int
          from hr_sync.v_discount_kpis`,
        () => sql<ColleagueRow[]>`
          select contact_uuid, employee_name, home_employer_codes, uses::int,
                 total_paid::float8 as total_paid, uses_with_amount::int,
                 to_char(first_use at time zone 'Europe/Brussels', 'YYYY-MM-DD HH24:MI') as first_use,
                 to_char(last_use at time zone 'Europe/Brussels', 'YYYY-MM-DD HH24:MI') as last_use
          from hr_sync.v_discount_per_colleague
          order by uses desc, total_paid desc nulls last`,
    ] as const
    const results: unknown[] = []
    for (const q of queries) results.push(await q())
    const [adoption, violations, unresolved, perVenue, venueHome, recent, notCounted, unmapped, coverage, latest, kpis, colleagues] =
      results as [AdoptionRow[], DiscountTx[], { n: number }[], PerVenueRow[], VenueHomeEntityRow[],
                  DiscountTx[], { n: number }[], UnmappedShopRow[], CoverageRow[], { t: string | null }[],
                  DiscountKpis[], ColleagueRow[]]
    if (!kpis[0]) throw new Error('v_discount_kpis returned no row')

    return {
      kpis: kpis[0],
      colleagues: [...colleagues],
      adoption: [...adoption],
      violations: [...violations],
      unresolvedUses: unresolved[0]?.n ?? 0,
      perVenue: [...perVenue],
      venueHomeEntities: [...venueHome],
      recent: [...recent],
      recentNotCounted: notCounted[0]?.n ?? 0,
      unmappedShops: [...unmapped],
      coverageGaps: [...coverage],
      latestTransaction: latest[0]?.t ?? null,
    }
  })
}
