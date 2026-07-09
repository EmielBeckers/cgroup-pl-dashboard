'use client'

import { formatCurrency } from '@/lib/utils'
import { TrailingPoint } from '@/lib/pl-charts-data'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

interface Props { points: TrailingPoint[] }

export function RevenueVsLastYear({ points }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={points} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barGap={2}>
        <CartesianGrid stroke="#e5e0d8" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#6b6560', fontSize: 11 }}
          axisLine={{ stroke: '#e5e0d8' }}
          tickLine={false}
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
          formatter={(v, name) => [
            v == null ? '—' : formatCurrency(Number(v)),
            name === 'current' ? 'Dit jaar' : 'Vorig jaar',
          ]}
        />
        <Legend
          formatter={value => value === 'current' ? 'Dit jaar' : 'Vorig jaar'}
          wrapperStyle={{ fontSize: 11, color: '#6b6560' }}
        />
        <Bar dataKey="prior" fill="#d5cfc5" radius={[3, 3, 0, 0]} />
        <Bar dataKey="current" fill="#b8962e" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
