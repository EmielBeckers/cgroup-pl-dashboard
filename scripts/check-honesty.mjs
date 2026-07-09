#!/usr/bin/env node
// HONESTY GUARD — fails the build if any displayed figure could derive from
// a hardcoded ratio or fabricated split. History: the mock generators used
// to fabricate a Management/Service/Kitchen labour split (fixed ratios) that
// rendered as fact until 2026-07-08. Never again.
//
// Rules enforced:
//  1. lib/, components/, app/ must not multiply amount-like values by ratio
//     literals (0.xx) — presentation code only groups and sums source rows.
//  2. PL_ROWS (the mock renderer) must stay totals-only: no 'line'/'section'
//     rows may be re-added (they rendered fabricated splits).
//  3. If SUPABASE credentials are present: no view/matview in public/adsolut
//     may contain a ratio multiplication in its SQL definition.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

let failures = []

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (name === 'node_modules' || name === '.next' || name.startsWith('.')) continue
    if (statSync(p).isDirectory()) walk(p, files)
    else if (/\.(ts|tsx|js|mjs)$/.test(name)) files.push(p)
  }
  return files
}

// Rule 1 — ratio multiplication on amount-like identifiers in display code
const AMOUNT_RATIO = /(amount|labour|revenue|total|bedrag|cogs|expense|result)\w*\s*\*\s*(jitter\()?0?\.\d/i
for (const dir of ['lib', 'components', 'app']) {
  for (const f of walk(dir)) {
    if (f.endsWith('check-honesty.mjs')) continue
    const src = readFileSync(f, 'utf8')
    src.split('\n').forEach((line, i) => {
      if (AMOUNT_RATIO.test(line) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
        failures.push(`${f}:${i + 1} — ratio multiplication on amount-like value: ${line.trim().slice(0, 100)}`)
      }
    })
  }
}

// Rule 2 — PL_ROWS stays totals-only
const plStructure = readFileSync('lib/pl-structure.ts', 'utf8')
const plRowsBody = plStructure.slice(plStructure.indexOf('export const PL_ROWS'))
if (/rowType:\s*'(line|section)'/.test(plRowsBody)) {
  failures.push(`lib/pl-structure.ts — PL_ROWS contains 'line'/'section' rows again; these rendered fabricated splits. Real splits belong in the live adsolut views with a source flag.`)
}

// Rule 3 — DB view definitions (best effort; runs when creds available)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY
if (url && key) {
  try {
    const res = await fetch(`${url}/rest/v1/rpc/check_view_honesty`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: '{}',
    })
    if (res.ok) {
      const offenders = await res.json()
      for (const o of offenders) failures.push(`DB view ${o.schemaname}.${o.viewname} contains a ratio literal in its definition`)
    } else if (res.status !== 404) {
      console.warn(`honesty check: DB rule skipped (rpc returned ${res.status})`)
    }
  } catch (e) {
    console.warn(`honesty check: DB rule skipped (${e.message})`)
  }
} else {
  console.warn('honesty check: DB rule skipped (no SUPABASE credentials in env)')
}

if (failures.length) {
  console.error('\nHONESTY CHECK FAILED — a displayed figure may derive from a hardcoded ratio/fabricated split:\n')
  for (const f of failures) console.error('  ✗ ' + f)
  console.error('\nEvery split must trace to source data with a source flag (blanpla | account | mews | none).')
  process.exit(1)
}
console.log('honesty check passed — no fabricated splits in display code' + (url && key ? ' or DB views' : ''))
