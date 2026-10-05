'use client'

import { Bar, ComposedChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import type { AdoptionRow } from '@/lib/staff-discount'

// Weekly trend for the whole group ('ALL' rows of v_discount_adoption):
// cumulative share of eligible colleagues with ≥1 use, plus how many used the
// discount in that week. Values are plotted exactly as the view returns them.
export function AdoptionTrend({ rows }: { rows: AdoptionRow[] }) {
  const data = rows.map(r => ({
    week: r.iso_week.replace(/^\d{4}-/, ''),
    pct: r.used_cumulative_pct ?? 0,
    inWeek: r.used_in_week_count,
  }))
  if (data.length === 0) return null
  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#e5e0d8" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="week" tick={{ fill: '#6b6560', fontSize: 10 }} axisLine={{ stroke: '#e5e0d8' }} tickLine={false} />
        <YAxis yAxisId="pct" tick={{ fill: '#a09890', fontSize: 10 }} axisLine={false} tickLine={false}
               tickFormatter={v => `${v}%`} width={40} domain={[0, 'auto']} />
        <YAxis yAxisId="n" orientation="right" tick={{ fill: '#a09890', fontSize: 10 }} axisLine={false}
               tickLine={false} width={28} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: '#ffffff', border: '1px solid #e5e0d8', borderRadius: 8, fontSize: 12, color: '#1c1814' }}
          formatter={(v, name) => name === 'pct'
            ? [`${Number(v).toLocaleString('nl-BE')}%`, 'Ooit gebruikt (cumulatief)']
            : [v, 'Collega’s die week']}
        />
        <Legend wrapperStyle={{ fontSize: 10, color: '#6b6560' }}
                formatter={(v) => v === 'pct' ? 'Ooit gebruikt (cumulatief %)' : 'Collega’s met gebruik die week'} />
        <Bar yAxisId="n" dataKey="inWeek" fill="#e5d9b6" radius={[3, 3, 0, 0]} />
        <Line yAxisId="pct" type="monotone" dataKey="pct" stroke="#b8962e" strokeWidth={2} dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
