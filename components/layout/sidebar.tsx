'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Building2, LogOut, ChevronDown, ChevronRight, Layers, ReceiptText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UserProfile } from '@/lib/types'
import { entityName, venueName, META_VENUES } from '@/lib/pl-live'
import { useState } from 'react'

interface SidebarProps {
  profile: UserProfile | null
  // REAL entities only — dossier codes from the role-gated pl_dossiers view.
  // The mock companies list (with fictional entities) is retired.
  dossiers: string[]
  // Venues with real bookings per entity (public.pl_venues) — attribution
  // buckets (UNALLOCATED etc.) are filtered here, not in the P&L drill.
  venuesByDossier: Record<string, string[]>
}

export function Sidebar({ profile, dossiers, venuesByDossier }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const [entitiesOpen, setEntitiesOpen] = useState(true)
  const canSeePnl = profile?.role === 'board' || profile?.role === 'accounting'

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-surface border-r border-border h-screen sticky top-0 overflow-y-auto">
      <div className="px-5 py-5 border-b border-border shrink-0">
        <p className="text-[10px] text-text-faint uppercase tracking-widest">C.Group</p>
        <p className="text-base font-semibold text-gold leading-tight mt-0.5">P&L Dashboard</p>
      </div>

      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
        {canSeePnl && (
          <Link href="/group" className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
            (pathname === '/group' || pathname === '/dashboard') ? 'bg-gold/10 text-gold font-medium' : 'text-text-muted hover:text-text hover:bg-surface-raised',
          )}>
            <Layers size={15} />
            Groep P&L
          </Link>
        )}

        {canSeePnl && dossiers.length > 0 && (
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
                {dossiers.map(d => {
                  const active = pathname === `/entity/${d}`
                  const venues = (venuesByDossier[d] ?? [])
                    .filter(v => !META_VENUES.includes(v))
                    .sort((a, b) => venueName(a).localeCompare(venueName(b)))
                  const inEntity = pathname.startsWith(`/entity/${d}`)
                  return (
                    <div key={d}>
                      <Link href={`/entity/${d}`} className={cn(
                        'block pl-8 pr-3 py-1.5 text-xs rounded-md transition-colors truncate',
                        active ? 'text-gold bg-gold/10 font-medium' : 'text-text-muted hover:text-text hover:bg-surface-raised',
                      )}>
                        {entityName(d)}
                      </Link>
                      {inEntity && venues.length > 1 && venues.map(v => {
                        const vActive = pathname === `/entity/${d}/venue/${v}`
                        return (
                          <Link key={v} href={`/entity/${d}/venue/${v}`} className={cn(
                            'block pl-12 pr-3 py-1 text-[11px] rounded-md transition-colors truncate',
                            vActive ? 'text-gold bg-gold/10 font-medium' : 'text-text-faint hover:text-text hover:bg-surface-raised',
                          )}>
                            {venueName(v)}
                          </Link>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        {canSeePnl && (
          <Link href="/invoices" className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors mt-1',
            pathname === '/invoices' ? 'bg-gold/10 text-gold font-medium' : 'text-text-muted hover:text-text hover:bg-surface-raised',
          )}>
            <ReceiptText size={15} />
            Facturen
          </Link>
        )}
        {!canSeePnl && (
          <p className="px-3 py-2 text-xs text-text-faint">
            Geen rapporten beschikbaar voor jouw rol.
          </p>
        )}
      </nav>

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
