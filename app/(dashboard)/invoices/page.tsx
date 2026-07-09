import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InvoicesClient } from './invoices-client'

export const dynamic = 'force-dynamic'

// Facturen — REAL supplier invoices from the ledger (public.invoices over
// adsolut.bllever + leveranc + ubl_documents). The old mock invoices table
// and its review/AI-categorise pages are gone.
export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single()
  if (!profile || !['board', 'accounting'].includes(profile.role)) redirect('/group')

  const { data: dossiers } = await supabase.from('pl_dossiers').select('dossier_code')

  return (
    <main className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text">Facturen</h1>
        <p className="text-xs text-text-muted mt-0.5">
          Leveranciersfacturen uit het aankoopdagboek — met e-documentlijnen waar die bestaan.
        </p>
      </div>
      <InvoicesClient dossiers={(dossiers ?? []).map(d => d.dossier_code as string).sort()} />
    </main>
  )
}
