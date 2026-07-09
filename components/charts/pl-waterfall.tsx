'use client'

// Emiel's waterfall design, rewired to the real views: steps come from
// lib/pl-charts-data.waterfallSteps() (the statement's own block sums) and
// carry the statement's honest labels — "Operationeel" is the resultaat
// vóór non-operating, never GOP/EBITDA.

import { formatCurrency } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts'
import { WaterfallStep } from '@/lib/pl-charts-data'

interface Props { steps: WaterfallStep[]; revenue: number }

export function PlWaterfall({ steps, revenue }: Props) {
  if (revenue <= 0 || steps.length === 0) {
    return <p className="text-sm text-text-muted py-10 text-center">Geen omzet om te tonen.</p>
  }

  const data = steps.map(st => {
    const base = Math.min(st.start, st.end)
    const height = Math.abs(st.end - st.start)
    const delta = st.end - st.start
    return {
      label: st.label,
      base,
      height,
      color: st.color,
      // tooltip: deductions signed, levels absolute
      tipValue: st.kind === 'cost' ? delta : st.end,
      pct: revenue > 0 ? (st.end / revenue) * 100 : 0,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid stroke="#e5e0d8" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#6b6560', fontSize: 10 }}
          axisLine={{ stroke: '#e5e0d8' }}
          tickLine={false}
          interval={0}
        />
        <YAxis
          tick={{ fill: '#a09890', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => formatCurrency(v, true)}
          width={56}
        />
        <Tooltip
          cursor={{ fill: '#f0ede6' }}
          contentStyle={{ background: '#ffffff', border: '1px solid #e5e0d8', borderRadius: 8, fontSize: 12, color: '#1c1814' }}
          labelStyle={{ color: '#6b6560', fontSize: 11, marginBottom: 2 }}
          formatter={(_v, _n, item) => {
            const d = item?.payload as { tipValue: number; pct: number }
            return [`${formatCurrency(d.tipValue)} · ${d.pct.toFixed(0)}% van omzet`, '']
          }}
        />
        {/* Transparent base lifts each floating bar to its running position */}
        <Bar dataKey="base" stackId="wf" fill="transparent" />
        <Bar dataKey="height" stackId="wf" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.9} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
