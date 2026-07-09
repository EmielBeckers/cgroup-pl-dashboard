'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ChartsSection({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs text-text-muted hover:text-text transition-colors self-start"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <BarChart3 size={14} />
        <span className="uppercase tracking-widest font-semibold">
          {open ? 'Grafieken verbergen' : 'Grafieken tonen'}
        </span>
      </button>
      <div className={cn('flex-col gap-4', open ? 'flex' : 'hidden')}>
        {children}
      </div>
    </div>
  )
}
