'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatCurrency } from '@/lib/utils'
import { entityName } from '@/lib/pl-live'

// Everything on this page comes from public.invoices (role-gated view over
// adsolut.bllever) and the pl_invoice_lines RPC. The header totals come
// from invoices_summary over the WHOLE filtered set — same view, same
// filters — so they tie to what the rows below sum to.

const PAGE_SIZE = 50
const DEFAULT_FROM = '2026-01-01'

interface InvoiceRow {
  dossier_code: string
  id: number
  leveranc_code: string | null
  supplier: string | null
  invoice_number: string | null
  invoice_date: string | null
  due_date: string | null
  total_incl_vat: number | null
  ubl_doc_id: number | null
  ubl_status: string | null
  ubl_line_count: number | null
}

interface Summary { invoice_count: number; total_eur: number; with_edoc: number; with_lines: number }

interface UblLine {
  line_no: number; description: string | null; item_name: string | null; quantity: number | null
  unit_code: string | null; price_amount: number | null; line_amount: number | null; vat_percent: number | null
}

interface Filters {
  dossier: string
  supplier: string
  from: string
  to: string
  min: string
  max: string
}

const EMPTY_FILTERS: Filters = { dossier: '', supplier: '', from: DEFAULT_FROM, to: '', min: '', max: '' }

