import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompareClient } from './compare-client'

export const dynamic = 'force-dynamic'

// Venue comparison — side-by-side USALI columns for any venues (cross-
// entity allowed) and years. Same role gate as everything else; the data
// is the same pl_venue rows the venue statements render.
export default async function ComparePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single()
  if (!profile || !['board', 'accounting'].includes(profile.role)) redirect('/group')

  const { data: venues } = await supabase.from('pl_venues').select('dossier_code, venue')

  return (
    <main className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text">Vergelijk venues</h1>
        <p className="text-xs text-text-muted mt-0.5">
          USALI-kolommen naast elkaar — zelfde gevalideerde viewrijen als de venue-P&L&apos;s.
        </p>
      </div>
      <CompareClient allVenues={(venues ?? []) as { dossier_code: string; venue: string }[]} />
    </main>
  )
}
