'use client'

import { useEffect, useMemo } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, MONTH_NAMES } from '@/lib/utils'
import { DateRange } from '@/lib/period'
import type { SupplierAgg, Row } from './leveranciers-client'

function resolveCategory(inv: Row): string | null {
  return inv.confirmed_category ?? inv.ai_suggested_category ?? inv.usali_category ?? null
}

interface Props {
  supplier: SupplierAgg
  primaryRange: DateRange
  periodLabel: string
  compLabel?: string
  onClose: () => void
}

export function SupplierDetailPanel({ supplier, primaryRange, periodLabel, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Month-by-month spend across the full primary range (continuous, zero-filled)
  const monthly = useMemo(() => {
    const lo = primaryRange.start.year * 12 + primaryRange.start.month
    const hi = primaryRange.end.year * 12 + primaryRange.end.month
    const buckets = new Map<number, number>()
    for (let t = lo; t <= hi; t++) buckets.set(t, 0)
    for (const inv of supplier.invoices) {
      const [y, m] = inv.invoice_date.split('-').map(Number)
      const t = y * 12 + m
      if (buckets.has(t)) buckets.set(t, (buckets.get(t) ?? 0) + inv.amount_excl_vat)
    }
    return Array.from(buckets.entries()).map(([t, spend]) => {
      const month = ((t - 1) % 12) + 1
      const year = Math.floor((t - 1) / 12)
      return { label: `${MONTH_NAMES[month - 1]} ${String(year).slice(2)}`, spend }
    })
  }, [supplier.invoices, primaryRange])

  // Category breakdown by spend (ex-VAT)
  const categories = useMemo(() => {
    const map = new Map<string, number>()
    for (const inv of supplier.invoices) {
      const cat = resolveCategory(inv) ?? 'Ongecategoriseerd'
      map.set(cat, (map.get(cat) ?? 0) + inv.amount_excl_vat)
    }
    return Array.from(map.entries())
      .map(([category, spend]) => ({ category, spend }))
      .sort((a, b) => b.spend - a.spend)
  }, [supplier.invoices])

  // Invoice history, newest first
  const invoices = useMemo(
    () => [...supplier.invoices].sort((a, b) => b.invoice_date.localeCompare(a.invoice_date)),
    [supplier.invoices],
  )

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <aside className="relative w-full max-w-xl bg-surface border-l border-border h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border px-6 py-5 flex items-start justify-between z-10">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-faint">Leverancier · {periodLabel}</p>
            <h2 className="text-lg font-semibold text-text mt-0.5">{supplier.name}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-gold font-medium tabular-nums">{formatCurrency(supplier.spend)}</span>
              <span className="text-text-muted">{supplier.count} facturen</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-faint hover:text-text transition-colors p-1 -mr-1"
            aria-label="Sluiten"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-6">
          {/* Monthly spend chart */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-text-muted font-medium mb-3">Uitgaven per maand</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e0d8" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#a09890' }}
                    axisLine={{ stroke: '#e5e0d8' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#a09890' }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={v => formatCurrency(v, true)}
                  />
                  <Tooltip
                    cursor={{ fill: '#f0ede6' }}
                    contentStyle={{
                      background: '#ffffff', border: '1px solid #e5e0d8',
                      borderRadius: 8, fontSize: 12, color: '#1c1814',
                    }}
                    formatter={(v) => [formatCurrency(Number(v)), 'Uitgaven']}
                  />
                  <Bar dataKey="spend" fill="#b8962e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Venues supplied */}
          {supplier.venues.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-widest text-text-muted font-medium mb-3">Levert aan</h3>
              <div className="flex flex-wrap gap-1.5">
                {supplier.companies.map(c => <Badge key={`c-${c}`} variant="gold">{c}</Badge>)}
                {supplier.venues.map(v => <Badge key={`v-${v}`} variant="default">{v}</Badge>)}
              </div>
            </section>
          )}

          {/* Category breakdown */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-text-muted font-medium mb-3">Categorieën</h3>
            <div className="flex flex-col gap-2">
              {categories.map(({ category, spend }) => {
                const pct = supplier.spend > 0 ? (spend / supplier.spend) * 100 : 0
                return (
                  <div key={category} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted truncate max-w-[280px]">{category}</span>
                      <span className="text-text tabular-nums font-medium">{formatCurrency(spend, true)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-overlay overflow-hidden">
                      <div className="h-full bg-gold/60 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Invoice history */}
          <section>
            <h3 className="text-xs uppercase tracking-widest text-text-muted font-medium mb-3">
              Facturen ({invoices.length})
            </h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-text-faint uppercase tracking-wide bg-surface-raised/50">
                    <th className="text-left px-3 py-2">Nummer</th>
                    <th className="text-left px-3 py-2">Datum</th>
                    <th className="text-left px-3 py-2">Venue</th>
                    <th className="text-right px-3 py-2">Bedrag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-surface-raised transition-colors">
                      <td className="px-3 py-2 font-mono text-text-muted">{inv.invoice_number}</td>
                      <td className="px-3 py-2 text-text-muted">{inv.invoice_date}</td>
                      <td className="px-3 py-2 text-text-muted truncate max-w-[120px]">
                        {inv.venue?.name ?? inv.company?.display_name ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-text font-medium">
                        {formatCurrency(inv.amount_excl_vat)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </aside>
    </div>
  )
}
