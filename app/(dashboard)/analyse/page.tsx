import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AnalyseClient } from './analyse-client'

export const dynamic = 'force-dynamic'

// "Vraag het de cijfers" — analysis chat over the validated views.
// Board + accounting only, same gate as the data it can reach. The chat
// can only read; schema/mapping/build work stays in Claude Code.
export default async function AnalysePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single()
  if (!profile || !['board', 'accounting'].includes(profile.role)) redirect('/group')

  return <AnalyseClient />
}
