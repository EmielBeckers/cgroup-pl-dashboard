import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { UserProfile } from '@/lib/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Entity list comes from the REAL data (adsolut dossiers via the
  // role-gated pl_dossiers view) — never from the mock companies table.
  // pl_venues lists the venues that actually have bookings per entity;
  // the meta buckets (UNALLOCATED/ALGEMEEN/INTRAGROUP) are filtered in the
  // sidebar — they stay visible in the P&L drill itself.
  const [{ data: profile }, { data: dossiers }, { data: venues }] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('pl_dossiers').select('dossier_code'),
    supabase.from('pl_venues').select('dossier_code, venue'),
  ])

  const venuesByDossier: Record<string, string[]> = {}
  for (const v of venues ?? []) {
    ;(venuesByDossier[v.dossier_code as string] ??= []).push(v.venue as string)
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar
        profile={profile as UserProfile | null}
        dossiers={(dossiers ?? []).map(d => d.dossier_code as string).sort()}
        venuesByDossier={venuesByDossier}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  )
}
