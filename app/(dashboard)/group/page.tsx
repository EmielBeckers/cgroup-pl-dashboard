import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GroupTable } from '@/components/pl/group-table'
import { PlEntityRow, YEARS } from '@/lib/pl-live'

export const dynamic = 'force-dynamic'

export default async function GroupPnlPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Server-side role gate (the DB views enforce the same rule — this is
  // the redirect layer, not the security layer).
  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single()
  if (!profile || !['board', 'accounting'].includes(profile.role)) redirect('/dashboard')

  // One request per year keeps each response well under the API row cap.
  const parts = await Promise.all(YEARS.map(y =>
    supabase.from('pl_entity').select('*').eq('calendar_year', y)
  ))
  const rows = parts.flatMap(p => (p.data ?? [])) as PlEntityRow[]

  return (
    <main className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text">Groep P&L</h1>
        <p className="text-xs text-text-muted mt-0.5">
          Alle entiteiten en venues — omzet en resultaat, gevalideerd tegen het grootboek.
        </p>
      </div>
      <Card>
        <CardHeader><CardTitle>Entiteiten &amp; venues</CardTitle></CardHeader>
        <CardContent className="px-0 pb-2">
          <GroupTable entityRows={rows} />
        </CardContent>
      </Card>
    </main>
  )
}
