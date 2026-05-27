'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail of wachtwoord is onjuist.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-text-muted">E-mailadres</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="naam@cgroup.be"
          className="bg-surface-raised border border-border rounded-md px-3 py-2.5 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-gold transition"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-text-muted">Wachtwoord</label>
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-surface-raised border border-border rounded-md px-3 py-2.5 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-gold transition pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-muted"
          >
            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-danger bg-danger/10 rounded-md px-3 py-2">{error}</p>
      )}

      <Button type="submit" disabled={loading} className="w-full mt-1">
        {loading ? 'Bezig met aanmelden…' : 'Aanmelden'}
      </Button>
    </form>
  )
}
