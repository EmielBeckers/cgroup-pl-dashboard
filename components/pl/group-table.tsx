'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Info, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn, formatCurrency } from '@/lib/utils'
import { CaveatBadge, CaveatNote } from '@/components/pl/caveat-badge'
import {
  PlEntityRow, PlVenueRow, PlHotelRow, YEARS, YearAmounts,
  VENUE_ENTITIES, HOTEL_ENTITIES, entityName, venueName, deptRank,
  revenueAndResult, addYear,
} from '@/lib/pl-live'

interface Props { entityRows: PlEntityRow[] }

function Amount({ value, bold }: { value: number | undefined; bold?: boolean }) {
  if (value === undefined || Math.round(value) === 0) return <span className="text-text-faint">—</span>
  return (
    <span className={cn(bold && 'font-semibold', value < 0 ? 'text-danger' : 'text-text')}>
      {formatCurrency(value)}
    </span>
  )
}

function YearCells({ revenue, result }: { revenue: YearAmounts; result: YearAmounts }) {
  return (
    <>
      {YEARS.map(y => (
        <td key={y} className="px-3 py-2 text-right whitespace-nowrap border-l border-border/50">
          <div className="text-xs"><Amount value={revenue[y]} /></div>
          <div className="text-[11px] mt-0.5 text-text-muted">
            <Amount value={result[y]} bold />
          </div>
        </td>
      ))}
    </>
  )
}

// Presentation-only: inside F&B, the mapping's own "Food Revenue …" /
// "Beverage Revenue …" line variants collapse into "Food" / "Beverage"
// sub-lines (same rows, same sums — no re-classification).
function displayLine(dept: string, line: string): string {
  if (dept !== 'F&B') return line
  if (line.startsWith('Food Revenue')) return 'Food'
  if (line.startsWith('Beverage Revenue')) return 'Beverage'
  return line
}
const FNB_LINE_ORDER = ['Food', 'Beverage']

/** dept -> line pivot rows for a set of entity/venue line rows */
function LineRows({ rows }: { rows: { usali_department: string; usali_line: string; calendar_year: number; amount: number }[] }) {
  const depts = new Map<string, Map<string, YearAmounts>>()
  const deptTotals = new Map<string, YearAmounts>()
  for (const r of rows) {
    if (!depts.has(r.usali_department)) { depts.set(r.usali_department, new Map()); deptTotals.set(r.usali_department, {}) }
    const lines = depts.get(r.usali_department)!
    const label = displayLine(r.usali_department, r.usali_line)
    if (!lines.has(label)) lines.set(label, {})
    addYear(lines.get(label)!, r.calendar_year, r.amount)
    addYear(deptTotals.get(r.usali_department)!, r.calendar_year, r.amount)
  }
  const ordered = Array.from(depts.keys()).sort((a, b) => deptRank(a) - deptRank(b))
  return (
    <>
      {ordered.map(dept => (
        <DeptGroup key={dept} dept={dept} totals={deptTotals.get(dept)!} lines={depts.get(dept)!} />
      ))}
    </>
  )
}

