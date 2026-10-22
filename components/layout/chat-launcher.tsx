'use client'

// Floating "Vraag het de cijfers" launcher, rendered on every dashboard
// page for board/accounting. Opens the SAME chat (same route, same guard,
// same conversation tables) in a drawer over the current page — a UI
// surface only, no new data path. Stays mounted once opened so the
// conversation survives open/close while navigating.

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessagesSquare, X } from 'lucide-react'
import { AnalyseClient } from '@/app/(dashboard)/analyse/analyse-client'
import { cn } from '@/lib/utils'

export function ChatLauncher({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  if (!enabled || pathname === '/analyse') return null

  return (
    <>
      <button
        onClick={() => { setMounted(true); setOpen(true) }}
        title="Vraag het de cijfers"
        className={cn(
          'fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full',
          'bg-gold text-white shadow-lg transition-transform hover:scale-105',
          open && 'hidden',
        )}
      >
        <MessagesSquare size={18} />
      </button>

      {mounted && (
        <div className={cn('fixed inset-0 z-50', open ? '' : 'pointer-events-none')}>
          <div
            onClick={() => setOpen(false)}
            className={cn('absolute inset-0 bg-black/20 transition-opacity',
              open ? 'opacity-100' : 'opacity-0')}
          />
          <div className={cn(
            'absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-border',
            'bg-bg shadow-2xl transition-transform duration-200',
            open ? 'translate-x-0' : 'translate-x-full',
          )}>
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-2.5 z-10 rounded p-1 text-text-faint hover:text-text"
              title="Sluiten"
            >
              <X size={15} />
            </button>
            <div className="min-h-0 flex-1">
              <AnalyseClient variant="drawer" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
