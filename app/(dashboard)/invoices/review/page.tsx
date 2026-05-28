import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/top-bar'
import { Card, CardContent } from '@/components/ui/card'
import { Invoice } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ReviewRow } from './review-row'

export const dynamic = 'force-dynamic'

export default async function InvoiceReviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['board', 'accounting'].includes(profile.role)) {
    redirect('/invoices')
  }

  const { data: pending } = await supabase
    .from('invoices')
    .select('*')
    .eq('review_status', 'pending_review')
    .eq('is_archived', false)
    .order('ai_categorized_at', { ascending: true })
    .limit(100)

  const rows = (pending ?? []) as Invoice[]

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="AI Review Queue" subtitle={`${rows.length} facturen wachten op beoordeling`}>
        <Link
          href="/invoices"
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-gold transition-colors"
        >
          <ArrowLeft size={13} /> Terug naar facturen
        </Link>
      </TopBar>

      <div className="p-6">
        {rows.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-sm">
            <p className="text-lg mb-2">Alles beoordeeld ✓</p>
            <p className="text-xs text-text-faint">Er zijn geen facturen meer die wachten op beoordeling.</p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border text-text-faint text-xs uppercase tracking-wider">
                      <th className="text-left px-5 py-3">Nummer</th>
                      <th className="text-left px-4 py-3">Leverancier & omschrijving</th>
                      <th className="text-right px-4 py-3">Bedrag</th>
                      <th className="text-left px-4 py-3">AI suggestie</th>
                      <th className="text-left px-4 py-3 min-w-[220px]">Categorie</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(inv => (
                      <ReviewRow
                        key={inv.id}
                        id={inv.id}
                        invoiceNumber={inv.invoice_number}
                        supplierName={inv.supplier_name}
                        description={inv.description}
                        amountInclVat={inv.amount_incl_vat}
                        aiCategory={inv.ai_suggested_category}
                        aiConfidence={inv.ai_confidence}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
