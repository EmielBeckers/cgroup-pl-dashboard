// Gate (c)+(d) runner for the analysis chat. Uses the REAL system prompt,
// REAL TypeScript guard and the REAL run_analysis_query() DB path executed
// as the board user (JWT-claims simulation over psql via the VPS — the
// same mechanism PostgREST uses; only the transport differs from prod).
// Output: full transcripts to stdout (markdown).
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import Anthropic from '@anthropic-ai/sdk'
import { guardSql } from '../lib/analysis/guard'
import { buildSystemPrompt } from '../lib/analysis/prompt'

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n')
  .filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-5-5'
const SSH = ['-o', 'ConnectTimeout=15', 'root@167.233.224.143']

function dbExec(sql: string, uid: string): { ok: boolean; out: string } {
  const script = `cd /root/cgroup-adsolut-sync && set -a && . ./.env && set +a
PGPASSWORD="$SUPABASE_PASSWORD" psql -h "$SUPABASE_HOST" -p "\${SUPABASE_PORT:-5432}" -U "$SUPABASE_USER" -d "$SUPABASE_DB" -X -A -t <<'GATEEOF'
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"${uid}","role":"authenticated"}', true);
SELECT public.run_analysis_query($GATEQ$${sql}$GATEQ$);
ROLLBACK;
GATEEOF`
  const r = spawnSync('ssh', [...SSH, 'bash -s'], { input: script, encoding: 'utf8', timeout: 60000 })
  const out = (r.stdout ?? '') + (r.stderr ?? '')
  if (out.includes('ERROR')) return { ok: false, out: out.split('\n').find(l => l.includes('ERROR'))?.slice(0, 300) ?? 'ERROR' }
  const json = out.split('\n').find(l => l.trim().startsWith('{"rows"'))
  return json ? { ok: true, out: json.trim() } : { ok: false, out: 'geen resultaat: ' + out.slice(0, 200) }
}

const BOARD_UID = spawnSync('ssh', [...SSH,
  `cd /root/cgroup-adsolut-sync && set -a && . ./.env && set +a && PGPASSWORD="$SUPABASE_PASSWORD" psql -h "$SUPABASE_HOST" -p "\${SUPABASE_PORT:-5432}" -U "$SUPABASE_USER" -d "$SUPABASE_DB" -X -A -t -c "SELECT id FROM public.user_profiles WHERE role='board' AND is_active LIMIT 1;"`],
  { encoding: 'utf8', timeout: 30000 }).stdout.trim()

const now = new Date()
const lastFull = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 7)
const system = buildSystemPrompt(now.toISOString().slice(0, 10), lastFull)

const QUESTIONS: [string, string][] = [
  ['c1', 'Wat was de omzet per entiteit in 2025?'],
  ['c2', 'Hoe evolueert de F&B-omzet van Blue Ocean in 2026 per maand?'],
  ['c3 CAVEAT deelmaand', 'Vergelijk de groepsomzet van oktober 2026 met oktober 2025.'],
  ['c4 CAVEAT Century', 'Hoeveel winst maakte Century in 2025?'],
  ['c5 CAVEAT Customizze', 'Wat was het resultaat van Customizze in juli 2026?'],
  ['c6', 'Wat is de GOP van Has Hotel in 2025?'],
  ['c7', 'Wie zijn de vijf grootste leveranciers van de groep in 2026?'],
  ['c8', 'Hoeveel geven we per maand uit aan Bidfood in 2026, en stijgt dat?'],
  ['c9', 'Welke venue van Blue Ocean draait in 2026 de meeste omzet, en hoeveel zit er in UNALLOCATED?'],
  ['c10', 'Wat is de personeelskost als percentage van de omzet per entiteit in 2026, tot en met september?'],
  ['d1 ONBEANTWOORDBAAR', 'Wat betalen we bij Sligro voor frieten?'],
  ['d2 ONBEANTWOORDBAAR', 'Wat was de bezettingsgraad van Has Hotel vorige maand?'],
]

async function ask(label: string, q: string) {
  console.log(`\n\n## ${label}\n\n**Vraag:** ${q}\n`)
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: q }]
  for (let round = 0; round < 6; round++) {
    const resp = await anthropic.messages.create({
      model: MODEL, max_tokens: 2000, system, messages,
      tools: [{
        name: 'run_query',
        description: 'Voer één read-only SQL SELECT uit op de toegestane P&L-views, als de ingelogde gebruiker. Resultaat: { rows, row_count, truncated } (max 500 rijen).',
        input_schema: { type: 'object', properties: { sql: { type: 'string' } }, required: ['sql'] },
      }],
    })
    for (const b of resp.content) {
      if (b.type === 'text' && b.text.trim()) console.log(b.text.trim() + '\n')
    }
    if (resp.stop_reason !== 'tool_use') break
    messages.push({ role: 'assistant', content: resp.content })
    const results: Anthropic.ToolResultBlockParam[] = []
    for (const b of resp.content) {
      if (b.type !== 'tool_use') continue
      const sql = String((b.input as { sql?: string }).sql ?? '')
      const g = guardSql(sql)
      if (!g.ok) {
        console.log(`> **query geweigerd (guard):** \`${sql.slice(0, 120)}\` — ${g.reason}\n`)
        results.push({ type: 'tool_result', tool_use_id: b.id, is_error: true, content: g.reason })
        continue
      }
      const r = dbExec(g.sql, BOARD_UID)
      if (!r.ok) {
        console.log(`> **query-fout:** \`${g.sql.replace(/\s+/g, ' ').slice(0, 150)}\` — ${r.out}\n`)
        results.push({ type: 'tool_result', tool_use_id: b.id, is_error: true, content: r.out })
      } else {
        const parsed = JSON.parse(r.out) as { rows: unknown[]; row_count: number; truncated: boolean }
        console.log(`> **bronquery** (${parsed.row_count} rijen${parsed.truncated ? ', afgekapt' : ''}):\n> \`${g.sql.replace(/\s+/g, ' ').slice(0, 220)}\`\n> rijen: \`${JSON.stringify(parsed.rows).slice(0, 320)}\`\n`)
        results.push({ type: 'tool_result', tool_use_id: b.id, content: JSON.stringify(parsed).slice(0, 60000) })
      }
    }
    messages.push({ role: 'user', content: results })
  }
}

async function main() {
  console.log(`# Gate (c)+(d) transcripts — ${now.toISOString().slice(0, 16)}Z, model ${MODEL}, laatste volledige maand ${lastFull}`)
  console.log(`board-uid gevonden: ${BOARD_UID ? 'ja' : 'NEE'}`)
  for (const [label, q] of QUESTIONS) await ask(label, q)
}
main().catch(e => { console.error('RUNNER ERROR', e); process.exit(1) })
