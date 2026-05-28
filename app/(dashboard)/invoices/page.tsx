import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/top-bar'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { Invoice, Company, Venue } from '@/lib/types'
import Link from 'next/link'
import { ArrowRight, ClipboardList } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = { paid: 'Betaald', pending: 'In behandeling', overdue: 'Vervallen' }
const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  paid: 'success', pending: 'warning', overdue: 'danger',
}

const REVIEW_LABEL: Record<string, string> = {
  pending_ai:      'AI pending',
  pending_review:  'Review',
  auto_confirmed:  'Auto ✓',
  confirmed:       'Bevestigd',
  corrected:       'Gecorrigeerd',
}
const REVIEW_VARIANT: Record<string, 'default' | 'gold' | 'warning' | 'success'> = {
  pending_ai:     'default',
  pending_review: 'warning',
  auto_confirmed: 'success',
  confirmed:      'success',
  corrected:      'gold',
}

export default async function InvoicesPage() {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, company:companies(display_name), venue:venues(name)')
    .eq('is_archived', false)
    .order('invoice_date', { ascending: false })
    .limit(200)

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('user_profiles').select('role').eq('id', user.id).single()
    : { data: null }

  const rows = (invoices ?? []) as (Invoice & { company: Company; venue: Venue | null })[]
  const role = (profile as { role?: string } | null)?.role

  const totalOutstanding = rows.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount_incl_vat, 0)
  const overdue = rows.filter(i => i.status === 'overdue').length
  const pendingReview = rows.filter(i => i.review_status === 'pending_review').length

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Facturen" subtitle="Alle inkomende facturen">
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span>Openstaand: <span className="text-warning font-medium">{formatCurrency(totalOutstanding, true)}</span></span>
          {overdue > 0 && (
            <span>Vervallen: <span className="text-danger font-medium">{overdue}</span></span>
          )}
          {pendingReview > 0 && (role === 'board' || role === 'accounting') && (
            <Link
              href="/invoices/review"
              className="flex items-center gap-1.5 text-warning hover:text-gold transition-colors font-medium"
            >
              <ClipboardList size={13} />
              {pendingReview} te reviewen
            </Link>
          )}
        </div>
      </TopBar>

      <div className="p-6">
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Nummer</th>
                  <th className="text-left px-4 py-3">Leverancier</th>
                  <th className="text-left px-4 py-3">Entiteit</th>
                  <th className="text-left px-4 py-3">Categorie</th>
                  <th className="text-left px-4 py-3">AI</th>
                  <th className="text-right px-4 py-3">Bedrag</th>
                  <th className="text-left px-4 py-3">Datum</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(inv => (
                  <tr key={inv.id} className="hover:bg-surface-raised transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-text-muted">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-text font-medium max-w-[180px] truncate">{inv.supplier_name}</td>
                    <td className="px-4 py-3 text-text-muted text-xs">{inv.company?.display_name ?? '—'}</td>
                    <td className="px-4 py-3 text-text-muted text-xs max-w-[140px] truncate">
                      {inv.confirmed_category ?? inv.ai_suggested_category ?? inv.usali_category ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={REVIEW_VARIANT[inv.review_status ?? 'pending_ai']}>
                        {REVIEW_LABEL[inv.review_status ?? 'pending_ai']}
                        {inv.ai_confidence != null && inv.review_status === 'auto_confirmed' && (
                          <span className="ml-1 opacity-70">{Math.round(inv.ai_confidence)}%</span>
                        )}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-text">
                      {formatCurrency(inv.amount_incl_vat)}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs">{inv.invoice_date}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[inv.status]}>
                        {STATUS_LABEL[inv.status]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="text-text-faint hover:text-gold transition-colors inline-flex"
                      >
                        <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-8 text-center text-text-muted text-sm">
                      Geen facturen gevonden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
