import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LeveranciersClient } from './leveranciers-client'

export const dynamic = 'force-dynamic'

export default async function LeveranciersPage() {
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

  return <LeveranciersClient />
}
