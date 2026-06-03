'use client'

import { Company, Venue } from '@/lib/types'
import { USALI_EXPENSE_CATEGORIES } from '@/lib/pl-structure'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

export interface InvoiceFilterState {
  companyId: string
  venueId: string
  supplier: string
  category: string
  reviewStatus: string
  minAmount: string
  maxAmount: string
  dateFrom: string
  dateTo: string
}

export const EMPTY_FILTERS: InvoiceFilterState = {
  companyId: '', venueId: '', supplier: '', category: '',
  reviewStatus: '', minAmount: '', maxAmount: '', dateFrom: '', dateTo: '',
}

export const REVIEW_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '',               label: 'Alle' },
  { value: 'pending_ai',     label: 'AI pending' },
  { value: 'pending_review', label: 'In behandeling' },
  { value: 'confirmed',      label: 'Bevestigd' },
  { value: 'corrected',      label: 'Gecorrigeerd' },
]

const inputClass = cn(
  'h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-text',
  'focus:outline-none focus:ring-1 focus:ring-gold/50 placeholder:text-text-faint',
)
const selectClass = cn(inputClass, 'appearance-none cursor-pointer pr-6')

interface Props {
  filters: InvoiceFilterState
  onChange: (patch: Partial<InvoiceFilterState>) => void
  onReset: () => void
  companies: Pick<Company, 'id' | 'display_name'>[]
  venues: Pick<Venue, 'id' | 'name' | 'company_id'>[]
  resultCount: number
}

export function InvoiceFilters({ filters, onChange, onReset, companies, venues, resultCount }: Props) {
  // Venue dropdown narrows to the selected entity, else shows all
  const venueOptions = filters.companyId
    ? venues.filter(v => v.company_id === filters.companyId)
    : venues

  const isActive = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS)

  return (
    <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        {/* Entiteit */}
        <Field label="Entiteit">
          <select
            className={selectClass}
            value={filters.companyId}
            onChange={e => onChange({ companyId: e.target.value, venueId: '' })}
          >
            <option value="">Alle entiteiten</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
          </select>
        </Field>

        {/* Venue */}
        <Field label="Venue">
          <select
            className={selectClass}
            value={filters.venueId}
            onChange={e => onChange({ venueId: e.target.value })}
          >
            <option value="">Alle venues</option>
            {venueOptions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </Field>

        {/* Leverancier */}
        <Field label="Leverancier">
          <input
            className={inputClass}
            placeholder="Zoek leverancier…"
            value={filters.supplier}
            onChange={e => onChange({ supplier: e.target.value })}
          />
        </Field>

        {/* Categorie */}
        <Field label="Categorie">
          <select
            className={selectClass}
            value={filters.category}
            onChange={e => onChange({ category: e.target.value })}
          >
            <option value="">Alle categorieën</option>
            {USALI_EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        {/* Status */}
        <Field label="Status">
          <select
            className={selectClass}
            value={filters.reviewStatus}
            onChange={e => onChange({ reviewStatus: e.target.value })}
          >
            {REVIEW_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>

        {/* Bedrag */}
        <Field label="Bedrag (€)">
          <div className="flex items-center gap-1">
            <input
              type="number" inputMode="numeric"
              className={cn(inputClass, 'w-20')}
              placeholder="min"
              value={filters.minAmount}
              onChange={e => onChange({ minAmount: e.target.value })}
            />
            <span className="text-text-faint text-xs">–</span>
            <input
              type="number" inputMode="numeric"
              className={cn(inputClass, 'w-20')}
              placeholder="max"
              value={filters.maxAmount}
              onChange={e => onChange({ maxAmount: e.target.value })}
            />
          </div>
        </Field>

        {/* Datum */}
        <Field label="Datum">
          <div className="flex items-center gap-1">
            <input
              type="date"
              className={cn(inputClass, 'w-[130px]')}
              value={filters.dateFrom}
              onChange={e => onChange({ dateFrom: e.target.value })}
            />
            <span className="text-text-faint text-xs">→</span>
            <input
              type="date"
              className={cn(inputClass, 'w-[130px]')}
              value={filters.dateTo}
              onChange={e => onChange({ dateTo: e.target.value })}
            />
          </div>
        </Field>
      </div>

      <div className="flex items-center justify-between border-t border-border-subtle pt-3">
        <p className="text-xs text-text-muted">
          <span className="font-medium text-text">{resultCount}</span> facturen gevonden
        </p>
        {isActive && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-danger transition-colors"
          >
            <X size={13} /> Reset filters
          </button>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-text-faint font-medium">{label}</span>
      {children}
    </label>
  )
}
