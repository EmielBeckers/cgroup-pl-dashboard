'use client'

import { PlFull } from '@/lib/types'
import { formatCurrency, MONTH_NAMES } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

interface Props {
  snapshots: PlFull[]
  showEbitda?: boolean
}

export function RevenueTrend({ snapshots, showEbitda = true }: Props) {
  const data = snapshots.map(s => ({
    label: `${MONTH_NAMES[s.period_month - 1]} ${String(s.period_year).slice(2)}`,
    revenue: s.total_operating_revenue,
    ebitda: s.ebitda,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#b8962e" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#b8962e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradEbitda" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#888888', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#888888', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => formatCurrency(v, true)}
          width={60}
        />
        <Tooltip
          contentStyle={{ background: '#222222', border: '1px solid #2a2a2a', borderRadius: 6 }}
          labelStyle={{ color: '#888888', fontSize: 11 }}
          formatter={(v, name) => [
            formatCurrency(Number(v ?? 0)),
            name === 'revenue' ? 'Omzet' : 'EBITDA',
          ]}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#b8962e"
          strokeWidth={2}
          fill="url(#gradRevenue)"
          dot={false}
        />
        {showEbitda && (
          <Area
            type="monotone"
            dataKey="ebitda"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#gradEbitda)"
            dot={false}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}
