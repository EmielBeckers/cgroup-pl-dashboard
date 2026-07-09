import { AlertTriangle } from 'lucide-react'

/**
 * Renders a hotel-view caveat visibly. The caveat text comes from the data
 * rows (adsolut.v_pnl_hotel via public.pl_hotel) — never hardcoded here —
 * so a labour-only contribution can never render without its warning.
 */
export function CaveatBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 align-middle">
      <AlertTriangle size={10} className="shrink-0" />
      niet GOP
    </span>
  )
}

export function CaveatNote({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-1.5 text-[11px] leading-snug text-amber-800 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5 my-1">
      <AlertTriangle size={12} className="shrink-0 mt-0.5" />
      <span>{text}</span>
    </p>
  )
}
