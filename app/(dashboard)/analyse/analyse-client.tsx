'use client'

// Analysis chat client. Honesty construction: every run_query event from
// the stream renders as a collapsible provenance block (SQL + rows) in
// the exact order it was executed — the answer text cannot show a number
// whose source query is not on screen. Charts are fed by the same rows.

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Database, LineChart as LineChartIcon, Pin, Plus, Send, Table2, Trash2 } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type Row = Record<string, unknown>
interface QueryBlock { sql: string; rows?: Row[]; row_count?: number; truncated?: boolean; ms?: number; error?: string }
type Segment = { kind: 'text'; text: string } | { kind: 'query'; q: QueryBlock }
interface ChatMessage { role: 'user' | 'assistant'; segments: Segment[] }
interface Conversation { id: string; title: string | null; updated_at: string }
interface PinRow { id: string; title: string; sql: string; rows: Row[]; created_at: string }

function fmtCell(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toLocaleString('nl-BE', { maximumFractionDigits: 4 })
  return String(v)
}

/* ------------------------------------------------------ provenance block */

function dateKey(rows: Row[]): string | null {
  if (!rows.length) return null
  for (const k of Object.keys(rows[0])) {
    const v = rows[0][k]
    if (typeof v === 'string' && /^\d{4}-\d{2}(-\d{2})?/.test(v)) return k
  }
  return null
}

function ResultChart({ rows }: { rows: Row[] }) {
  const xKey = dateKey(rows)
  const numKeys = Object.keys(rows[0] ?? {}).filter(k => typeof rows[0][k] === 'number')
  if (!numKeys.length) return <p className="text-[11px] text-text-faint">Geen numerieke kolommen om te tekenen.</p>
  const data = rows.map((r, i) => ({ ...r, __x: xKey ? String(r[xKey]).slice(0, 10) : String(i + 1) }))
  const colors = ['#b8962e', '#c2410c', '#16a34a', '#2563eb', '#7c3aed']
  const Chart = xKey ? LineChart : BarChart
  return (
    <ResponsiveContainer width="100%" height={200}>
      <Chart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#00000012" />
        <XAxis dataKey="__x" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} width={70} />
        <Tooltip />
        {numKeys.slice(0, 5).map((k, i) => xKey
          ? <Line key={k} dataKey={k} stroke={colors[i % colors.length]} dot={false} strokeWidth={1.5} />
          : <Bar key={k} dataKey={k} fill={colors[i % colors.length]} />)}
      </Chart>
    </ResponsiveContainer>
  )
}

