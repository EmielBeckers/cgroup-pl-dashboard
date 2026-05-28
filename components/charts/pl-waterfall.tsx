'use client'

import { PlFull } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props { snapshot: PlFull }

export function PlWaterfall({ snapshot: s }: Props) {
  const items = [
    { label: 'Omzet',          value: s.total_operating_revenue,          color: '#b8962e' },
    { label: 'Inkoopkosten',   value: -s.total_cogs,                       color: '#ef4444' },
    { label: 'Brutowinst',     value: s.gross_profit,                      color: '#d4af54' },
    { label: 'Personeel',      value: -s.total_labour,                     color: '#ef4444' },
    { label: 'Andere kosten',  value: -s.total_other_expenses,             color: '#f59e0b' },
    { label: 'GOP',            value: s.gop,                               color: '#7a6220' },
    { label: 'EBITDA',         value: s.ebitda, color: s.ebitda >= 0 ? '#22c55e' : '#ef4444' },
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={items} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fill: '#888888', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: '#888888', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => formatCurrency(Math.abs(v), true)}
          width={60}
        />
        <Tooltip
          contentStyle={{ background: '#222222', border: '1px solid #2a2a2a', borderRadius: 6 }}
          labelStyle={{ color: '#888888', fontSize: 11 }}
          formatter={(v) => [formatCurrency(Math.abs(Number(v ?? 0))), '']}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {items.map((item, i) => (
            <Cell key={i} fill={item.color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
