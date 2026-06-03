'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Building2, MapPin, FileText, Truck, LogOut, ChevronDown, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Company, UserProfile } from '@/lib/types'
import { useState } from 'react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/venues',    label: 'Venues',     icon: MapPin },
  { href: '/invoices',  label: 'Facturen',   icon: FileText },
]

interface SidebarProps {
  profile: UserProfile | null
  companies: Pick<Company, 'id' | 'display_name' | 'name'>[]
}

export function Sidebar({ profile, companies }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [entitiesOpen, setEntitiesOpen] = useState(true)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-surface border-r border-border h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border shrink-0">
        <p className="text-[10px] text-text-faint uppercase tracking-widest">C.Group</p>
        <p className="text-base font-semibold text-gold leading-tight mt-0.5">P&L Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
        {/* Dashboard */}
        {NAV.slice(0, 1).map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
              active ? 'bg-gold/10 text-gold font-medium' : 'text-text-muted hover:text-text hover:bg-surface-raised',
            )}>
              <Icon size={15} />
              {label}
            </Link>
          )
        })}

        {/* Entities collapsible */}
        <div className="mt-1">
          <button
            onClick={() => setEntitiesOpen(o => !o)}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-text-faint hover:text-text-muted transition-colors"
          >
            {entitiesOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <Building2 size={13} />
            <span className="text-[11px] uppercase tracking-widest font-semibold">Entiteiten</span>
          </button>
          {entitiesOpen && (
            <div className="mt-0.5 flex flex-col gap-0">
              {companies.map(c => {
                const active = pathname === `/companies/${c.id}` || pathname.startsWith(`/companies/${c.id}/`)
                return (
                  <Link key={c.id} href={`/companies/${c.id}`} className={cn(
                    'pl-8 pr-3 py-1.5 text-xs rounded-md transition-colors truncate',
                    active ? 'text-gold bg-gold/10 font-medium' : 'text-text-muted hover:text-text hover:bg-surface-raised',
                  )}>
                    {c.display_name}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Remaining nav items */}
        {NAV.slice(1).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors mt-1',
              active ? 'bg-gold/10 text-gold font-medium' : 'text-text-muted hover:text-text hover:bg-surface-raised',
            )}>
              <Icon size={15} />
              {label}
            </Link>
          )
        })}

        {/* Leveranciers — Board + Accounting only */}
        {(profile?.role === 'board' || profile?.role === 'accounting') && (() => {
          const active = pathname === '/leveranciers' || pathname.startsWith('/leveranciers/')
          return (
            <Link href="/leveranciers" className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors mt-1',
              active ? 'bg-gold/10 text-gold font-medium' : 'text-text-muted hover:text-text hover:bg-surface-raised',
            )}>
              <Truck size={15} />
              Leveranciers
            </Link>
          )
        })()}
      </nav>

      {/* User + sign out */}
      <div className="px-4 py-4 border-t border-border shrink-0">
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
