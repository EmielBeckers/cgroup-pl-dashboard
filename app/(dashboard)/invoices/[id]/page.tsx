import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/top-bar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = { paid: 'Betaald', pending: 'In behandeling', overdue: 'Vervallen' }
const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  paid: 'success', pending: 'warning', overdue: 'danger',
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, company:companies(display_name), venue:venues(name)')
    .eq('id', id)
    .single()

  if (!invoice) notFound()

  const rows = [
    { label: 'Factuurnummer', value: invoice.invoice_number },
    { label: 'Leverancier', value: invoice.supplier_name },
    { label: 'Entiteit', value: invoice.company?.display_name ?? '—' },
    { label: 'Venue', value: invoice.venue?.name ?? '—' },
    { label: 'USALI-categorie', value: invoice.usali_category ?? '—' },
    { label: 'Factuurdatum', value: invoice.invoice_date },
    { label: 'Vervaldag', value: invoice.due_date ?? '—' },
    { label: 'Bedrag excl. BTW', value: formatCurrency(invoice.amount_excl_vat) },
    { label: 'BTW', value: formatCurrency(invoice.vat_amount) },
    { label: 'Bedrag incl. BTW', value: formatCurrency(invoice.amount_incl_vat) },
  ]

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Factuurdetail" subtitle={invoice.supplier_name}>
        <Link
          href="/invoices"
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-gold transition-colors"
        >
          <ArrowLeft size={13} /> Terug naar facturen
        </Link>
      </TopBar>

      <div className="p-6 max-w-2xl flex flex-col gap-6">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-overlay flex items-center justify-center">
                  <FileText size={18} className="text-gold" />
                </div>
                <div>
                  <p className="font-semibold text-text">{invoice.invoice_number}</p>
                  <p className="text-xs text-text-muted">{invoice.supplier_name}</p>
                </div>
              </div>
              <Badge variant={STATUS_VARIANT[invoice.status]}>
                {STATUS_LABEL[invoice.status]}
              </Badge>
            </div>

            <dl className="divide-y divide-border">
              {rows.map(({ label, value }) => (
                <div key={label} className="flex justify-between py-3">
                  <dt className="text-sm text-text-muted">{label}</dt>
                  <dd className="text-sm text-text font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {invoice.pdf_url ? (
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-text-muted uppercase tracking-widest mb-3">Factuur PDF</p>
              <iframe
                src={invoice.pdf_url}
                className="w-full h-96 rounded border border-border bg-surface-raised"
                title="Factuur PDF"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="border border-dashed border-border rounded-lg p-8 text-center text-text-faint text-sm">
            Geen PDF beschikbaar — wordt automatisch toegevoegd wanneer Adsolut API actief is.
          </div>
        )}
      </div>
    </div>
  )
}
