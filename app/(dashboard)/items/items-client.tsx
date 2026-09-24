'use client'

// Everything here reads public.items / item_prices (role-gated matview
// wrappers over real UBL lines) and the product-group tables. Honesty
// rules baked in:
//  - items from different suppliers are NEVER merged automatically;
//  - similarity candidates are marked SUGGESTIE and chart nothing until
//    confirmed via the role-gated RPC;
//  - group members without a unit factor (or with unknown units) are
//    listed as "niet vergelijkbaar" instead of being charted;
//  - an item whose history spans multiple units splits per unit, with a
//    warning — a pack-size change must never render as a price change.

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, ChevronLeft, Info, Plus, X } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { cn, formatCurrency } from '@/lib/utils'
import { entityName } from '@/lib/pl-live'

const PAGE_SIZE = 50
const SERIES_COLORS = ['#b8962e', '#c2410c', '#16a34a', '#2563eb', '#7c3aed', '#a08868', '#dc2626', '#0891b2']

interface ItemRow {
  item_key: string; supplier_vat: string | null; supplier_name: string | null
  description: string | null; n_purchases: number; n_days: number
  first_date: string | null; last_date: string | null; n_units: number
  unit_norm_sample: string | null; last_unit_price: number | null
}
interface PriceRow {
  item_key: string; dossier_code: string; doc_id: number; line_no: number
  invoice_date: string; quantity: number | null; unit_code: string | null
  unit_norm: string; base_quantity: number | null; price_amount: number | null
  line_amount: number | null; unit_price: number | null
  bllever_id: number | null; invoice_number: string | null; pdf_doc_id: number | null
}
interface Group { id: number; name: string; base_unit: string; notes: string | null }
interface GroupItem { group_id: number; item_key: string; unit_factor: number | null }
interface Suggestion { item_key: string; supplier_name: string | null; description: string | null; sim: number }

