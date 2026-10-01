import 'server-only'

import postgres from 'postgres'
import type { UserProfile } from '@/lib/types'
import type {
  AdoptionRow, CoverageRow, DiscountTx, PerVenueRow, StaffDiscountData,
  UnmappedShopRow, VenueHomeEntityRow,
} from '@/lib/staff-discount'

// Second, server-only data source: the SDWorx (HR) Supabase project.
//
// Users sign in against cgroup-pl, and SDWorx doesn't recognise that session,
// so this connects as the read-only Postgres role discount_dashboard_ro. It can
// SELECT the seven hr_sync.v_discount_* views and nothing else (no employee
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
    // One connection, queries run strictly one after another (see below).
    // The role's connection limit is 5.
    max: 1,
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
  const sql = db()

  // Sequential on purpose: firing these in parallel makes postgres.js pipeline
  // them over one connection, which hangs behind the transaction pooler
  // (verified 2026-10-01). Ten small queries take ~0.6 s in sequence.
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
  ] as const
  const results: unknown[] = []
  for (const q of queries) results.push(await q())
  const [adoption, violations, unresolved, perVenue, venueHome, recent, notCounted, unmapped, coverage, latest] =
    results as [AdoptionRow[], DiscountTx[], { n: number }[], PerVenueRow[], VenueHomeEntityRow[],
                DiscountTx[], { n: number }[], UnmappedShopRow[], CoverageRow[], { t: string | null }[]]

  return {
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
}
