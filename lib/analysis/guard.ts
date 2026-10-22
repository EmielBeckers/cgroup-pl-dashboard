// TypeScript pre-check for analysis-chat SQL. This layer exists for clear
// error messages back to the model; the REAL guarantee is in the database:
// run_analysis_query() drops to the analysis_reader role, which can only
// SELECT the allowlisted views (migration 2026-10-22_analysis_chat.sql).

export const ALLOWED_RELATIONS = [
  'pl_entity', 'pl_venue', 'pl_venue_month', 'pl_month', 'pl_hotel',
  'pl_exclusions', 'pl_dossiers', 'pl_venues', 'invoices', 'items',
  'item_prices', 'product_groups', 'product_group_items',
  // read-only RPCs, callable as FROM fn(...)
  'invoices_summary', 'pl_invoice_lines', 'pl_line_invoices',
  'pl_venue_line_invoices',
] as const

const BANNED = /\b(insert|update|delete|merge|truncate|alter|drop|create|grant|revoke|copy|call|do|vacuum|listen|notify|prepare|deallocate|lock|comment|set_config|pg_sleep|pg_read|pg_ls|dblink|lo_import|lo_export|pg_catalog|information_schema|pg_roles|pg_user|pg_shadow|pg_settings|pg_stat)\b/i

export function guardSql(raw: string): { ok: true; sql: string } | { ok: false; reason: string } {
  const sql = raw.trim().replace(/;\s*$/, '')
  if (!sql) return { ok: false, reason: 'lege query' }
  if (sql.length > 5000) return { ok: false, reason: 'query te lang (max 5000 tekens)' }
  if (!/^(select|with)\b/i.test(sql)) return { ok: false, reason: 'alleen SELECT-query’s zijn toegestaan' }
  if (sql.includes(';')) return { ok: false, reason: 'één statement per query (geen puntkomma)' }
  if (BANNED.test(sql)) {
    return { ok: false, reason: 'query bevat een niet-toegestane constructie (schrijfoperatie of systeemobject)' }
  }
  if (/\bset\s+(role|session)\b/i.test(sql)) {
    return { ok: false, reason: 'query bevat een niet-toegestane constructie' }
  }

  // every FROM/JOIN target must be an allowlisted view/RPC, a subquery,
  // or a CTE defined in the query itself. The FROM inside
  // extract/substring/trim/overlay/position is SQL syntax, not a relation
  // reference — neutralize it before scanning (gate-c run caught this).
  const scanSql = sql.replace(
    /\b(extract|substring|trim|overlay|position)\s*\(([^()]*)\bfrom\b/gi,
    (_m, fn, inner) => `${fn}(${inner} `,
  )
  const cteNames = new Set<string>()
  for (const m of sql.matchAll(/\b(\w+)\s+as\s*\(/gi)) cteNames.add(m[1].toLowerCase())
  const allowed = new Set<string>(ALLOWED_RELATIONS)
  for (const m of scanSql.matchAll(/\b(?:from|join)\s+(?:public\.)?([a-z_][a-z0-9_.]*)/gi)) {
    const target = m[1].toLowerCase().replace(/^public\./, '')
    if (allowed.has(target) || cteNames.has(target)) continue
    if (target.includes('.')) {
      return { ok: false, reason: `schema-gekwalificeerde toegang tot "${m[1]}" is niet toegestaan` }
    }
    return {
      ok: false,
      reason: `"${m[1]}" is geen toegestane view. Toegestaan: ${ALLOWED_RELATIONS.join(', ')}`,
    }
  }
  return { ok: true, sql }
}
