import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EntityDetail } from '@/components/pl/entity-detail'
import { PlCharts } from '@/components/charts/pl-charts'
import { PlEntityRow, PlVenueRow, PlHotelRow, YEARS, VENUE_ENTITIES, HOTEL_ENTITIES, entityName } from '@/lib/pl-live'
import { PlMonthRow } from '@/lib/pl-charts-data'

export const dynamic = 'force-dynamic'

export default async function EntityPage({ params }: { params: Promise<{ dossier: string }> }) {
  const { dossier } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single()
  if (!profile || !['board', 'accounting'].includes(profile.role)) redirect('/group')

  // Real dossiers only — anything else 404s.
  const { data: dossiers } = await supabase.from('pl_dossiers').select('dossier_code')
  if (!(dossiers ?? []).some(d => d.dossier_code === dossier)) notFound()

  const [monthPart, ...entityParts] = await Promise.all([
    supabase.from('pl_month').select('*').eq('dossier_code', dossier).gte('month', '2023-01-01'),
    ...YEARS.map(y =>
      supabase.from('pl_entity').select('*').eq('dossier_code', dossier).eq('calendar_year', y)
    ),
  ])
  const entityRows = entityParts.flatMap(p => (p.data ?? [])) as PlEntityRow[]
  const monthRows = (monthPart.data ?? []) as PlMonthRow[]

  let venueRows: PlVenueRow[] | null = null
  if (VENUE_ENTITIES.includes(dossier)) {
    const parts = await Promise.all(YEARS.map(y =>
      supabase.from('pl_venue').select('*').eq('dossier_code', dossier).eq('calendar_year', y)
    ))
    venueRows = parts.flatMap(p => (p.data ?? [])) as PlVenueRow[]
  }
  let hotelRows: PlHotelRow[] | null = null
  if (HOTEL_ENTITIES.includes(dossier)) {
    const { data } = await supabase.from('pl_hotel').select('*')
      .eq('dossier_code', dossier).in('calendar_year', [...YEARS])
    hotelRows = (data ?? []) as PlHotelRow[]
  }

  return (
    <main className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text">{entityName(dossier)}</h1>
        <p className="text-xs text-text-muted mt-0.5">
          P&L uit de gevalideerde adsolut-views — sluit aan op het grootboek excl. 69x/79x.
        </p>
      </div>
      <PlCharts name={entityName(dossier)} entityRows={entityRows} monthRows={monthRows} />
      <Card>
        <CardHeader><CardTitle>USALI P&L</CardTitle></CardHeader>
        <CardContent className="px-0 pb-2">
          <EntityDetail dossier={dossier} entityRows={entityRows} venueRows={venueRows} hotelRows={hotelRows} />
        </CardContent>
      </Card>
    </main>
  )
}
