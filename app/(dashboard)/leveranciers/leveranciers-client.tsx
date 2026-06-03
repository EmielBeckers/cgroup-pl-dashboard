'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TopBar } from '@/components/layout/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PeriodSelector } from '@/components/ui/period-selector'
import { SupplierDetailPanel } from './supplier-detail-panel'
import {
  PeriodState, CompState, DateRange, MonthYear,
  resolvePeriodRange, resolveCompRange, rangeLabel,
} from '@/lib/period'
import { formatCurrency, cn } from '@/lib/utils'
import { Invoice, Company, Venue } from '@/lib/types'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export type Row = Invoice & {
  company: Pick<Company, 'id' | 'display_name'> | null
  venue: Pick<Venue, 'id' | 'name' | 'company_id'> | null
}

export interface SupplierAgg {
  name: string
  spend: number
  priorSpend: number
  count: number
  primaryCategory: string | null
  companies: string[]
  venues: string[]
  invoices: Row[]
}

function resolveCategory(inv: Invoice): string | null {
  return inv.confirmed_category ?? inv.ai_suggested_category ?? inv.usali_category ?? null
}

function invMonthYear(inv: Invoice): MonthYear {
  const [y, m] = inv.invoice_date.split('-').map(Number)
  return { year: y, month: m }
}

function inRange(my: MonthYear, range: DateRange): boolean {
  const t  = my.year * 12 + my.month
  const lo = range.start.year * 12 + range.start.month
  const hi = range.end.year   * 12 + range.end.month
  return t >= lo && t <= hi
}

