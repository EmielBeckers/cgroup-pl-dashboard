import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LoginForm from './login-form'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-10">
          <p className="text-xs text-text-muted uppercase tracking-widest mb-1">C.Group</p>
          <h1 className="text-2xl font-semibold text-text">P&L Dashboard</h1>
          <p className="text-sm text-text-muted mt-2">Aanmelden om verder te gaan</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-7 shadow-lg">
          <LoginForm />
        </div>

        <p className="text-center text-xs text-text-faint mt-6">
          Problemen met aanmelden? Contacteer de beheerder.
        </p>
      </div>
    </main>
  )
}
