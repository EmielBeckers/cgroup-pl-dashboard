import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { guardSql } from '@/lib/analysis/guard'
import { buildSystemPrompt } from '@/lib/analysis/prompt'

// Streaming analysis chat. Security model:
//  - role gate here (board/accounting) AND in run_analysis_query() AND in
//    the views themselves — the model's SQL runs with the USER's JWT via
//    supabase.rpc, dropped to the SELECT-only analysis_reader role.
//  - the model has exactly ONE tool (run_query); history/pins are app
//    writes under the user's own RLS, never model actions.
// Honesty model: every executed query is streamed to the client as a
// provenance event; the UI renders SQL + rows next to the answer.

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const MODEL = 'claude-sonnet-5-5'
const MAX_TOOL_ROUNDS = 6

const TOOLS: Anthropic.Tool[] = [{
  name: 'run_query',
  description:
    'Voer één read-only SQL SELECT uit op de toegestane P&L-views, als de ingelogde gebruiker. ' +
    'Resultaat: { rows, row_count, truncated } (max 500 rijen). ' +
    'Alleen enkelvoudige SELECT/WITH-query’s; geen puntkomma’s, geen schrijfoperaties, geen andere schema’s.',
  input_schema: {
    type: 'object' as const,
    properties: { sql: { type: 'string' as const, description: 'De uit te voeren SELECT-query' } },
    required: ['sql'],
  },
}]

function lastCompleteMonth(now: Date): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  d.setUTCMonth(d.getUTCMonth() - 1)
  return d.toISOString().slice(0, 7)
}

type ClientMessage = { role: 'user' | 'assistant'; content: string }

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single()
  if (!profile || !['board', 'accounting'].includes(profile.role)) {
    return new Response('Forbidden', { status: 403 })
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response('ANTHROPIC_API_KEY ontbreekt (server env)', { status: 503 })
  }

  const body = await req.json().catch(() => null) as
    { messages?: ClientMessage[]; conversationId?: string | null } | null
  const history = (body?.messages ?? []).filter(
    m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim(),
  ).slice(-30)
  if (history.length === 0 || history[history.length - 1].role !== 'user') {
    return new Response('Bad request', { status: 400 })
  }
  const userText = history[history.length - 1].content.slice(0, 4000)

  // conversation bookkeeping (user's own RLS-scoped rows)
  let conversationId = body?.conversationId ?? null
  if (!conversationId) {
    const { data } = await supabase.from('analysis_conversations')
      .insert({ title: userText.slice(0, 80) }).select('id').single()
    conversationId = data?.id ?? null
  }
  if (conversationId) {
    await supabase.from('analysis_messages')
      .insert({ conversation_id: conversationId, role: 'user', content: { text: userText } })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const now = new Date()
  const system: Anthropic.TextBlockParam[] = [{
    type: 'text',
    text: buildSystemPrompt(now.toISOString().slice(0, 10), lastCompleteMonth(now)),
    cache_control: { type: 'ephemeral' },
  }]
  const messages: Anthropic.MessageParam[] = history.map(m => ({ role: m.role, content: m.content }))

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      const queries: { sql: string; rows: unknown; row_count: number; truncated: boolean }[] = []
      let answerText = ''
      try {
        send({ type: 'meta', conversationId })
        for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
          const msgStream = anthropic.messages.stream({
            model: MODEL, max_tokens: 2000, system, messages, tools: TOOLS,
          })
          msgStream.on('text', (delta) => { answerText += delta; send({ type: 'text', delta }) })
          const final = await msgStream.finalMessage()

          if (final.stop_reason !== 'tool_use') break
          if (round === MAX_TOOL_ROUNDS) {
            const note = '\n\n(Analyse afgebroken: te veel queryrondes — stel de vraag gerichter of in delen.)'
            answerText += note
            send({ type: 'text', delta: note })
            break
          }
          messages.push({ role: 'assistant', content: final.content })
          const results: Anthropic.ToolResultBlockParam[] = []
          for (const block of final.content) {
            if (block.type !== 'tool_use') continue
            const sql = String((block.input as { sql?: string })?.sql ?? '')
            const guarded = guardSql(sql)
            if (!guarded.ok) {
              send({ type: 'query', sql, error: guarded.reason })
              results.push({ type: 'tool_result', tool_use_id: block.id, is_error: true, content: guarded.reason })
              continue
            }
            const t0 = Date.now()
            const { data, error } = await supabase.rpc('run_analysis_query', { p_sql: guarded.sql })
            if (error) {
              send({ type: 'query', sql: guarded.sql, error: error.message })
              results.push({ type: 'tool_result', tool_use_id: block.id, is_error: true, content: error.message })
            } else {
              const r = data as { rows: unknown[]; row_count: number; truncated: boolean }
              queries.push({ sql: guarded.sql, rows: r.rows, row_count: r.row_count, truncated: r.truncated })
              send({ type: 'query', sql: guarded.sql, rows: r.rows, row_count: r.row_count, truncated: r.truncated, ms: Date.now() - t0 })
              results.push({
                type: 'tool_result', tool_use_id: block.id,
                content: JSON.stringify(r).slice(0, 60000),
              })
            }
          }
          messages.push({ role: 'user', content: results })
        }

        if (conversationId && answerText.trim()) {
          await supabase.from('analysis_messages').insert({
            conversation_id: conversationId, role: 'assistant',
            content: { text: answerText, queries },
          })
          await supabase.from('analysis_conversations')
            .update({ updated_at: new Date().toISOString() }).eq('id', conversationId)
        }
        send({ type: 'done' })
      } catch (e) {
        send({ type: 'error', message: e instanceof Error ? e.message : String(e) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