export function InvoicesClient({ dossiers }: { dossiers: string[] }) {
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS)
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS)
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<InvoiceRow[] | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [ublFor, setUblFor] = useState<string | null>(null) // `${dossier}:${docId}`
  const [ublLines, setUblLines] = useState<Record<string, UblLine[]>>({})

  const load = useCallback(async (f: Filters, p: number) => {
    setRows(null)
    const supabase = createClient()
    let q = supabase.from('invoices').select('*')
    if (f.dossier) q = q.eq('dossier_code', f.dossier)
    if (f.supplier.trim()) q = q.ilike('supplier', `%${f.supplier.trim()}%`)
    if (f.from) q = q.gte('invoice_date', f.from)
    if (f.to) q = q.lte('invoice_date', f.to)
    if (f.min !== '') q = q.gte('total_incl_vat', Number(f.min))
    if (f.max !== '') q = q.lte('total_incl_vat', Number(f.max))
    const [rowsRes, sumRes] = await Promise.all([
      q.order('invoice_date', { ascending: false }).order('id', { ascending: false })
        .range(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE - 1),
      p === 0 || summary === null
        ? supabase.rpc('invoices_summary', {
            p_dossier: f.dossier || null,
            p_supplier: f.supplier.trim() || null,
            p_from: f.from || null,
            p_to: f.to || null,
            p_min: f.min === '' ? null : Number(f.min),
            p_max: f.max === '' ? null : Number(f.max),
          })
        : Promise.resolve(null),
    ])
    setRows((rowsRes.data ?? []) as InvoiceRow[])
    if (sumRes) {
      const s = (sumRes.data as Summary[] | null)?.[0]
      if (s) setSummary(s)
    }
  }, [summary])

  useEffect(() => { load(applied, page) }, [applied, page]) // eslint-disable-line react-hooks/exhaustive-deps

  function apply(e: React.FormEvent) {
    e.preventDefault()
    setSummary(null)
    setPage(0)
    setApplied(draft)
  }

  function clear() {
    const empty = { ...EMPTY_FILTERS, from: '' }
    setDraft(empty)
    setSummary(null)
    setPage(0)
    setApplied(empty)
  }

  async function toggleUbl(dossier: string, docId: number) {
    const key = `${dossier}:${docId}`
    setUblFor(u => (u === key ? null : key))
    if (!ublLines[key]) {
      const { data } = await createClient().rpc('pl_invoice_lines', { p_dossier: dossier, p_doc_id: docId })
      setUblLines(l => ({ ...l, [key]: (data ?? []) as UblLine[] }))
    }
  }

  const totalPages = summary ? Math.max(1, Math.ceil(summary.invoice_count / PAGE_SIZE)) : null
  const inputCls = 'bg-surface border border-border rounded-md px-2 py-1.5 text-xs text-text w-full'

  return (
    <div className="space-y-3">
      <form onSubmit={apply} className="bg-surface border border-border rounded-lg p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 items-end">
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-text-faint">
          Entiteit
          <select value={draft.dossier} onChange={e => setDraft(d => ({ ...d, dossier: e.target.value }))} className={inputCls}>
            <option value="">Alle</option>
            {dossiers.map(d => <option key={d} value={d}>{entityName(d)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-text-faint">
          Leverancier
          <input value={draft.supplier} onChange={e => setDraft(d => ({ ...d, supplier: e.target.value }))} placeholder="zoek…" className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-text-faint">
          Van
          <input type="date" value={draft.from} onChange={e => setDraft(d => ({ ...d, from: e.target.value }))} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-text-faint">
          Tot
          <input type="date" value={draft.to} onChange={e => setDraft(d => ({ ...d, to: e.target.value }))} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-text-faint">
          Min €
          <input type="number" step="0.01" value={draft.min} onChange={e => setDraft(d => ({ ...d, min: e.target.value }))} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-text-faint">
          Max €
          <input type="number" step="0.01" value={draft.max} onChange={e => setDraft(d => ({ ...d, max: e.target.value }))} className={inputCls} />
        </label>
        <div className="flex gap-2">
          <button type="submit" className="px-3 py-1.5 rounded-md text-xs border border-gold text-gold bg-gold/10 hover:bg-gold/20 transition-colors">Filter</button>
          <button type="button" onClick={clear} className="px-2 py-1.5 rounded-md text-xs border border-border text-text-muted hover:text-text transition-colors">Wis</button>
        </div>
      </form>

      <div className="bg-surface border border-border rounded-lg">
        <div className="px-4 py-2.5 border-b border-border text-xs text-text-muted">
          {summary
            ? <>
                <span className="font-medium text-text">{summary.invoice_count.toLocaleString('nl-BE')} facturen</span>
                {' · '}{formatCurrency(Number(summary.total_eur))} incl. btw
                {' · '}{summary.with_edoc.toLocaleString('nl-BE')} met e-document
                {' · '}{summary.with_lines.toLocaleString('nl-BE')} met lijndetail
              </>
            : 'Totalen laden…'}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-text-faint">
                <td className="px-4 py-2">Datum</td>
                <td className="px-3 py-2">Leverancier</td>
                <td className="px-3 py-2">Factuurnr</td>
                <td className="px-3 py-2">Entiteit</td>
                <td className="px-3 py-2 text-right">Bedrag incl. btw</td>
                <td className="px-3 py-2">Vervaldatum</td>
                <td className="px-3 py-2">E-document</td>
              </tr>
            </thead>
            <tbody>
              {rows === null && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-text-faint">Laden…</td></tr>
              )}
              {rows !== null && rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-text-muted">Geen facturen voor deze filters.</td></tr>
              )}
              {(rows ?? []).map(r => {
                const key = r.ubl_doc_id != null ? `${r.dossier_code}:${r.ubl_doc_id}` : null
                return (
                  <React.Fragment key={`${r.dossier_code}-${r.id}`}>
                    <tr className="border-t border-border/50 hover:bg-surface-raised/50">
                      <td className="px-4 py-1.5 whitespace-nowrap text-text-muted">{r.invoice_date ?? '—'}</td>
                      <td className="px-3 py-1.5 text-text max-w-64 truncate">{r.supplier ?? '(onbekend)'}</td>
                      <td className="px-3 py-1.5 text-text-faint max-w-32 truncate">{r.invoice_number ?? '—'}</td>
                      <td className="px-3 py-1.5 text-text-muted whitespace-nowrap">{entityName(r.dossier_code)}</td>
                      <td className={cn('px-3 py-1.5 text-right whitespace-nowrap tabular-nums', (r.total_incl_vat ?? 0) < 0 ? 'text-danger' : 'text-text')}>
                        {r.total_incl_vat != null ? formatCurrency(Number(r.total_incl_vat)) : '—'}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-text-faint">{r.due_date ?? '—'}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        {r.ubl_line_count
                          ? <button onClick={() => toggleUbl(r.dossier_code, r.ubl_doc_id!)} className="text-gold hover:underline flex items-center gap-1">
                              {ublFor === key ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                              {r.ubl_line_count} lijnen
                            </button>
                          : r.ubl_doc_id
                            ? <span className="text-text-faint">e-doc (geen lijndetail)</span>
                            : <span className="text-text-faint">geen</span>}
                      </td>
                    </tr>
                    {key !== null && ublFor === key && (
                      <tr>
                        <td colSpan={7} className="px-6 pb-2">
                          <div className="border-l-2 border-gold/30 pl-3 py-1">
                            {!ublLines[key] && <p className="text-text-faint">Laden…</p>}
                            {(ublLines[key] ?? []).map(l => (
                              <div key={l.line_no} className="flex gap-2 py-px text-[10px]">
                                <span className="w-96 truncate text-text-muted">{l.description ?? l.item_name}</span>
                                <span className="w-16 text-right text-text-faint">{l.quantity ?? ''} {l.unit_code === 'C62' ? 'st' : (l.unit_code ?? '')}</span>
                                <span className="w-20 text-right text-text-faint">{l.price_amount != null ? formatCurrency(Number(l.price_amount)) : ''}</span>
                                <span className="w-20 text-right text-text">{l.line_amount != null ? formatCurrency(Number(l.line_amount)) : ''}</span>
                                <span className="w-10 text-right text-text-faint">{l.vat_percent != null ? `${l.vat_percent}%` : ''}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-border flex items-center justify-between text-xs text-text-muted">
          <span>
            {summary && rows !== null && rows.length > 0
              ? `Rij ${page * PAGE_SIZE + 1}–${page * PAGE_SIZE + rows.length} van ${summary.invoice_count.toLocaleString('nl-BE')}`
              : ''}
          </span>
          <span className="flex items-center gap-1.5">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              className="p-1 rounded border border-border disabled:opacity-30 hover:bg-surface-raised"
            ><ChevronLeft size={12} /></button>
            <span>pagina {page + 1}{totalPages != null && ` / ${totalPages}`}</span>
            <button
              disabled={totalPages != null && page + 1 >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1 rounded border border-border disabled:opacity-30 hover:bg-surface-raised"
            ><ChevronRight size={12} /></button>
          </span>
        </div>
      </div>

      <p className="text-[11px] text-text-faint">
        Bedragen komen uit het leveranciersdagboek en zijn incl. btw; de P&L toont netto excl. btw —
        die twee sluiten bewust niet 1-op-1 aan. E-documentdekking wordt getoond zoals ze is:
        facturen zonder e-document of lijndetail staan er gewoon bij.
      </p>
    </div>
  )
}
