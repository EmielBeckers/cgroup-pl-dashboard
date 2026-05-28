import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Company, UserProfile } from '@/lib/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: companies }] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('companies').select('id,display_name,name').eq('is_active', true).order('display_name'),
  ])

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar
        profile={profile as UserProfile | null}
        companies={(companies ?? []) as Pick<Company, 'id' | 'display_name' | 'name'>[]}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  )
}
