'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TopBar } from '@/components/layout/top-bar'
import { Badge } from '@/components/ui/badge'
import { InvoiceFilters, InvoiceFilterState, EMPTY_FILTERS } from '@/components/invoices/invoice-filters'
import { formatCurrency, cn } from '@/lib/utils'
import { Invoice, Company, Venue } from '@/lib/types'
import Link from 'next/link'
import { ArrowRight, ClipboardList, ArrowUp, ArrowDown } from 'lucide-react'

type Row = Invoice & { company: Company | null; venue: (Venue & { company_id: string }) | null }

const STATUS_LABEL: Record<string, string> = { paid: 'Betaald', pending: 'In behandeling', overdue: 'Vervallen' }
const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  paid: 'success', pending: 'warning', overdue: 'danger',
}
const REVIEW_LABEL: Record<string, string> = {
  pending_ai: 'AI pending', pending_review: 'Review',
  auto_confirmed: 'Auto ✓', confirmed: 'Bevestigd', corrected: 'Gecorrigeerd',
}
const REVIEW_VARIANT: Record<string, 'default' | 'gold' | 'warning' | 'success'> = {
  pending_ai: 'default', pending_review: 'warning',
  auto_confirmed: 'success', confirmed: 'success', corrected: 'gold',
}

function resolveCategory(inv: Invoice): string | null {
  return inv.confirmed_category ?? inv.ai_suggested_category ?? inv.usali_category ?? null
}

type SortColumn =
  | 'invoice_number' | 'supplier_name' | 'company' | 'category'
  | 'review_status' | 'amount' | 'invoice_date' | 'status'

interface SortState { column: SortColumn; dir: 'asc' | 'desc' }

