import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ItemsClient } from './items-client'

export const dynamic = 'force-dynamic'

// Artikelen — price tracking on REAL UBL invoice lines (public.items /
// item_prices over adsolut.mv_ubl_items / mv_ubl_item_prices).
// Cross-supplier comparison only via user-confirmed product groups.
export default async function ItemsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single()
  if (!profile || !['board', 'accounting'].includes(profile.role)) redirect('/group')

  return (
    <main className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text">Artikelen</h1>
        <p className="text-xs text-text-muted mt-0.5">
          Prijsopvolging per artikel uit e-factuurlijnen — vergelijking tussen leveranciers enkel via bevestigde productgroepen.
        </p>
      </div>
      <ItemsClient />
    </main>
  )
}
