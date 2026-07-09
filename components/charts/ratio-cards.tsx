'use client'

// Emiel's traffic-light cards, rewired to the real views: the percentages
// come from lib/pl-charts-data.plRatios() — food/beverage cost against the
// mapping's own Food/Beverage revenue and Cost of Sales lines, and the
// operationele marge (resultaat vóór non-operating / omzet, never "GOP").
// The green/orange/red thresholds are display norms, not data.

import { cn } from '@/lib/utils'
import { PlRatios } from '@/lib/pl-charts-data'

type Status = 'green' | 'orange' | 'red'

const STATUS_STYLE: Record<Status, { dot: string; text: string; ring: string }> = {
  green:  { dot: 'bg-success', text: 'text-success', ring: 'ring-success/20' },
  orange: { dot: 'bg-warning', text: 'text-warning', ring: 'ring-warning/20' },
  red:    { dot: 'bg-danger',  text: 'text-danger',  ring: 'ring-danger/20' },
}

function TrafficLightCard({
  label, pct, status, explanation,
}: {
  label: string
  pct: number | null
  status: Status | null
  explanation: string
}) {
  const style = status ? STATUS_STYLE[status] : null
  return (
    <div className={cn(
      'bg-surface border border-border rounded-lg px-5 py-4 flex flex-col gap-2',
      style && `ring-1 ${style.ring}`,
    )}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-text-muted uppercase tracking-widest">{label}</p>
        {style && <span className={cn('w-3 h-3 rounded-full', style.dot)} />}
      </div>
      <p className={cn('text-3xl font-semibold tabular-nums', style ? style.text : 'text-text-faint')}>
        {pct == null ? '—' : `${pct.toFixed(1)}%`}
      </p>
      <p className="text-xs text-text-muted leading-snug">{explanation}</p>
    </div>
  )
}

function statusFor(pct: number | null, green: (v: number) => boolean, red: (v: number) => boolean): Status | null {
  if (pct == null) return null
  if (green(pct)) return 'green'
  if (red(pct)) return 'red'
  return 'orange'
}

export function RatioCards({ ratios }: { ratios: PlRatios }) {
  const { foodPct: food, bevPct: bev, opMarginPct: op } = ratios

  const foodEur = food != null ? Math.round(food) : null
  const bevEur  = bev != null ? Math.round(bev) : null
  const opEur   = op != null ? Math.round(op) : null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <TrafficLightCard
        label="Voedingskost"
        pct={food}
        status={statusFor(food, v => v < 32, v => v > 38)}
        explanation={foodEur != null
          ? `Van elke €100 die we met eten verdienen, gaat €${foodEur} naar ingrediënten.`
          : 'Geen voedingsomzet in deze periode.'}
      />
      <TrafficLightCard
        label="Drankkost"
        pct={bev}
        status={statusFor(bev, v => v < 25, v => v > 30)}
        explanation={bevEur != null
          ? `Van elke €100 drankomzet gaat €${bevEur} naar de inkoop van drank.`
          : 'Geen drankomzet in deze periode.'}
      />
      <TrafficLightCard
        label="Operationele marge"
        pct={op}
        status={statusFor(op, v => v > 20, v => v < 12)}
        explanation={opEur != null
          ? `Van elke €100 omzet blijft €${opEur} over vóór non-operating (geen GOP/EBITDA).`
          : 'Geen omzet in deze periode.'}
      />
    </div>
  )
}
