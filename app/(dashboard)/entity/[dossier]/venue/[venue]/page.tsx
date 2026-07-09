import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VenueStatement } from '@/components/pl/venue-statement'
import { PlVenueRow, YEARS, VENUE_ENTITIES, entityName, venueName } from '@/lib/pl-live'

export const dynamic = 'force-dynamic'

// One venue's P&L — the same pl_venue rows the entity drill shows, on its
// own page. Only venue codes that exist in pl_venues resolve; anything
// else 404s (no invented venues).
export default async function VenuePage({ params }: { params: Promise<{ dossier: string; venue: string }> }) {
  const { dossier, venue: rawVenue } = await params
  const venue = decodeURIComponent(rawVenue)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single()
  if (!profile || !['board', 'accounting'].includes(profile.role)) redirect('/group')

  // Venue pages exist only for the GREEN-validated venue entities — the
  // hotel blanpla slices in pl_venues are not standalone venue P&Ls.
  if (!VENUE_ENTITIES.includes(dossier)) notFound()
  const { data: known } = await supabase.from('pl_venues')
    .select('venue').eq('dossier_code', dossier).eq('venue', venue)
  if (!known || known.length === 0) notFound()

  const parts = await Promise.all(YEARS.map(y =>
    supabase.from('pl_venue').select('*')
      .eq('dossier_code', dossier).eq('venue', venue).eq('calendar_year', y)
  ))
  const rows = parts.flatMap(p => (p.data ?? [])) as PlVenueRow[]

  return (
    <main className="p-6 space-y-4">
      <div>
        <p className="text-xs text-text-muted">
          <Link href={`/entity/${dossier}`} className="hover:text-gold">{entityName(dossier)}</Link>
          {' / '}
        </p>
        <h1 className="text-xl font-semibold text-text">{venueName(venue)}</h1>
        <p className="text-xs text-text-muted mt-0.5">
          Venue-P&L uit de gevalideerde adsolut-views — enkel boekingen die via de analytische
          verdeling (of gedateerde rekeningregels) aan deze venue zijn toegewezen.
          Niet-verdeelde groepskosten staan bij de entiteit onder “Unallocated”, niet hier.
        </p>
      </div>
      <Card>
        <CardHeader><CardTitle>USALI P&L — {venueName(venue)}</CardTitle></CardHeader>
        <CardContent className="px-0 pb-2">
          <VenueStatement rows={rows} dossier={dossier} />
        </CardContent>
      </Card>
    </main>
  )
}
