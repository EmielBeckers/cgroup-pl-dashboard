'use client'

// Emiel's donut design, rewired to the real views: segments come from
// lib/pl-charts-data.donutSegments() (block sums of pl_entity/pl_venue
// rows), the mock PlSnapshot layer is gone.

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { DonutSegment } from '@/lib/pl-charts-data'

interface Props { segments: DonutSegment[]; revenue: number }

export function CostDonut({ segments, revenue }: Props) {
  if (revenue <= 0 || segments.length === 0) {
    return <p className="text-sm text-text-muted py-10 text-center">Geen omzet om te tonen.</p>
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="w-[180px] h-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={84}
              paddingAngle={1.5}
              stroke="none"
            >
              {segments.map(seg => <Cell key={seg.key} fill={seg.color} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #e5e0d8', borderRadius: 8, fontSize: 12, color: '#1c1814' }}
              formatter={(v) => [formatCurrency(Number(v)), '']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex-1 flex flex-col gap-2 w-full">
        {segments.map(seg => {
          const per100 = Math.round((seg.value / revenue) * 100)
          return (
            <li key={seg.key} className="flex items-center gap-2.5 text-sm">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
              <span className="text-text font-medium">{seg.name}</span>
              <span className="ml-auto text-text-muted text-xs tabular-nums">
                €{per100} van elke €100 omzet
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