export default function InvoicesPage() {
  const [rows,    setRows]    = useState<Row[]>([])
  const [role,    setRole]    = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const [filters, setFilters] = useState<InvoiceFilterState>(EMPTY_FILTERS)
  const [sort,    setSort]    = useState<SortState>({ column: 'invoice_date', dir: 'desc' })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      Promise.all([
        supabase
          .from('invoices')
          .select('*, company:companies(id, display_name), venue:venues(id, name, company_id)')
          .eq('is_archived', false)
          .order('invoice_date', { ascending: false })
          .limit(2000),
        user
          ? supabase.from('user_profiles').select('role').eq('id', user.id).single()
          : Promise.resolve({ data: null }),
      ]).then(([{ data, error: err }, { data: profile }]) => {
        if (err) { setError(err.message); setLoading(false); return }
        setRows((data ?? []) as Row[])
        setRole((profile as { role?: string } | null)?.role)
        setLoading(false)
      })
    })
  }, [])

  function patchFilters(patch: Partial<InvoiceFilterState>) {
    setFilters(f => ({ ...f, ...patch }))
  }

  function toggleSort(column: SortColumn) {
    setSort(s => s.column === column
      ? { column, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { column, dir: 'asc' })
  }

  // Companies + venues for the filter dropdowns (derived from loaded rows)
  const { companies, venues } = useMemo(() => {
    const cMap = new Map<string, Pick<Company, 'id' | 'display_name'>>()
    const vMap = new Map<string, Pick<Venue, 'id' | 'name' | 'company_id'>>()
    for (const r of rows) {
      if (r.company) cMap.set(r.company.id, { id: r.company.id, display_name: r.company.display_name })
      if (r.venue)   vMap.set(r.venue.id, { id: r.venue.id, name: r.venue.name, company_id: r.venue.company_id })
    }
    return {
      companies: Array.from(cMap.values()).sort((a, b) => a.display_name.localeCompare(b.display_name)),
      venues:    Array.from(vMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    }
  }, [rows])

  const filtered = useMemo(() => {
    const supplier = filters.supplier.trim().toLowerCase()
    const min = filters.minAmount ? Number(filters.minAmount) : null
    const max = filters.maxAmount ? Number(filters.maxAmount) : null

    return rows.filter(inv => {
      if (filters.companyId && inv.company_id !== filters.companyId) return false
      if (filters.venueId && inv.venue_id !== filters.venueId) return false
      if (supplier && !inv.supplier_name.toLowerCase().includes(supplier)) return false
      if (filters.category && resolveCategory(inv) !== filters.category) return false
      if (filters.reviewStatus) {
        const rs = inv.review_status ?? 'pending_ai'
        if (filters.reviewStatus === 'confirmed') {
          if (rs !== 'confirmed' && rs !== 'auto_confirmed') return false
        } else if (rs !== filters.reviewStatus) return false
      }
      if (min != null && inv.amount_incl_vat < min) return false
      if (max != null && inv.amount_incl_vat > max) return false
      if (filters.dateFrom && inv.invoice_date < filters.dateFrom) return false
      if (filters.dateTo && inv.invoice_date > filters.dateTo) return false
      return true
    })
  }, [rows, filters])

  const sorted = useMemo(() => {
    const dir = sort.dir === 'asc' ? 1 : -1
    const val = (inv: Row): string | number => {
      switch (sort.column) {
        case 'invoice_number': return inv.invoice_number
        case 'supplier_name':  return inv.supplier_name.toLowerCase()
        case 'company':        return inv.company?.display_name?.toLowerCase() ?? ''
        case 'category':       return resolveCategory(inv)?.toLowerCase() ?? ''
        case 'review_status':  return inv.review_status ?? 'pending_ai'
        case 'amount':         return inv.amount_incl_vat
        case 'invoice_date':   return inv.invoice_date
        case 'status':         return inv.status
      }
    }
    return [...filtered].sort((a, b) => {
      const av = val(a), bv = val(b)
      if (av < bv) return -1 * dir
      if (av > bv) return  1 * dir
      return 0
    })
  }, [filtered, sort])

  const totalOutstanding = rows.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount_incl_vat, 0)
  const overdue = rows.filter(i => i.status === 'overdue').length
  const pendingReview = rows.filter(i => i.review_status === 'pending_review').length

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Facturen" subtitle="Alle inkomende facturen">
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span>Openstaand: <span className="text-warning font-medium">{formatCurrency(totalOutstanding, true)}</span></span>
          {overdue > 0 && <span>Vervallen: <span className="text-danger font-medium">{overdue}</span></span>}
          {pendingReview > 0 && (role === 'board' || role === 'accounting') && (
            <Link href="/invoices/review" className="flex items-center gap-1.5 text-warning hover:text-gold transition-colors font-medium">
              <ClipboardList size={13} />{pendingReview} te reviewen
            </Link>
          )}
        </div>
      </TopBar>

      <div className="p-6 flex flex-col gap-4">
        <InvoiceFilters
          filters={filters}
          onChange={patchFilters}
          onReset={() => setFilters(EMPTY_FILTERS)}
          companies={companies}
          venues={venues}
          resultCount={filtered.length}
        />

        {error ? (
          <p className="text-sm text-danger px-1">{error}</p>
        ) : (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wide bg-surface-raised/50">
                    <SortableTh label="Nummer" column="invoice_number" sort={sort} onSort={toggleSort} align="left" px="px-5" />
                    <SortableTh label="Leverancier" column="supplier_name" sort={sort} onSort={toggleSort} align="left" />
                    <SortableTh label="Entiteit" column="company" sort={sort} onSort={toggleSort} align="left" />
                    <SortableTh label="Categorie" column="category" sort={sort} onSort={toggleSort} align="left" />
                    <SortableTh label="AI" column="review_status" sort={sort} onSort={toggleSort} align="left" />
                    <SortableTh label="Bedrag" column="amount" sort={sort} onSort={toggleSort} align="right" />
                    <SortableTh label="Datum" column="invoice_date" sort={sort} onSort={toggleSort} align="left" />
                    <SortableTh label="Status" column="status" sort={sort} onSort={toggleSort} align="left" />
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sorted.map(inv => (
                    <tr key={inv.id} className="hover:bg-surface-raised transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-text-muted">{inv.invoice_number}</td>
                      <td className="px-4 py-3 text-text font-medium max-w-[180px] truncate">{inv.supplier_name}</td>
                      <td className="px-4 py-3 text-text-muted text-xs">{inv.company?.display_name ?? '—'}</td>
                      <td className="px-4 py-3 text-text-muted text-xs max-w-[140px] truncate">
                        {resolveCategory(inv) ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={REVIEW_VARIANT[inv.review_status ?? 'pending_ai']}>
                          {REVIEW_LABEL[inv.review_status ?? 'pending_ai']}
                          {inv.ai_confidence != null && inv.review_status === 'auto_confirmed' && (
                            <span className="ml-1 opacity-70">{Math.round(inv.ai_confidence)}%</span>
                          )}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-text">{formatCurrency(inv.amount_incl_vat)}</td>
                      <td className="px-4 py-3 text-text-muted text-xs">{inv.invoice_date}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[inv.status]}>{STATUS_LABEL[inv.status]}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/invoices/${inv.id}`} className="text-text-faint hover:text-gold transition-colors inline-flex">
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!loading && sorted.length === 0 && (
                    <tr><td colSpan={9} className="px-5 py-8 text-center text-text-muted text-sm">Geen facturen gevonden.</td></tr>
                  )}
                  {loading && (
                    <tr><td colSpan={9} className="px-5 py-8 text-center text-text-muted text-sm animate-pulse">Laden…</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SortableTh({
  label, column, sort, onSort, align, px = 'px-4',
}: {
  label: string
  column: SortColumn
  sort: SortState
  onSort: (c: SortColumn) => void
  align: 'left' | 'right'
  px?: string
}) {
  const active = sort.column === column
  return (
    <th className={cn(px, 'py-3', align === 'right' ? 'text-right' : 'text-left')}>
      <button
        onClick={() => onSort(column)}
        className={cn(
          'inline-flex items-center gap-1 hover:text-text transition-colors',
          align === 'right' && 'flex-row-reverse',
          active ? 'text-gold' : 'text-text-muted',
        )}
      >
        {label}
        {active && (sort.dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
      </button>
    </th>
  )
}
