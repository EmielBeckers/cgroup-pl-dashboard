'use client'

import { formatCurrency } from '@/lib/utils'
import { TrailingPoint } from '@/lib/pl-charts-data'
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

interface Props { points: TrailingPoint[] }

export function RevenueTrend({ points }: Props) {
  const curTotal   = points.reduce((s, p) => s + (p.current ?? 0), 0)
  const priorTotal = points.reduce((s, p) => s + (p.prior ?? 0), 0)
  const above = curTotal >= priorTotal

  const fill = above ? '#16a34a' : '#dc2626'
  const stroke = '#b8962e'

  return (
    <ResponsiveContainer width="100%" height={240}>
      <ComposedChart data={points} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={fill} stopOpacity={0.18} />
            <stop offset="95%" stopColor={fill} stopOpacity={0} />
          </linearGradient>
        </defs>
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
          cursor={{ stroke: '#e5e0d8' }}
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
        <Area
          type="monotone" dataKey="current" stroke={stroke} strokeWidth={2.5}
          fill="url(#revFill)" dot={false} connectNulls
        />
        <Line
          type="monotone" dataKey="prior" stroke="#a09890" strokeWidth={1.5}
          strokeDasharray="4 3" dot={false} connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
