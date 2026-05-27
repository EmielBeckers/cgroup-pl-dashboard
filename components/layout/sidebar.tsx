'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Building2, MapPin, FileText, LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UserProfile } from '@/lib/types'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/companies', label: 'Entiteiten', icon: Building2 },
  { href: '/venues',    label: 'Venues',     icon: MapPin },
  { href: '/invoices',  label: 'Facturen',   icon: FileText },
]

export function Sidebar({ profile }: { profile: UserProfile | null }) {
  const pathname = usePathname()
  const router   = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-surface border-r border-border h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border">
        <p className="text-xs text-text-muted uppercase tracking-widest">C.Group</p>
        <p className="text-lg font-semibold text-gold leading-tight">P&L Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-gold/10 text-gold font-medium'
                  : 'text-text-muted hover:text-text hover:bg-surface-raised'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User + sign out */}
      <div className="px-4 py-4 border-t border-border">
        {profile && (
          <p className="text-xs text-text-muted mb-3 truncate">
            {profile.full_name}
            <span className="ml-1 capitalize text-text-faint">· {profile.role}</span>
          </p>
        )}
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-xs text-text-muted hover:text-danger transition-colors w-full"
        >
          <LogOut size={13} /> Uitloggen
        </button>
      </div>
    </aside>
  )
}