function DeptGroup({ dept, totals, lines }: { dept: string; totals: YearAmounts; lines: Map<string, YearAmounts> }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <tr className="bg-surface-raised/50 cursor-pointer hover:bg-surface-raised" onClick={() => setOpen(o => !o)}>
        <td className="pl-16 pr-3 py-1.5 text-xs text-text-muted flex items-center gap-1.5">
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          {dept === 'F&B' ? 'Food & Beverage' : dept}
        </td>
        {YEARS.map(y => (
          <td key={y} className="px-3 py-1.5 text-right text-xs border-l border-border/50">
            <Amount value={totals[y]} />
          </td>
        ))}
      </tr>
      {open && Array.from(lines.entries())
        .sort(([a], [b]) => {
          const ra = FNB_LINE_ORDER.indexOf(a), rb = FNB_LINE_ORDER.indexOf(b)
          return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb)
        })
        .map(([line, ya]) => (
        <tr key={line} className="hover:bg-surface-raised/40">
          <td className="pl-24 pr-3 py-1 text-[11px] text-text-muted">{line}</td>
          {YEARS.map(y => (
            <td key={y} className="px-3 py-1 text-right text-[11px] border-l border-border/50">
              <Amount value={ya[y]} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/* ---------------- venue drill (CUSTOMIZZE / CCORDA / COUTDOOR / BLUEOCEAN) */

export function VenueDrill({ rows, dossier }: { rows: PlVenueRow[]; dossier: string }) {
  const venues = new Map<string, PlVenueRow[]>()
  for (const r of rows) {
    if (!venues.has(r.venue)) venues.set(r.venue, [])
    venues.get(r.venue)!.push(r)
  }
  const ordered = Array.from(venues.keys()).sort((a, b) => {
    const special = (v: string) => (v === 'UNALLOCATED' ? 2 : v === 'ALGEMEEN' ? 1 : 0)
    if (special(a) !== special(b)) return special(a) - special(b)
    const rev = (v: string) => venues.get(v)!.filter(r => r.is_revenue && r.calendar_year === 2024).reduce((s, r) => s + r.amount, 0)
    return rev(b) - rev(a)
  })
  return (
    <>
      {ordered.map(v => <VenueRow key={v} venue={v} rows={venues.get(v)!} dossier={dossier} />)}
    </>
  )
}

function VenueRow({ venue, rows, dossier }: { venue: string; rows: PlVenueRow[]; dossier: string }) {
  const [open, setOpen] = useState(false)
  const { revenue, result } = revenueAndResult(rows)
  const unalloc = venue === 'UNALLOCATED'
  return (
    <>
      <tr
        className={cn('cursor-pointer', unalloc ? 'bg-amber-50/70 hover:bg-amber-50' : 'hover:bg-surface-raised/60')}
        onClick={() => setOpen(o => !o)}
      >
        <td className={cn('pl-10 pr-3 py-1.5 text-xs flex items-center gap-1.5', unalloc ? 'text-amber-900' : 'text-text')}>
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {venueName(venue)}
          {unalloc && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5">
              <Info size={9} /> groepskosten — niet verdeeld
            </span>
          )}
        </td>
        <YearCells revenue={revenue} result={result} />
      </tr>
      {open && <LiveStatement rows={rows} dossier={dossier} drill={false} indentBase="pl-14" />}
    </>
  )
}

/* ---------------- hotel drill (HASHOTEL / CENTURY) ---------------------- */

export function HotelDrill({ rows }: { rows: PlHotelRow[] }) {
  // Departments come from the REVENUE/LABOUR blocks; caveats come from rows.
  const depts = new Map<string, { revenue: YearAmounts; labour: YearAmounts; hasLabour: boolean; caveat: string | null }>()
  const rest = new Map<string, { rows: PlHotelRow[] }>() // UNDISTRIBUTED / NON-OPERATING
  let unallocLabour: YearAmounts | null = null
  let entityCaveat: string | null = null
  const totalLabour: YearAmounts = {}
  let anyLabour = false
  const labourSource = rows[0]?.labour_split_source ?? null

  for (const r of rows) {
    if (r.block === 'LABOUR') { addYear(totalLabour, r.calendar_year, r.amount); anyLabour = true }
    if (r.caveat && !entityCaveat) entityCaveat = r.caveat
    if ((r.block === 'REVENUE' || r.block === 'LABOUR') && r.department) {
      if (!depts.has(r.department)) depts.set(r.department, { revenue: {}, labour: {}, hasLabour: false, caveat: null })
      const d = depts.get(r.department)!
      if (r.caveat) d.caveat = r.caveat
      if (r.block === 'REVENUE') addYear(d.revenue, r.calendar_year, r.amount)
      else { addYear(d.labour, r.calendar_year, r.amount); d.hasLabour = true }
    } else if (r.block === 'LABOUR') {
      unallocLabour = unallocLabour ?? {}
      addYear(unallocLabour, r.calendar_year, r.amount)
    } else {
      const key = r.block
      if (!rest.has(key)) rest.set(key, { rows: [] })
      rest.get(key)!.rows.push(r)
    }
  }

  return (
    <>
      {entityCaveat && (
        <tr><td colSpan={1 + YEARS.length} className="pl-10 pr-4"><CaveatNote text={entityCaveat} /></td></tr>
      )}
      {Array.from(depts.entries()).map(([dept, d]) => {
        const contribution: YearAmounts = {}
        for (const y of YEARS) {
          const v = (d.revenue[y] ?? 0) + (d.labour[y] ?? 0)
          if (d.hasLabour && (d.revenue[y] !== undefined || d.labour[y] !== undefined)) contribution[y] = v
        }
        return (
          <tr key={dept} className="hover:bg-surface-raised/60">
            <td className="pl-10 pr-3 py-1.5 text-xs text-text">
              <div>{dept}</div>
              {d.hasLabour && d.caveat && (
                <div className="mt-0.5 text-[10px] text-text-muted flex items-center gap-1.5">
                  Departementele contributie (enkel loon) <CaveatBadge text={d.caveat} />
                </div>
              )}
            </td>
            {YEARS.map(y => (
              <td key={y} className="px-3 py-1.5 text-right border-l border-border/50 whitespace-nowrap">
                <div className="text-xs"><Amount value={d.revenue[y]} /></div>
                {d.hasLabour && (
                  <div className="text-[11px] mt-0.5"><Amount value={contribution[y]} bold /></div>
                )}
              </td>
            ))}
          </tr>
        )
      })}
      {unallocLabour && (
        <tr className="bg-amber-50/70">
          <td className="pl-10 pr-3 py-1.5 text-xs text-amber-900">Niet-toegewezen loon</td>
          {YEARS.map(y => (
            <td key={y} className="px-3 py-1.5 text-right text-xs border-l border-border/50"><Amount value={unallocLabour![y]} /></td>
          ))}
        </tr>
      )}
      {anyLabour && (
        <tr className="border-t border-border/60">
          <td className="pl-10 pr-3 py-1.5 text-xs font-medium text-text">
            Totaal loon
            <span className="ml-2 text-[9px] uppercase tracking-wide text-text-faint border border-border rounded px-1 py-px">
              {labourSource === 'blanpla_dept' ? 'bron: blanpla (afdeling)' : 'bron: geen splitsing'}
            </span>
          </td>
          {YEARS.map(y => (
            <td key={y} className="px-3 py-1.5 text-right text-xs border-l border-border/50"><Amount value={totalLabour[y]} bold /></td>
          ))}
        </tr>
      )}
      {!anyLabour && labourSource === 'none' && (
        <tr>
          <td colSpan={1 + YEARS.length} className="pl-10 pr-3 py-1 text-[10px] text-text-faint">
            Loon zit in “Niet verdeeld” — labour_split_source: geen (geen echte splitsing beschikbaar; er wordt niets verzonnen).
          </td>
        </tr>
      )}
      {Array.from(rest.entries()).map(([block, { rows: blockRows }]) => (
        <BlockGroup key={block} block={block} rows={blockRows} />
      ))}
      {/* Lodging KPIs have no GL source — locked until the Mews pipeline exists. */}
      <tr>
        <td colSpan={1 + YEARS.length} className="pl-10 pr-4 py-1.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] text-text-faint border border-dashed border-border rounded px-2 py-1">
            <Lock size={10} />
            ADR · RevPAR · bezetting · kamerdetail: vereist Mews-integratie — niet beschikbaar uit de boekhouding, wordt niet geschat.
          </span>
        </td>
      </tr>
    </>
  )
}

function BlockGroup({ block, rows }: { block: string; rows: PlHotelRow[] }) {
  const [open, setOpen] = useState(false)
  const totals: YearAmounts = {}
  const lines = new Map<string, YearAmounts>()
  for (const r of rows) {
    addYear(totals, r.calendar_year, r.amount)
    if (!lines.has(r.line_label)) lines.set(r.line_label, {})
    addYear(lines.get(r.line_label)!, r.calendar_year, r.amount)
  }
  const label = block === 'UNDISTRIBUTED' ? 'Niet verdeeld (undistributed)' : 'Non-operating'
  return (
    <>
      <tr className="bg-surface-raised/50 cursor-pointer hover:bg-surface-raised" onClick={() => setOpen(o => !o)}>
        <td className="pl-10 pr-3 py-1.5 text-xs text-text-muted flex items-center gap-1.5">
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          {label}
        </td>
        {YEARS.map(y => (
          <td key={y} className="px-3 py-1.5 text-right text-xs border-l border-border/50"><Amount value={totals[y]} /></td>
        ))}
      </tr>
      {open && Array.from(lines.entries()).map(([line, ya]) => (
        <tr key={line} className="hover:bg-surface-raised/40">
          <td className="pl-20 pr-3 py-1 text-[11px] text-text-muted">{line}</td>
          {YEARS.map(y => (
            <td key={y} className="px-3 py-1 text-right text-[11px] border-l border-border/50"><Amount value={ya[y]} /></td>
          ))}
        </tr>
      ))}
    </>
  )
}

/* ---------------- live USALI statement (block detail) ------------------- */
// Staged rollout: entities whose expand shows the full block statement.
const DETAIL_ENTITIES = ['CUSTOMIZZE', 'CCORDA', 'COUTDOOR', 'BLUEOCEAN']
// Invoice drill-down staged rollout (report-first discipline):
const DRILL_ENTITIES = ['CUSTOMIZZE', 'CCORDA', 'COUTDOOR', 'BLUEOCEAN']
const DRILLABLE_BLOCKS = ['Cost of Sales', 'Labour', 'Other Operating Expenses', 'Management Fees', 'Non-Operating']

// Block assignment is presentation of the mapping's own output (dept +
// line prefix + is_revenue flag from the views) — never re-classification.
function blockOf(r: PlEntityRow): string {
  if (r.is_revenue) return 'Revenue'
  if (r.usali_department === 'F&B' && r.usali_line.startsWith('Cost of Sales')) return 'Cost of Sales'
  if (r.usali_department === 'Payroll & Related') return 'Labour'
  if (r.usali_department.startsWith('Undistributed') || r.usali_department === 'F&B') return 'Other Operating Expenses'
  return r.usali_department // Management Fees | Non-Operating | UNMAPPED
}
const BLOCK_ORDER = ['Revenue', 'Cost of Sales', 'Labour', 'Other Operating Expenses', 'Management Fees', 'Non-Operating', 'UNMAPPED']
const BLOCK_LABEL: Record<string, string> = {
  'Revenue': 'Omzet', 'Cost of Sales': 'Cost of Sales', 'Labour': 'Loon & gerelateerd',
  'Other Operating Expenses': 'Overige operationele kosten', 'Management Fees': 'Management fees',
  'Non-Operating': 'Non-operating', 'UNMAPPED': 'Niet gemapt — REVIEW',
}

/* ---------------- invoice drill-down (real chain, honest coverage) ------ */

interface InvoiceRow {
  bllever_id: number | null; supplier: string | null; invoice_number: string | null
  invoice_date: string | null; invoice_total: number | null; gl_amount: number
  gl_entries: number; ubl_doc_id: number | null; ubl_status: string | null; ubl_line_count: number | null
}
interface UblLine {
  line_no: number; description: string | null; item_name: string | null; quantity: number | null
  unit_code: string | null; price_amount: number | null; line_amount: number | null; vat_percent: number | null
}

function InvoiceDrill({ dossier, department, line }: { dossier: string; department: string; line: string }) {
  const [year, setYear] = useState<number>(2025)
  const [rows, setRows] = useState<InvoiceRow[] | null>(null)
  const [ublFor, setUblFor] = useState<number | null>(null)
  const [ublLines, setUblLines] = useState<Record<number, UblLine[]>>({})

  React.useEffect(() => {
    let alive = true
    setRows(null)
    createClient().rpc('pl_line_invoices', { p_dossier: dossier, p_department: department, p_line: line, p_year: year })
      .then(({ data }) => { if (alive) setRows((data ?? []) as InvoiceRow[]) })
    return () => { alive = false }
  }, [dossier, department, line, year])

  async function toggleUbl(docId: number) {
    setUblFor(u => u === docId ? null : docId)
    if (!ublLines[docId]) {
      const { data } = await createClient().rpc('pl_invoice_lines', { p_dossier: dossier, p_doc_id: docId })
      setUblLines(l => ({ ...l, [docId]: (data ?? []) as UblLine[] }))
    }
  }

  const invoices = (rows ?? []).filter(r => r.bllever_id !== null)
  const nonInvoice = (rows ?? []).find(r => r.bllever_id === null)
  const invoiceEur = invoices.reduce((s, r) => s + Number(r.gl_amount), 0)
  const withDoc = invoices.filter(r => r.ubl_doc_id !== null).length
  const withLines = invoices.filter(r => r.ubl_line_count).length

  return (
    <tr>
      <td colSpan={1 + YEARS.length} className="pl-[5.5rem] pr-4 pb-2">
        <div className="rounded border border-border bg-surface-raised/30 p-2 text-[11px]">
          <div className="flex items-center gap-3 mb-1.5">
            {YEARS.map(y => (
              <button key={y} onClick={() => setYear(y)} className={cn(
                'px-1.5 py-0.5 rounded text-[10px] border',
                y === year ? 'border-gold text-gold bg-gold/10' : 'border-border text-text-muted hover:text-text')}>
                {y}
              </button>
            ))}
            {rows && (
              <span className="text-text-muted">
                {invoices.reduce((s, r) => s + Number(r.gl_entries), 0) + Number(nonInvoice?.gl_entries ?? 0)} boekingen ·{' '}
                {invoices.length} leveranciersfacturen ({formatCurrency(invoiceEur)}) ·{' '}
                {withDoc} met e-document · {withLines} met lijndetail
                {nonInvoice && <> — <span className="text-amber-800">niet-factuurboekingen: {formatCurrency(Number(nonInvoice.gl_amount))} ({nonInvoice.gl_entries})</span></>}
              </span>
            )}
          </div>
          {!rows && <p className="text-text-faint py-1">Laden…</p>}
          {rows && rows.length === 0 && (
            <p className="text-text-muted py-1">Geen boekingen in {year}.</p>
          )}
          {rows && rows.length > 0 && invoices.length === 0 && (
            <p className="text-text-muted py-1">Geen gekoppelde facturen (niet-leverancierskost: loon, afschrijving of interne boeking).</p>
          )}
          {invoices.map(r => (
            <React.Fragment key={r.bllever_id}>
              <div className="flex items-center gap-2 py-0.5 border-t border-border/40">
                <span className="w-64 truncate text-text">{r.supplier ?? '(leverancier onbekend)'}</span>
                <span className="w-28 text-text-faint truncate">{r.invoice_number ?? '—'}</span>
                <span className="w-20 text-text-faint">{r.invoice_date ?? '—'}</span>
                <span className="w-24 text-right"><Amount value={Number(r.gl_amount)} /></span>
                <span className="w-32 text-right text-text-faint">factuur {r.invoice_total != null ? formatCurrency(Number(r.invoice_total)) : '—'} incl. btw</span>
                {r.ubl_line_count
                  ? <button onClick={() => toggleUbl(r.ubl_doc_id!)} className="text-gold hover:underline">{r.ubl_line_count} lijnen</button>
                  : r.ubl_doc_id
                    ? <span className="text-text-faint">e-doc (geen lijndetail)</span>
                    : <span className="text-text-faint">geen e-document</span>}
              </div>
              {ublFor === r.ubl_doc_id && r.ubl_doc_id && (
                <div className="ml-6 my-1 border-l-2 border-gold/30 pl-3">
                  {!ublLines[r.ubl_doc_id] && <p className="text-text-faint">Laden…</p>}
                  {(ublLines[r.ubl_doc_id] ?? []).map(l => (
                    <div key={l.line_no} className="flex gap-2 py-px text-[10px]">
                      <span className="w-72 truncate text-text-muted">{l.description ?? l.item_name}</span>
                      <span className="w-16 text-right text-text-faint">{l.quantity ?? ''} {l.unit_code === 'C62' ? 'st' : (l.unit_code ?? '')}</span>
                      <span className="w-20 text-right text-text-faint">{l.price_amount != null ? formatCurrency(Number(l.price_amount)) : ''}</span>
                      <span className="w-20 text-right text-text">{l.line_amount != null ? formatCurrency(Number(l.line_amount)) : ''}</span>
                      <span className="w-10 text-right text-text-faint">{l.vat_percent != null ? `${l.vat_percent}%` : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
          <p className="mt-1 text-[9px] text-text-faint">
            GL-bedrag = nettoboekingen op deze lijn (excl. btw); factuurtotaal incl. btw — die sluiten bewust niet op elkaar aan.
            Dekking kan lager zijn dan het lijntotaal; het verschil wordt getoond, nooit bijverzonnen.
          </p>
        </div>
      </td>
    </tr>
  )
}

function StatementBlock({ block, rows, indentBase, dossier, drill = true }: { block: string; rows: PlEntityRow[]; indentBase: string; dossier: string; drill?: boolean }) {
  const [open, setOpen] = useState(false)
  const [drillLine, setDrillLine] = useState<string | null>(null)
  const totals: YearAmounts = {}
  // sub-line = subgroup (dept, for Other OpEx) + display label; only rows
  // that exist appear — no template, no zero-fill, by construction.
  const lines = new Map<string, { ya: YearAmounts; dept: string; line: string; merged: boolean }>()
  for (const r of rows) {
    addYear(totals, r.calendar_year, r.amount)
    const sub = block === 'Other Operating Expenses'
      ? (r.usali_department === 'F&B' ? 'F&B · ' : r.usali_department.replace('Undistributed — ', '') + ' · ') + displayLine(r.usali_department, r.usali_line)
      : displayLine(r.usali_department, r.usali_line)
    if (!lines.has(sub)) lines.set(sub, { ya: {}, dept: r.usali_department, line: r.usali_line, merged: false })
    const e = lines.get(sub)!
    if (e.line !== r.usali_line) e.merged = true // display-merged (Food/Bev variants): not drillable 1:1
    addYear(e.ya, r.calendar_year, r.amount)
  }
  const drillable = drill && DRILL_ENTITIES.includes(dossier) && DRILLABLE_BLOCKS.includes(block)
  const orderedLines = Array.from(lines.entries()).sort(([a], [b]) => {
    const ra = FNB_LINE_ORDER.indexOf(a), rb = FNB_LINE_ORDER.indexOf(b)
    if (ra !== -1 || rb !== -1) return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb)
    return a.localeCompare(b)
  })
  return (
    <>
      <tr className="bg-surface-raised/50 cursor-pointer hover:bg-surface-raised" onClick={() => setOpen(o => !o)}>
        <td className={cn(indentBase, 'pr-3 py-1.5 text-xs font-medium text-text flex items-center gap-1.5')}>
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          {BLOCK_LABEL[block] ?? block}
          <span className="text-[9px] font-normal text-text-faint">({lines.size} lijnen · bron: usali_mapping)</span>
        </td>
        {YEARS.map(y => (
          <td key={y} className="px-3 py-1.5 text-right text-xs border-l border-border/50"><Amount value={totals[y]} bold /></td>
        ))}
      </tr>
      {open && orderedLines.map(([sub, e]) => (
        <React.Fragment key={sub}>
          <tr
            className={cn('hover:bg-surface-raised/40', drillable && !e.merged && 'cursor-pointer')}
            onClick={() => drillable && !e.merged && setDrillLine(d => d === sub ? null : sub)}
          >
            <td className={cn(indentBase, 'pl-[4.5rem] pr-3 py-1 text-[11px] text-text-muted')}>
              {drillable && !e.merged && (drillLine === sub ? <ChevronDown size={9} className="inline mr-1" /> : <ChevronRight size={9} className="inline mr-1" />)}
              {sub}
            </td>
            {YEARS.map(y => (
              <td key={y} className="px-3 py-1 text-right text-[11px] border-l border-border/50"><Amount value={e.ya[y]} /></td>
            ))}
          </tr>
          {drillLine === sub && <InvoiceDrill dossier={dossier} department={e.dept} line={e.line} />}
        </React.Fragment>
      ))}
    </>
  )
}

export function LiveStatement({ rows, dossier, drill = true, indentBase = 'pl-10' }: { rows: PlEntityRow[]; dossier: string; drill?: boolean; indentBase?: string }) {
  const byBlock = new Map<string, PlEntityRow[]>()
  for (const r of rows) {
    const b = blockOf(r)
    if (!byBlock.has(b)) byBlock.set(b, [])
    byBlock.get(b)!.push(r)
  }
  const operating: YearAmounts = {}
  const all: YearAmounts = {}
  for (const r of rows) {
    addYear(all, r.calendar_year, r.amount)
    const b = blockOf(r)
    if (b !== 'Non-Operating' && b !== 'UNMAPPED') addYear(operating, r.calendar_year, r.amount)
  }
  return (
    <>
      {BLOCK_ORDER.filter(b => byBlock.has(b)).map(b => (
        <React.Fragment key={b}>
          <StatementBlock block={b} rows={byBlock.get(b)!} indentBase={indentBase} dossier={dossier} drill={drill} />
          {b === 'Management Fees' && (
            <tr key="op" className="border-t border-border/60">
              <td className={cn(indentBase, 'pr-3 py-1.5 text-xs font-semibold text-text')}>Resultaat vóór non-operating</td>
              {YEARS.map(y => (
                <td key={y} className="px-3 py-1.5 text-right text-xs border-l border-border/50"><Amount value={operating[y]} bold /></td>
              ))}
            </tr>
          )}
        </React.Fragment>
      ))}
      <tr className="border-t-2 border-border/80">
        <td className={cn(indentBase, 'pr-3 py-1.5 text-xs font-semibold text-text')}>Resultaat</td>
        {YEARS.map(y => (
          <td key={y} className="px-3 py-1.5 text-right text-xs border-l border-border/50"><Amount value={all[y]} bold /></td>
        ))}
      </tr>
    </>
  )
}

/* ---------------- entity rows + root table ------------------------------ */

function EntityRow({ dossier, rows }: { dossier: string; rows: PlEntityRow[] }) {
  const [open, setOpen] = useState(false)
  const [drill, setDrill] = useState<PlVenueRow[] | PlHotelRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const isVenue = VENUE_ENTITIES.includes(dossier)
  const isHotel = HOTEL_ENTITIES.includes(dossier)
  const { revenue, result } = revenueAndResult(rows)

  async function toggle() {
    const next = !open
    setOpen(next)
    if (!next || drill || (!isVenue && !isHotel)) return
    setLoading(true)
    const supabase = createClient()
    if (isVenue) {
      const parts = await Promise.all(YEARS.map(y =>
        supabase.from('pl_venue').select('*').eq('dossier_code', dossier).eq('calendar_year', y)
      ))
      setDrill(parts.flatMap(p => (p.data ?? [])) as PlVenueRow[])
    } else {
      const { data } = await supabase.from('pl_hotel').select('*')
        .eq('dossier_code', dossier).in('calendar_year', [...YEARS])
      setDrill((data ?? []) as PlHotelRow[])
    }
    setLoading(false)
  }

  return (
    <>
      <tr className="border-t border-border cursor-pointer hover:bg-surface-raised/60" onClick={toggle}>
        <td className="px-3 py-2.5 text-sm font-medium text-text flex items-center gap-2">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {entityName(dossier)}
          {isHotel && <span className="text-[10px] text-text-faint uppercase tracking-wide">hotel</span>}
        </td>
        <YearCells revenue={revenue} result={result} />
      </tr>
      {open && loading && (
        <tr><td colSpan={1 + YEARS.length} className="pl-10 py-2 text-xs text-text-faint">Laden…</td></tr>
      )}
      {open && DETAIL_ENTITIES.includes(dossier) && <LiveStatement rows={rows} dossier={dossier} />}
      {open && !loading && isVenue && drill && (
        <>
          {DETAIL_ENTITIES.includes(dossier) && (
            <tr><td colSpan={1 + YEARS.length} className="pl-10 pr-3 pt-2 pb-1 text-[10px] uppercase tracking-widest text-text-faint">Venues</td></tr>
          )}
          <VenueDrill rows={drill as PlVenueRow[]} dossier={dossier} />
        </>
      )}
      {open && !loading && isHotel && drill && <HotelDrill rows={drill as PlHotelRow[]} />}
      {open && !isVenue && !isHotel && (
        <>
          <tr><td colSpan={1 + YEARS.length} className="pl-10 pr-4 py-1 text-[11px] text-text-faint">
            {dossier === 'MIAMENSA'
              ? 'Enkele venue — entiteit = venue.'
              : 'Venue-opsplitsing in afwachting van analytische codering (zie DATA_QUESTIONS).'}
          </td></tr>
          <LiveStatement rows={rows} dossier={dossier} drill={false} />
        </>
      )}
    </>
  )
}

export function GroupTable({ entityRows }: Props) {
  const byEntity = new Map<string, PlEntityRow[]>()
  for (const r of entityRows) {
    if (!byEntity.has(r.dossier_code)) byEntity.set(r.dossier_code, [])
    byEntity.get(r.dossier_code)!.push(r)
  }
  const ordered = Array.from(byEntity.keys()).sort((a, b) => {
    const rev = (d: string) => byEntity.get(d)!.filter(r => r.is_revenue && r.calendar_year === 2024).reduce((s, r) => s + r.amount, 0)
    return rev(b) - rev(a)
  })
  // group totals per year — presentation sums of the same view rows
  const group = revenueAndResult(entityRows)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-text-faint">
            <td className="px-3 py-2">Entiteit / venue</td>
            {YEARS.map(y => (
              <td key={y} className="px-3 py-2 text-right border-l border-border/50">
                {y}{y === 2026 && ' YTD'}
                <div className="normal-case tracking-normal text-[9px]">omzet · resultaat</div>
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {ordered.map(d => <EntityRow key={d} dossier={d} rows={byEntity.get(d)!} />)}
          <tr className="border-t-2 border-border bg-surface-raised/60">
            <td className="px-3 py-2.5 text-sm font-semibold text-text">Groep</td>
            <YearCells revenue={group.revenue} result={group.result} />
          </tr>
        </tbody>
      </table>
      <p className="px-3 py-3 text-[11px] text-text-faint">
        Cijfers sluiten aan op het grootboek excl. 69x/79x resultaatverwerking (gevalideerde adsolut-views).
        De app groepeert en sommeert enkel rijen uit die views. Niet-verdeelde kosten worden getoond, nooit gespreid.
      </p>
    </div>
  )
}