function QueryBlockView({ q, onPin }: { q: QueryBlock; onPin?: (q: QueryBlock) => void }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'table' | 'chart'>('table')
  const rows = q.rows ?? []
  return (
    <div className="my-1.5 rounded border border-border/60 bg-surface-raised/40 text-[11px]">
      <button onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-1.5 px-2 py-1 text-left text-text-muted hover:text-text">
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        <Database size={11} className="text-gold" />
        {q.error
          ? <span className="text-red-700">query geweigerd: {q.error}</span>
          : <span>bronquery · {q.row_count ?? rows.length} rijen{q.truncated ? ' (afgekapt op 500)' : ''}{q.ms != null ? ` · ${q.ms} ms` : ''}</span>}
      </button>
      {open && (
        <div className="border-t border-border/50 p-2 space-y-2">
          <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-surface px-2 py-1.5 font-mono text-[10px] text-text">{q.sql}</pre>
          {!q.error && rows.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <button onClick={() => setView('table')} className={cn('flex items-center gap-1', view === 'table' ? 'text-gold' : 'text-text-faint hover:text-text')}><Table2 size={11} />tabel</button>
                <button onClick={() => setView('chart')} className={cn('flex items-center gap-1', view === 'chart' ? 'text-gold' : 'text-text-faint hover:text-text')}><LineChartIcon size={11} />grafiek</button>
                {onPin && (
                  <button onClick={() => onPin(q)} className="ml-auto flex items-center gap-1 text-text-faint hover:text-gold">
                    <Pin size={11} />bewaar deze analyse
                  </button>
                )}
              </div>
              {view === 'table' ? (
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-[10px]">
                    <thead><tr className="text-left text-text-faint">
                      {Object.keys(rows[0]).map(k => <th key={k} className="px-1.5 py-0.5 font-normal">{k}</th>)}
                    </tr></thead>
                    <tbody>
                      {rows.slice(0, 100).map((r, i) => (
                        <tr key={i} className="border-t border-border/30">
                          {Object.keys(rows[0]).map(k => <td key={k} className="px-1.5 py-0.5 tabular-nums">{fmtCell(r[k])}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 100 && <p className="px-1.5 py-1 text-text-faint">… nog {rows.length - 100} rijen (volledig in de export van de query)</p>}
                </div>
              ) : <ResultChart rows={rows} />}
            </>
          )}
          {!q.error && rows.length === 0 && <p className="text-text-faint">Query gaf geen rijen terug.</p>}
        </div>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- page */

export function AnalyseClient({ variant = 'page' }: { variant?: 'page' | 'drawer' } = {}) {
  const isDrawer = variant === 'drawer'
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [pins, setPins] = useState<PinRow[]>([])
  const [activeConv, setActiveConv] = useState<string | null>(null)
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadSidebar = useCallback(async () => {
    const supabase = createClient()
    const [{ data: convs }, { data: pinRows }] = await Promise.all([
      supabase.from('analysis_conversations').select('id,title,updated_at').order('updated_at', { ascending: false }).limit(30),
      supabase.from('analysis_pins').select('id,title,sql,rows,created_at').order('created_at', { ascending: false }).limit(20),
    ])
    setConversations((convs ?? []) as Conversation[])
    setPins((pinRows ?? []) as PinRow[])
  }, [])
  useEffect(() => { loadSidebar() }, [loadSidebar])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat])

  async function openConversation(id: string) {
    setActiveConv(id); setError(null)
    const { data } = await createClient().from('analysis_messages')
      .select('role,content').eq('conversation_id', id).order('id')
    setChat((data ?? []).map(m => {
      const c = m.content as { text?: string; queries?: QueryBlock[] }
      const segments: Segment[] = []
      for (const q of c.queries ?? []) segments.push({ kind: 'query', q })
      segments.push({ kind: 'text', text: c.text ?? '' })
      return { role: m.role as 'user' | 'assistant', segments }
    }))
  }

  async function pinQuery(q: QueryBlock) {
    const title = window.prompt('Naam voor deze analyse:', q.sql.slice(0, 60))
    if (!title) return
    await createClient().from('analysis_pins').insert({ title, sql: q.sql, rows: q.rows ?? [] })
    loadSidebar()
  }
  async function deletePin(id: string) {
    await createClient().from('analysis_pins').delete().eq('id', id)
    loadSidebar()
  }

  async function send() {
    const question = input.trim()
    if (!question || busy) return
    setInput(''); setError(null); setBusy(true)
    const history = [
      ...chat.map(m => ({
        role: m.role,
        content: m.segments.filter((s): s is Extract<Segment, { kind: 'text' }> => s.kind === 'text').map(s => s.text).join('\n'),
      })),
      { role: 'user' as const, content: question },
    ]
    setChat(c => [...c, { role: 'user', segments: [{ kind: 'text', text: question }] },
                       { role: 'assistant', segments: [] }])
    try {
      const res = await fetch('/api/analysis-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, conversationId: activeConv }),
      })
      if (!res.ok || !res.body) throw new Error(await res.text() || `HTTP ${res.status}`)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const parts = buf.split('\n\n'); buf = parts.pop() ?? ''
        for (const part of parts) {
          if (!part.startsWith('data: ')) continue
          const ev = JSON.parse(part.slice(6)) as { type: string; delta?: string; conversationId?: string; message?: string } & QueryBlock
          if (ev.type === 'meta' && ev.conversationId) setActiveConv(ev.conversationId)
          else if (ev.type === 'text' && ev.delta) {
            setChat(c => {
              const out = [...c]; const last = out[out.length - 1]
              const segs = [...last.segments]
              const tail = segs[segs.length - 1]
              if (tail?.kind === 'text') segs[segs.length - 1] = { kind: 'text', text: tail.text + ev.delta }
              else segs.push({ kind: 'text', text: ev.delta ?? '' })
              out[out.length - 1] = { ...last, segments: segs }
              return out
            })
          } else if (ev.type === 'query') {
            setChat(c => {
              const out = [...c]; const last = out[out.length - 1]
              out[out.length - 1] = { ...last, segments: [...last.segments, { kind: 'query', q: ev }] }
              return out
            })
          } else if (ev.type === 'error') setError(ev.message ?? 'Onbekende fout')
        }
      }
      loadSidebar()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={cn('flex text-xs', isDrawer ? 'h-full min-h-0' : 'h-[calc(100vh-0px)]')}>
      {/* sidebar: conversations + pins */}
      {!isDrawer && (
      <aside className="hidden w-60 shrink-0 flex-col gap-3 overflow-y-auto border-r border-border/60 p-3 md:flex">
        <button onClick={() => { setActiveConv(null); setChat([]); setError(null) }}
          className="flex items-center gap-1.5 rounded border border-border px-2 py-1.5 text-text hover:border-gold">
          <Plus size={12} /> Nieuw gesprek
        </button>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-text-faint">Gesprekken</p>
          {conversations.map(c => (
            <button key={c.id} onClick={() => openConversation(c.id)}
              className={cn('block w-full truncate rounded px-2 py-1 text-left hover:bg-surface-raised',
                activeConv === c.id ? 'bg-surface-raised text-gold' : 'text-text-muted')}>
              {c.title ?? 'Zonder titel'}
            </button>
          ))}
          {conversations.length === 0 && <p className="px-2 text-text-faint">Nog geen gesprekken.</p>}
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-text-faint">Vastgezet</p>
          {pins.map(p => (
            <details key={p.id} className="group rounded px-2 py-1 hover:bg-surface-raised">
              <summary className="flex cursor-pointer items-center gap-1 text-text-muted">
                <Pin size={10} className="shrink-0 text-gold" /><span className="truncate">{p.title}</span>
                <button onClick={e => { e.preventDefault(); deletePin(p.id) }} className="ml-auto hidden text-text-faint hover:text-red-700 group-hover:block"><Trash2 size={10} /></button>
              </summary>
              <QueryBlockView q={{ sql: p.sql, rows: p.rows, row_count: p.rows.length }} />
            </details>
          ))}
          {pins.length === 0 && <p className="px-2 text-text-faint">Nog niets vastgezet.</p>}
        </div>
      </aside>
      )}

      {/* chat pane */}
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border/60 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-text">Vraag het de cijfers</h1>
            {isDrawer && (
              <span className="ml-auto flex items-center gap-2 text-[11px]">
                <button onClick={() => { setActiveConv(null); setChat([]); setError(null) }}
                  className="flex items-center gap-1 text-text-faint hover:text-gold"><Plus size={11} />nieuw</button>
                <a href="/analyse" className="text-text-faint hover:text-gold">volledige pagina</a>
              </span>
            )}
          </div>
          <p className="text-[11px] text-text-faint">
            Analyse op de gevalideerde views — elke uitspraak toont zijn bronquery. Analyse, geen wijzigingen:
            schema- en mappingwerk blijft via Claude Code lopen. Artikel-/prijsdata dekt ±40% van de aankopen.
          </p>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {chat.length === 0 && (
            <div className="mx-auto mt-10 max-w-md text-center text-text-faint">
              <p className="mb-2">Stel een vraag over de cijfers, bijvoorbeeld:</p>
              {['Hoe evolueert de F&B-omzet van Blue Ocean dit jaar per maand?',
                'Welke entiteit had de hoogste personeelskost in 2025?',
                'Toon de grootste leveranciers van Has Hotel in 2026.'].map(s => (
                <button key={s} onClick={() => setInput(s)} className="mb-1 block w-full rounded border border-border/60 px-2 py-1.5 text-left text-text-muted hover:border-gold">{s}</button>
              ))}
            </div>
          )}
          {chat.map((m, i) => (
            <div key={i} className={cn('max-w-3xl', m.role === 'user' ? 'ml-auto' : '')}>
              <div className={cn('rounded-lg px-3 py-2',
                m.role === 'user' ? 'bg-gold/10 text-text' : 'bg-surface-raised/60 text-text')}>
                {m.segments.map((s, j) => s.kind === 'text'
                  ? <p key={j} className="whitespace-pre-wrap leading-relaxed">{s.text}</p>
                  : <QueryBlockView key={j} q={s.q} onPin={pinQuery} />)}
                {m.role === 'assistant' && m.segments.length === 0 && <p className="text-text-faint">Bezig…</p>}
              </div>
            </div>
          ))}
          {error && <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-red-800">{error}</p>}
          <div ref={bottomRef} />
        </div>
        <footer className="border-t border-border/60 p-3">
          <div className="flex gap-2">
            <textarea value={input} onChange={e => setInput(e.target.value)} rows={2}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Vraag over de cijfers… (Enter om te versturen)"
              className="flex-1 resize-none rounded border border-border bg-surface px-3 py-2 text-xs text-text outline-none focus:border-gold" />
            <button onClick={send} disabled={busy || !input.trim()}
              className="flex items-center gap-1 rounded bg-gold px-3 text-xs font-medium text-white disabled:opacity-40">
              <Send size={12} /> {busy ? '…' : 'Vraag'}
            </button>
          </div>
        </footer>
      </section>
    </main>
  )
}