function fmtPrice(v: number | null | undefined) {
  return v == null ? '—' : `€ ${Number(v).toLocaleString('nl-BE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
}

/* ------------------------------------------------- price history chart -- */

function PriceChart({ series, onPointClick }: {
  series: { name: string; points: { date: string; value: number }[] }[]
  onPointClick?: (date: string) => void
}) {
  const dates = Array.from(new Set(series.flatMap(s => s.points.map(p => p.date)))).sort()
  const data = dates.map(d => {
    const row: Record<string, string | number | null> = { date: d }
    for (const s of series) row[s.name] = s.points.find(p => p.date === d)?.value ?? null
    return row
  })
  if (data.length === 0) return null
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
        onClick={(st) => { const l = (st as { activeLabel?: string } | null)?.activeLabel; if (l && onPointClick) onPointClick(l) }}
        style={onPointClick ? { cursor: 'pointer' } : undefined}>
        <CartesianGrid stroke="#e5e0d8" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#6b6560', fontSize: 10 }} axisLine={{ stroke: '#e5e0d8' }} tickLine={false} />
        <YAxis tick={{ fill: '#a09890', fontSize: 10 }} axisLine={false} tickLine={false}
               tickFormatter={v => `€${v}`} width={52} domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{ background: '#ffffff', border: '1px solid #e5e0d8', borderRadius: 8, fontSize: 12, color: '#1c1814' }}
          formatter={(v) => [v == null ? '—' : fmtPrice(Number(v)), '']}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 10, color: '#6b6560' }} />}
        {series.map((s, i) => (
          <Line key={s.name} type="monotone" dataKey={s.name} connectNulls
                stroke={SERIES_COLORS[i % SERIES_COLORS.length]} strokeWidth={2}
                dot={{ r: 2.5 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

/* ------------------------------------------------------- item detail ----- */

function ItemDetail({ item, groups, onAddToGroup }: {
  item: ItemRow
  groups: Group[]
  onAddToGroup: (groupId: number, itemKey: string, factor: number | null) => Promise<void>
}) {
  const [prices, setPrices] = useState<PriceRow[] | null>(null)
  const [groupId, setGroupId] = useState('')
  const [factor, setFactor] = useState('')
  const [busy, setBusy] = useState(false)
  const [picked, setPicked] = useState<string | null>(null) // chart-clicked date
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo] = useState('')
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let alive = true
    createClient().from('item_prices').select('*')
      .eq('item_key', item.item_key).order('invoice_date', { ascending: true }).limit(5000)
      .then(({ data }) => { if (alive) setPrices((data ?? []) as PriceRow[]) })
    return () => { alive = false }
  }, [item.item_key])

  const years = useMemo(() =>
    Array.from(new Set((prices ?? []).map(p => p.invoice_date?.slice(0, 4)).filter(Boolean))).sort() as string[],
  [prices])
  const filtered = useMemo(() => (prices ?? []).filter(p => {
    const y = p.invoice_date?.slice(0, 4) ?? ''
    return (!yearFrom || y >= yearFrom) && (!yearTo || y <= yearTo)
  }), [prices, yearFrom, yearTo])

  const byUnit = useMemo(() => {
    const m = new Map<string, PriceRow[]>()
    for (const p of filtered) {
      if (p.unit_price == null) continue
      if (!m.has(p.unit_norm)) m.set(p.unit_norm, [])
      m.get(p.unit_norm)!.push(p)
    }
    return m
  }, [filtered])

  const pickedRows = useMemo(() =>
    picked ? filtered.filter(p => p.invoice_date === picked) : [],
  [picked, filtered])

  return (
    <div className="rounded border border-border bg-surface-raised/30 p-3 text-[11px] space-y-3">
      {!prices && <p className="text-text-faint">Laden…</p>}
      {prices && byUnit.size > 1 && (
        <p className="flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-300 rounded px-2 py-1">
          <Info size={11} />
          Dit artikel is in meerdere eenheden gefactureerd ({Array.from(byUnit.keys()).join(', ')}) —
          de historiek is per eenheid gesplitst; prijzen over eenheden heen zijn niet vergelijkbaar.
        </p>
      )}
      {prices && Array.from(byUnit.entries()).map(([unit, rows]) => (
        <div key={unit}>
          <p className="text-[10px] uppercase tracking-widest text-text-faint mb-1">
            Prijs per {unit === 'onbekend' ? 'factuureenheid (eenheid onbekend)' : unit}
            <span className="ml-2 normal-case tracking-normal">— klik een punt voor de factuur</span>
          </p>
          <PriceChart
            series={[{
              name: unit,
              points: rows.map(r => ({ date: r.invoice_date, value: Number(r.unit_price) })),
            }]}
            onPointClick={d => setPicked(p => p === d ? null : d)}
          />
        </div>
      ))}
      {picked && pickedRows.length > 0 && (
        <div className="rounded border border-gold/40 bg-gold/5 px-3 py-2 space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-text-faint">
            Aankoop {picked}
            <button onClick={() => setPicked(null)} className="ml-2 text-text-faint hover:text-text normal-case">× sluit</button>
          </p>
          {pickedRows.map(p => (
            <div key={`${p.doc_id}-${p.line_no}`} className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span className="text-text">{item.supplier_name ?? '—'}</span>
              <span className="text-text-muted">{entityName(p.dossier_code)}</span>
              <span className="text-text-muted">factuur {p.invoice_number ?? '—'}</span>
              <span>{p.quantity ?? '—'} × {fmtPrice(p.unit_price)} / {p.unit_norm}</span>
              <span className="text-text-muted">lijn {p.line_amount != null ? formatCurrency(Number(p.line_amount)) : '—'}</span>
              {p.pdf_doc_id
                ? <a href={`/api/invoice-pdf?dossier=${p.dossier_code}&doc=${p.pdf_doc_id}`} target="_blank" rel="noreferrer"
                     className="text-gold hover:underline">PDF</a>
                : <span className="text-text-faint">geen PDF</span>}
            </div>
          ))}
        </div>
      )}
      {prices && prices.length > 0 && (
        <div className="overflow-x-auto">
          <div className="flex items-end gap-2 mb-1">
            <label className="flex flex-col gap-0.5 text-[9px] uppercase tracking-widest text-text-faint">
              Van jaar
              <select value={yearFrom} onChange={e => setYearFrom(e.target.value)}
                      className="bg-surface border border-border rounded px-1.5 py-0.5 text-[11px] text-text">
                <option value="">alle</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-0.5 text-[9px] uppercase tracking-widest text-text-faint">
              Tot jaar
              <select value={yearTo} onChange={e => setYearTo(e.target.value)}
                      className="bg-surface border border-border rounded px-1.5 py-0.5 text-[11px] text-text">
                <option value="">alle</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
            <span className="text-[10px] text-text-faint pb-1">{filtered.length} aankopen in bereik</span>
          </div>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-text-faint uppercase tracking-widest">
                <td className="py-1 pr-2">Datum</td><td className="py-1 pr-2">Entiteit</td>
                <td className="py-1 pr-2">Factuur</td>
                <td className="py-1 pr-2 text-right">Aantal</td><td className="py-1 pr-2">Eenheid</td>
                <td className="py-1 pr-2 text-right">Per hoeveel</td>
                <td className="py-1 pr-2 text-right">Eenheidsprijs</td><td className="py-1 pr-2 text-right">Lijntotaal</td>
                <td className="py-1 text-right">PDF</td>
              </tr>
            </thead>
            <tbody>
              {filtered.slice().reverse().slice(0, showAll ? undefined : 40).map(p => (
                <tr key={`${p.doc_id}-${p.line_no}`}
                    className={cn('border-t border-border/40', picked === p.invoice_date && 'bg-gold/5')}>
                  <td className="py-0.5 pr-2 whitespace-nowrap text-text-muted">{p.invoice_date}</td>
                  <td className="py-0.5 pr-2 text-text-muted">{entityName(p.dossier_code)}</td>
                  <td className="py-0.5 pr-2 text-text-faint max-w-28 truncate">{p.invoice_number ?? '—'}</td>
                  <td className="py-0.5 pr-2 text-right">{p.quantity ?? '—'}</td>
                  <td className="py-0.5 pr-2">{p.unit_norm}{p.unit_norm === 'onbekend' && p.unit_code ? ` (${p.unit_code})` : ''}</td>
                  <td className="py-0.5 pr-2 text-right">{p.base_quantity ?? 1}</td>
                  <td className="py-0.5 pr-2 text-right text-text">{fmtPrice(p.unit_price)}</td>
                  <td className="py-0.5 pr-2 text-right text-text-muted">{p.line_amount != null ? formatCurrency(Number(p.line_amount)) : '—'}</td>
                  <td className="py-0.5 text-right">
                    {p.pdf_doc_id
                      ? <a href={`/api/invoice-pdf?dossier=${p.dossier_code}&doc=${p.pdf_doc_id}`} target="_blank" rel="noreferrer"
                           className="text-gold hover:underline">PDF</a>
                      : <span className="text-text-faint">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 40 && !showAll && (
            <button onClick={() => setShowAll(true)} className="text-gold hover:underline mt-1 text-[10px]">
              Toon alle {filtered.length} aankopen
            </button>
          )}
        </div>
      )}
      <div className="flex items-end gap-2 border-t border-border/50 pt-2">
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-text-faint">
          Toevoegen aan productgroep
          <select value={groupId} onChange={e => setGroupId(e.target.value)}
                  className="bg-surface border border-border rounded px-2 py-1 text-[11px] text-text">
            <option value="">— kies groep —</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name} (per {g.base_unit})</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-text-faint">
          Eenheidsfactor
          <input value={factor} onChange={e => setFactor(e.target.value)} placeholder="bv. 2.5"
                 className="bg-surface border border-border rounded px-2 py-1 text-[11px] text-text w-20" />
        </label>
        <button
          disabled={!groupId || busy}
          onClick={async () => {
            setBusy(true)
            await onAddToGroup(Number(groupId), item.item_key, factor.trim() === '' ? null : Number(factor.replace(',', '.')))
            setBusy(false); setGroupId(''); setFactor('')
          }}
          className="px-2.5 py-1 rounded text-[11px] border border-gold text-gold bg-gold/10 hover:bg-gold/20 disabled:opacity-40"
        >
          <Plus size={11} className="inline mr-1" />Bevestig lid
        </button>
        <span className="text-[10px] text-text-faint pb-1">
          factor = hoeveel {groups.find(g => String(g.id) === groupId)?.base_unit ?? 'basiseenheden'} één factuureenheid bevat; leeg = onbekend (niet vergelijkbaar tot ingevuld)
        </span>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------- group card -- */

function GroupCard({ group, members, itemsByKey, onAdd, onRemove, refresh }: {
  group: Group
  members: GroupItem[]
  itemsByKey: Map<string, ItemRow>
  onAdd: (groupId: number, itemKey: string, factor: number | null) => Promise<void>
  onRemove: (groupId: number, itemKey: string) => Promise<void>
  refresh: () => void
}) {
  const [open, setOpen] = useState(true)
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)
  const [prices, setPrices] = useState<Map<string, PriceRow[]>>(new Map())
  const [factorDraft, setFactorDraft] = useState<Record<string, string>>({})

  const comparable = members.filter(m => m.unit_factor != null && Number(m.unit_factor) > 0)
  const notComparable = members.filter(m => !comparable.includes(m))

  useEffect(() => {
    let alive = true
    if (comparable.length === 0) { setPrices(new Map()); return }
    createClient().from('item_prices').select('*')
      .in('item_key', comparable.map(m => m.item_key))
      .order('invoice_date', { ascending: true }).limit(1000)
      .then(({ data }) => {
        if (!alive) return
        const m = new Map<string, PriceRow[]>()
        for (const p of (data ?? []) as PriceRow[]) {
          if (p.unit_price == null || p.unit_norm === 'onbekend') continue
          if (!m.has(p.item_key)) m.set(p.item_key, [])
          m.get(p.item_key)!.push(p)
        }
        setPrices(m)
      })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id, members.map(m => `${m.item_key}:${m.unit_factor}`).join(',')])

  async function loadSuggestions() {
    const { data } = await createClient().rpc('pg_suggest_items', { p_group_id: group.id, p_limit: 12 })
    setSuggestions((data ?? []) as Suggestion[])
  }

  const series = comparable
    .filter(m => prices.has(m.item_key))
    .map(m => {
      const it = itemsByKey.get(m.item_key)
      return {
        name: `${it?.supplier_name ?? '?'} — ${(it?.description ?? m.item_key).slice(0, 32)}`,
        points: prices.get(m.item_key)!.map(p => ({
          date: p.invoice_date,
          value: Number(p.unit_price) / Number(m.unit_factor),
        })),
      }
    })

  return (
    <div className="bg-surface border border-border rounded-lg">
      <div className="w-full flex items-center gap-2 px-4 py-2.5">
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 flex-1 text-left">
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          <span className="text-sm font-medium text-text">{group.name}</span>
          <span className="text-[10px] text-text-faint uppercase tracking-widest">per {group.base_unit} · {members.length} leden</span>
        </button>
        <button
          onClick={async () => {
            if (!window.confirm(`Groep "${group.name}" verwijderen? De artikelen zelf blijven bestaan.`)) return
            await createClient().rpc('pg_delete_group', { p_group_id: group.id })
            refresh()
          }}
          className="text-text-faint hover:text-danger" title="Groep verwijderen"
        ><X size={13} /></button>
      </div>
      {open && (
        <div className="px-4 pb-3 space-y-3 text-[11px]">
          {series.length > 0 && (
            <>
              <p className="text-[10px] uppercase tracking-widest text-text-faint">
                Vergelijking — genormaliseerd naar € per {group.base_unit}
              </p>
              <PriceChart series={series} />
            </>
          )}
          {members.length > 0 && (
            <table className="w-full text-[11px]">
              <tbody>
                {members.map(m => {
                  const it = itemsByKey.get(m.item_key)
                  return (
                    <tr key={m.item_key} className="border-t border-border/40">
                      <td className="py-1 pr-2 max-w-72 truncate text-text">{it?.description ?? m.item_key}</td>
                      <td className="py-1 pr-2 text-text-muted">{it?.supplier_name ?? '—'}</td>
                      <td className="py-1 pr-2 whitespace-nowrap">
                        <input
                          value={factorDraft[m.item_key] ?? (m.unit_factor == null ? '' : String(m.unit_factor))}
                          onChange={e => setFactorDraft(d => ({ ...d, [m.item_key]: e.target.value }))}
                          placeholder="factor"
                          className="bg-surface border border-border rounded px-1.5 py-0.5 w-16 text-[11px]"
                        />
                        <button
                          onClick={async () => {
                            const raw = (factorDraft[m.item_key] ?? '').trim()
                            await onAdd(group.id, m.item_key, raw === '' ? null : Number(raw.replace(',', '.')))
                            refresh()
                          }}
                          className="ml-1 text-gold hover:underline"
                        >bewaar</button>
                      </td>
                      <td className="py-1 text-right">
                        {m.unit_factor == null && <span className="text-amber-800 mr-2">niet vergelijkbaar (eenheid onbekend)</span>}
                        <button onClick={async () => { await onRemove(group.id, m.item_key); refresh() }}
                                className="text-text-faint hover:text-danger"><X size={11} /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          {notComparable.length > 0 && series.length > 0 && (
            <p className="text-[10px] text-text-faint">
              {notComparable.length} lid/leden zonder eenheidsfactor worden bewust NIET in de grafiek getoond.
            </p>
          )}
          <div>
            <button onClick={loadSuggestions} className="text-gold hover:underline text-[11px]">
              Toon suggesties (gelijkaardige omschrijvingen)
            </button>
            {suggestions && suggestions.length === 0 && <p className="text-text-faint mt-1">Geen kandidaten gevonden.</p>}
            {suggestions && suggestions.map(s => (
              <div key={s.item_key} className="flex items-center gap-2 py-0.5 border-t border-border/40">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-800 bg-amber-50 border border-amber-300 rounded px-1 py-px">suggestie</span>
                <span className="max-w-80 truncate text-text">{s.description}</span>
                <span className="text-text-muted">{s.supplier_name}</span>
                <span className="text-text-faint">{Math.round(s.sim * 100)}% gelijkenis</span>
                <button
                  onClick={async () => { await onAdd(group.id, s.item_key, null); setSuggestions(null); refresh() }}
                  className="ml-auto px-2 py-0.5 rounded border border-gold text-gold bg-gold/10 hover:bg-gold/20 text-[10px]"
                >Bevestig als lid</button>
              </div>
            ))}
            {suggestions && suggestions.length > 0 && (
              <p className="text-[9px] text-text-faint mt-1">
                Suggesties zijn kandidaten op tekstgelijkenis — ze tellen pas mee (en verschijnen pas in de grafiek) na jouw bevestiging én een ingevulde eenheidsfactor.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------- main ------ */

export function ItemsClient() {
  const [tab, setTab] = useState<'items' | 'groups'>('items')
  const [search, setSearch] = useState('')
  const [supplier, setSupplier] = useState('')
  const [applied, setApplied] = useState({ search: '', supplier: '' })
  const [page, setPage] = useState(0)
  const [rows, setRows] = useState<ItemRow[] | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  const [openItem, setOpenItem] = useState<string | null>(null)
  const [coverage, setCoverage] = useState<{ invoice_count: number; with_lines: number } | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [groupItems, setGroupItems] = useState<GroupItem[]>([])
  const [memberItems, setMemberItems] = useState<Map<string, ItemRow>>(new Map())
  const [newGroup, setNewGroup] = useState({ name: '', unit: 'kg' })

  const loadGroups = useCallback(async () => {
    const supabase = createClient()
    const [g, gi] = await Promise.all([
      supabase.from('product_groups').select('*').order('name'),
      supabase.from('product_group_items').select('*'),
    ])
    const gs = (g.data ?? []) as Group[]
    const gis = (gi.data ?? []) as GroupItem[]
    setGroups(gs); setGroupItems(gis)
    const keys = Array.from(new Set(gis.map(x => x.item_key)))
    if (keys.length > 0) {
      const { data } = await supabase.from('items').select('*').in('item_key', keys)
      setMemberItems(new Map(((data ?? []) as ItemRow[]).map(i => [i.item_key, i])))
    }
  }, [])

  useEffect(() => {
    createClient().rpc('invoices_summary', { p_from: '2024-01-01' })
      .then(({ data }) => { const s = (data as { invoice_count: number; with_lines: number }[] | null)?.[0]; if (s) setCoverage(s) })
    loadGroups()
  }, [loadGroups])

  useEffect(() => {
    let alive = true
    setRows(null)
    const supabase = createClient()
    let q = supabase.from('items').select('*', { count: 'exact' })
    if (applied.search.trim()) q = q.ilike('description', `%${applied.search.trim()}%`)
    if (applied.supplier.trim()) q = q.ilike('supplier_name', `%${applied.supplier.trim()}%`)
    q.order('n_purchases', { ascending: false }).order('item_key')
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
      .then(({ data, count }) => {
        if (!alive) return
        setRows((data ?? []) as ItemRow[])
        if (count != null) setTotal(count)
      })
    return () => { alive = false }
  }, [applied, page])

  async function addToGroup(groupId: number, itemKey: string, factor: number | null) {
    const { error } = await createClient().rpc('pg_add_item', { p_group_id: groupId, p_item_key: itemKey, p_unit_factor: factor })
    if (!error) await loadGroups()
  }
  async function removeFromGroup(groupId: number, itemKey: string) {
    const { error } = await createClient().rpc('pg_remove_item', { p_group_id: groupId, p_item_key: itemKey })
    if (!error) await loadGroups()
  }

  const totalPages = total != null ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : null

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-text-muted bg-surface border border-border rounded-lg px-4 py-2.5">
        <Info size={11} className="inline mr-1.5 text-text-faint" />
        Dekking: prijsdata komt uit e-facturen (Peppol UBL).{' '}
        {coverage
          ? <>Sinds 2024 hebben <span className="font-medium text-text">{coverage.with_lines.toLocaleString('nl-BE')}</span> van{' '}
              {coverage.invoice_count.toLocaleString('nl-BE')} leveranciersfacturen lijndetail — de dekking groeit maandelijks met het Peppol-mandaat.</>
          : 'Dekking laden…'}
      </p>

      <div className="flex gap-1.5">
        {(['items', 'groups'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn(
            'px-3 py-1.5 rounded-md text-xs border transition-colors',
            tab === t ? 'border-gold text-gold bg-gold/10' : 'border-border text-text-muted hover:text-text',
          )}>
            {t === 'items' ? 'Artikelen' : `Productgroepen (${groups.length})`}
          </button>
        ))}
      </div>

      {tab === 'items' && (
        <div className="bg-surface border border-border rounded-lg">
          <form
            onSubmit={e => { e.preventDefault(); setPage(0); setApplied({ search, supplier }) }}
            className="px-4 py-2.5 border-b border-border flex gap-2 items-end"
          >
            <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-text-faint">
              Artikel
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="zoek omschrijving…"
                     className="bg-surface border border-border rounded-md px-2 py-1.5 text-xs text-text w-64" />
            </label>
            <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-text-faint">
              Leverancier
              <input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="zoek…"
                     className="bg-surface border border-border rounded-md px-2 py-1.5 text-xs text-text w-48" />
            </label>
            <button type="submit" className="px-3 py-1.5 rounded-md text-xs border border-gold text-gold bg-gold/10 hover:bg-gold/20">Zoek</button>
            <span className="text-[11px] text-text-muted pb-1.5">
              {total != null && `${total.toLocaleString('nl-BE')} artikelen`}
            </span>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-text-faint">
                  <td className="px-4 py-2">Omschrijving</td>
                  <td className="px-3 py-2">Leverancier</td>
                  <td className="px-3 py-2 text-right">Aankopen</td>
                  <td className="px-3 py-2">Periode</td>
                  <td className="px-3 py-2">Eenheid</td>
                  <td className="px-3 py-2 text-right">Laatste prijs</td>
                </tr>
              </thead>
              <tbody>
                {rows === null && <tr><td colSpan={6} className="px-4 py-6 text-center text-text-faint">Laden…</td></tr>}
                {rows !== null && rows.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-text-muted">Geen artikelen voor deze zoekopdracht.</td></tr>}
                {(rows ?? []).map(r => (
                  <React.Fragment key={r.item_key}>
                    <tr className="border-t border-border/50 hover:bg-surface-raised/50 cursor-pointer"
                        onClick={() => setOpenItem(o => o === r.item_key ? null : r.item_key)}>
                      <td className="px-4 py-1.5 max-w-96 truncate text-text">
                        {openItem === r.item_key ? <ChevronDown size={10} className="inline mr-1" /> : <ChevronRight size={10} className="inline mr-1" />}
                        {r.description}
                      </td>
                      <td className="px-3 py-1.5 max-w-56 truncate text-text-muted">{r.supplier_name ?? '—'}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{r.n_purchases}</td>
                      <td className="px-3 py-1.5 whitespace-nowrap text-text-faint">{r.first_date} → {r.last_date}</td>
                      <td className="px-3 py-1.5">
                        {r.n_units > 1
                          ? <span className="text-amber-800">{r.n_units} eenheden</span>
                          : r.unit_norm_sample}
                      </td>
                      <td className="px-3 py-1.5 text-right whitespace-nowrap">{fmtPrice(r.last_unit_price)}</td>
                    </tr>
                    {openItem === r.item_key && (
                      <tr><td colSpan={6} className="px-6 pb-2">
                        <ItemDetail item={r} groups={groups} onAddToGroup={addToGroup} />
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-border flex items-center justify-end gap-1.5 text-xs text-text-muted">
            <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}
                    className="p-1 rounded border border-border disabled:opacity-30 hover:bg-surface-raised"><ChevronLeft size={12} /></button>
            <span>pagina {page + 1}{totalPages != null && ` / ${totalPages}`}</span>
            <button disabled={totalPages != null && page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}
                    className="p-1 rounded border border-border disabled:opacity-30 hover:bg-surface-raised"><ChevronRight size={12} /></button>
          </div>
        </div>
      )}

      {tab === 'groups' && (
        <div className="space-y-3">
          <form
            onSubmit={async e => {
              e.preventDefault()
              if (!newGroup.name.trim()) return
              const { error } = await createClient().rpc('pg_create_group', { p_name: newGroup.name.trim(), p_base_unit: newGroup.unit })
              if (!error) { setNewGroup({ name: '', unit: 'kg' }); await loadGroups() }
            }}
            className="bg-surface border border-border rounded-lg px-4 py-3 flex gap-2 items-end"
          >
            <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-text-faint">
              Nieuwe productgroep
              <input value={newGroup.name} onChange={e => setNewGroup(g => ({ ...g, name: e.target.value }))}
                     placeholder='bv. "Scampi 16/20"' className="bg-surface border border-border rounded-md px-2 py-1.5 text-xs text-text w-64" />
            </label>
            <label className="flex flex-col gap-1 text-[10px] uppercase tracking-widest text-text-faint">
              Basiseenheid
              <select value={newGroup.unit} onChange={e => setNewGroup(g => ({ ...g, unit: e.target.value }))}
                      className="bg-surface border border-border rounded-md px-2 py-1.5 text-xs text-text">
                <option value="kg">kg</option><option value="stuk">stuk</option>
                <option value="l">liter</option><option value="uur">uur</option>
              </select>
            </label>
            <button type="submit" className="px-3 py-1.5 rounded-md text-xs border border-gold text-gold bg-gold/10 hover:bg-gold/20">
              <Plus size={12} className="inline mr-1" />Maak groep
            </button>
          </form>
          {groups.length === 0 && (
            <p className="text-xs text-text-muted px-1">
              Nog geen productgroepen. Maak er één aan en voeg artikelen toe via de Artikelen-tab of via suggesties.
            </p>
          )}
          {groups.map(g => (
            <GroupCard key={g.id} group={g}
                       members={groupItems.filter(gi => gi.group_id === g.id)}
                       itemsByKey={memberItems}
                       onAdd={addToGroup} onRemove={removeFromGroup} refresh={loadGroups} />
          ))}
        </div>
      )}
    </div>
  )
}
