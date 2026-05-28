'use client'

import { useState, useTransition } from 'react'
import { Check, X, ChevronDown } from 'lucide-react'
import { USALI_EXPENSE_CATEGORIES } from '@/lib/pl-structure'
import { formatCurrency } from '@/lib/utils'
import { confirmInvoiceCategory, correctInvoiceCategory } from './actions'

interface Props {
  id: string
  invoiceNumber: string
  supplierName: string
  description: string | null
  amountInclVat: number
  aiCategory: string | null
  aiConfidence: number | null
}

export function ReviewRow({
  id, invoiceNumber, supplierName, description, amountInclVat, aiCategory, aiConfidence,
}: Props) {
  const [pending, startTransition] = useTransition()
  const [selected, setSelected] = useState(aiCategory ?? '')
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <tr className="opacity-50">
        <td colSpan={6} className="px-5 py-3 text-xs text-text-faint text-center">Opgeslagen</td>
      </tr>
    )
  }

  function accept() {
    if (!selected) return
    startTransition(async () => {
      await confirmInvoiceCategory(id, selected)
      setDone(true)
    })
  }

  function correct() {
    if (!selected || selected === aiCategory) return
    startTransition(async () => {
      await correctInvoiceCategory(id, selected)
      setDone(true)
    })
  }

  const isChanged = selected !== aiCategory

  return (
    <tr className="border-b border-border hover:bg-surface-raised/40">
      <td className="px-5 py-3 font-mono text-xs text-text-muted w-[120px]">{invoiceNumber}</td>
      <td className="px-4 py-3">
        <p className="text-sm text-text font-medium truncate max-w-[200px]">{supplierName}</p>
        {description && (
          <p className="text-xs text-text-muted truncate max-w-[200px] mt-0.5">{description}</p>
        )}
      </td>
      <td className="px-4 py-3 tabular-nums text-right text-sm text-text">
        {formatCurrency(amountInclVat)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-text-muted">{aiCategory ?? '—'}</span>
          {aiConfidence != null && (
            <span className={aiConfidence >= 90 ? 'text-success' : 'text-warning'}>
              {Math.round(aiConfidence)}%
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 min-w-[220px]">
        <div className="relative">
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            disabled={pending}
            className="w-full appearance-none bg-surface-overlay border border-border rounded px-3 py-1.5 text-xs text-text pr-7 focus:outline-none focus:border-gold disabled:opacity-50"
          >
            <option value="">— kies categorie —</option>
            {USALI_EXPENSE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none" />
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={isChanged ? correct : accept}
            disabled={!selected || pending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-gold/10 text-gold hover:bg-gold/20 transition-colors disabled:opacity-40"
          >
            <Check size={12} />
            {isChanged ? 'Corrigeer' : 'Bevestig'}
          </button>
          <button
            onClick={() => setSelected(aiCategory ?? '')}
            disabled={!isChanged || pending}
            className="flex items-center gap-1 text-xs text-text-faint hover:text-text-muted transition-colors disabled:opacity-30"
          >
            <X size={12} /> Reset
          </button>
        </div>
      </td>
    </tr>
  )
}