export function LeveranciersClient() {
  const [rows,    setRows]    = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const [period, setPeriod] = useState<PeriodState>({ type: 'ytd' })
  const [comp,   setComp]   = useState<CompState>({ type: 'vs_last_year' })

  // Filters
  const [scope,    setScope]    = useState('')        // '' | company:<id> | venue:<id>
  const [category, setCategory] = useState('')
  const [minSpend, setMinSpend] = useState('')

  const [selected, setSelected] = useState<SupplierAgg | null>(null)

  useEffect(() => {
    createClient()
      .from('invoices')
      .select('*, company:companies(id, display_name), venue:venues(id, name, company_id)')
      .eq('is_archived', false)
      .limit(5000)
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); setLoading(false); return }
        setRows((data ?? []) as Row[])
        setLoading(false)
      })
  }, [])

  // Anchor period selector to the latest invoice month
  const latest: MonthYear | null = useMemo(() => {
    if (!rows.length) return null
    return rows.reduce<MonthYear>((best, r) => {
      const my = invMonthYear(r)
      return my.year * 12 + my.month > best.year * 12 + best.month ? my : best
    }, invMonthYear(rows[0]))
  }, [rows])

  const primaryRange = latest ? resolvePeriodRange(period, latest) : null
  const compRange    = primaryRange ? resolveCompRange(comp, primaryRange) : null

  // Dropdown options (entities + venues)
  const { companies, venues } = useMemo(() => {
    const cMap = new Map<string, { id: string; display_name: string }>()
    const vMap = new Map<string, { id: string; name: string }>()
    for (const r of rows) {
      if (r.company) cMap.set(r.company.id, { id: r.company.id, display_name: r.company.display_name })
      if (r.venue)   vMap.set(r.venue.id, { id: r.venue.id, name: r.venue.name })
    }
    return {
      companies: Array.from(cMap.values()).sort((a, b) => a.display_name.localeCompare(b.display_name)),
      venues:    Array.from(vMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    }
  }, [rows])

  const suppliers = useMemo<SupplierAgg[]>(() => {
    if (!primaryRange) return []

    // Hard filters applied to every invoice before aggregation
    const passesScope = (inv: Row) => {
      if (!scope) return true
      const [kind, id] = scope.split(':')
      return kind === 'company' ? inv.company_id === id : inv.venue_id === id
    }
    const passesCategory = (inv: Row) => !category || resolveCategory(inv) === category

    const map = new Map<string, SupplierAgg & { catCounts: Map<string, number>; companySet: Set<string>; venueSet: Set<string> }>()

    for (const inv of rows) {
      if (!passesScope(inv) || !passesCategory(inv)) continue
      const my = invMonthYear(inv)
      const inPrimary = inRange(my, primaryRange)
      const inComp    = compRange ? inRange(my, compRange) : false
      if (!inPrimary && !inComp) continue

      let agg = map.get(inv.supplier_name)
      if (!agg) {
        agg = {
          name: inv.supplier_name, spend: 0, priorSpend: 0, count: 0,
          primaryCategory: null, companies: [], venues: [], invoices: [],
          catCounts: new Map(), companySet: new Set(), venueSet: new Set(),
        }
        map.set(inv.supplier_name, agg)
      }

      if (inPrimary) {
        agg.spend += inv.amount_excl_vat
        agg.count += 1
        agg.invoices.push(inv)
        const cat = resolveCategory(inv)
        if (cat) agg.catCounts.set(cat, (agg.catCounts.get(cat) ?? 0) + 1)
        if (inv.company?.display_name) agg.companySet.add(inv.company.display_name)
        if (inv.venue?.name) agg.venueSet.add(inv.venue.name)
      }
      if (inComp) {
        agg.priorSpend += inv.amount_excl_vat
      }
    }

    const min = minSpend ? Number(minSpend) : 0

    return Array.from(map.values())
      .filter(a => a.count > 0 && a.spend >= min)
      .map(a => {
        let primaryCategory: string | null = null
        let bestCount = 0
        for (const [cat, c] of a.catCounts) {
          if (c > bestCount) { bestCount = c; primaryCategory = cat }
        }
        return {
          name: a.name, spend: a.spend, priorSpend: a.priorSpend, count: a.count,
          primaryCategory,
          companies: Array.from(a.companySet).sort(),
          venues: Array.from(a.venueSet).sort(),
          invoices: a.invoices,
        }
      })
      .sort((x, y) => y.spend - x.spend)
  }, [rows, primaryRange, compRange, scope, category, minSpend])

  const primaryLabel = primaryRange ? rangeLabel(primaryRange) : '—'
  const compLabel    = compRange    ? rangeLabel(compRange)    : undefined
  const totalSpend   = suppliers.reduce((s, a) => s + a.spend, 0)

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Leveranciers" subtitle="Top leveranciers per uitgaven (excl. BTW)" />

      <div className="p-6 flex flex-col gap-4">
        {/* Period selector */}
        {!loading && latest && (
          <PeriodSelector period={period} comp={comp} onChange={(p, c) => { setPeriod(p); setComp(c) }} />
        )}

        {/* Filters */}
        <div className="bg-surface border border-border rounded-lg p-4 flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-text-faint font-medium">Entiteit / Venue</span>
            <select
              value={scope}
              onChange={e => setScope(e.target.value)}
              className="h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-gold/50 appearance-none cursor-pointer pr-6 min-w-[200px]"
            >
              <option value="">Geconsolideerd (alle)</option>
              <optgroup label="Entiteiten">
                {companies.map(c => <option key={c.id} value={`company:${c.id}`}>{c.display_name}</option>)}
              </optgroup>
              <optgroup label="Venues">
                {venues.map(v => <option key={v.id} value={`venue:${v.id}`}>{v.name}</option>)}
              </optgroup>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-text-faint font-medium">Categorie</span>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-gold/50 appearance-none cursor-pointer pr-6 min-w-[180px]"
            >
              <option value="">Alle categorieën</option>
              {/* Categories present in the data */}
              {Array.from(new Set(rows.map(resolveCategory).filter(Boolean))).sort().map(c => (
                <option key={c as string} value={c as string}>{c}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-text-faint font-medium">Min. uitgaven (€)</span>
            <input
              type="number" inputMode="numeric"
              value={minSpend}
              onChange={e => setMinSpend(e.target.value)}
              placeholder="0"
              className="h-8 w-28 rounded-md border border-border bg-surface px-2.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-gold/50 placeholder:text-text-faint"
            />
          </label>

          <div className="ml-auto text-xs text-text-muted">
            <span className="font-medium text-text">{suppliers.length}</span> leveranciers ·
            totaal <span className="font-medium text-text">{formatCurrency(totalSpend, true)}</span>
          </div>
        </div>

        {/* Ranking */}
        {error ? (
          <p className="text-sm text-danger px-1">{error}</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Top leveranciers — {primaryLabel}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-faint text-xs uppercase tracking-wide bg-surface-raised/50">
                      <th className="text-left px-5 py-3 w-12">#</th>
                      <th className="text-left px-4 py-3">Leverancier</th>
                      <th className="text-right px-4 py-3">Uitgaven</th>
                      <th className="text-right px-4 py-3">Facturen</th>
                      <th className="text-left px-4 py-3">Hoofdcategorie</th>
                      {compRange && <th className="text-right px-4 py-3">Trend</th>}
                      <th className="text-left px-4 py-3">Levert aan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {suppliers.map((s, i) => {
                      const trend = compRange && s.priorSpend > 0
                        ? ((s.spend - s.priorSpend) / s.priorSpend) * 100
                        : null
                      const tags = [...s.companies, ...s.venues]
                      return (
                        <tr
                          key={s.name}
                          onClick={() => setSelected(s)}
                          className="hover:bg-surface-raised transition-colors cursor-pointer"
                        >
                          <td className="px-5 py-3 text-text-faint tabular-nums">{i + 1}</td>
                          <td className="px-4 py-3 font-medium text-text max-w-[200px] truncate">{s.name}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-text font-medium">
                            {formatCurrency(s.spend, true)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-text-muted">{s.count}</td>
                          <td className="px-4 py-3 text-text-muted text-xs max-w-[160px] truncate">
                            {s.primaryCategory ?? '—'}
                          </td>
                          {compRange && (
                            <td className="px-4 py-3 text-right">
                              {trend != null ? (
                                <span className={cn(
                                  'inline-flex items-center gap-1 text-xs tabular-nums',
                                  trend > 0.05 ? 'text-danger' : trend < -0.05 ? 'text-success' : 'text-text-muted',
                                )}>
                                  {trend > 0.05 ? <TrendingUp size={12} /> : trend < -0.05 ? <TrendingDown size={12} /> : <Minus size={12} />}
                                  {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
                                </span>
                              ) : (
                                <span className="text-text-faint text-xs">nieuw</span>
                              )}
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {tags.slice(0, 3).map(t => (
                                <Badge key={t} variant="default">{t}</Badge>
                              ))}
                              {tags.length > 3 && (
                                <Badge variant="default">+{tags.length - 3}</Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {loading && (
                      <tr><td colSpan={7} className="px-5 py-10 text-center text-text-muted text-sm animate-pulse">Laden…</td></tr>
                    )}
                    {!loading && suppliers.length === 0 && (
                      <tr><td colSpan={7} className="px-5 py-10 text-center text-text-muted text-sm">Geen leveranciers gevonden voor deze selectie.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail slide-over */}
      {selected && primaryRange && (
        <SupplierDetailPanel
          supplier={selected}
          primaryRange={primaryRange}
          periodLabel={primaryLabel}
          compLabel={compLabel}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
