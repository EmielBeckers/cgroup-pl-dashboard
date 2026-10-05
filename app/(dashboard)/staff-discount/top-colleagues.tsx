'use client'

import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ColleagueRow } from '@/lib/staff-discount'
import { employerName } from '@/lib/staff-discount'
import { cn } from '@/lib/utils'

type Metric = 'paid' | 'uses'
const TOP_N = 15

const eur = (v: number) => `€ ${v.toLocaleString('nl-BE', { maximumFractionDigits: 0 })}`

// Top colleagues since launch from v_discount_per_colleague, either by what
// they paid in total (after discount) or by number of visits. Values are
// plotted exactly as the view returns them.
export function TopColleagues({ rows }: { rows: ColleagueRow[] }) {
  const [metric, setMetric] = useState<Metric>('paid')

  const data = [...rows]
    .sort((a, b) => metric === 'paid'
      ? (b.total_paid ?? 0) - (a.total_paid ?? 0) || b.uses - a.uses
      : b.uses - a.uses || (b.total_paid ?? 0) - (a.total_paid ?? 0))
    .slice(0, TOP_N)
    .map(r => ({
      label: `${r.employee_name ?? 'Onbekend'} · ${(r.home_employer_codes ?? ['unresolved']).map(employerName).join(' / ')}`,
      value: metric === 'paid' ? (r.total_paid ?? 0) : r.uses,
      uses: r.uses,
      paid: r.total_paid,
      last: r.last_use,
    }))

  const toggle = (m: Metric, text: string) => (
    <button
      onClick={() => setMetric(m)}
      className={cn('px-3 py-1 rounded-md transition-colors',
        metric === m ? 'bg-gold/10 text-gold font-medium' : 'text-text-muted hover:text-text')}
    >
      {text}
    </button>
  )

  if (data.length === 0) return <p className="text-xs text-text-faint">Nog geen gebruik sinds lancering.</p>
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-xs border border-border rounded-lg p-0.5 w-fit">
        {toggle('paid', 'Totaal betaald')}
        {toggle('uses', 'Aantal bezoeken')}
      </div>
      <ResponsiveContainer width="100%" height={Math.max(160, data.length * 26 + 30)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e5e0d8" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#a09890', fontSize: 10 }} axisLine={false} tickLine={false}
                 allowDecimals={metric === 'paid'} domain={metric === 'paid' ? [0, 'auto'] : [0, 'dataMax']}
                 tickFormatter={v => metric === 'paid' ? `€${v}` : String(v)} />
          <YAxis type="category" dataKey="label" width={260} interval={0}
                 tick={{ fill: '#6b6560', fontSize: 10 }} axisLine={{ stroke: '#e5e0d8' }} tickLine={false} />
          <Tooltip
            cursor={{ fill: '#f9f7f4' }}
            contentStyle={{ background: '#ffffff', border: '1px solid #e5e0d8', borderRadius: 8, fontSize: 12, color: '#1c1814' }}
            formatter={(_v, _n, item) => {
              const p = item.payload as (typeof data)[number]
              return [`${p.paid == null ? '—' : eur(p.paid)} betaald · ${p.uses} bezoek(en) · laatste ${p.last}`, '']
            }}
          />
          <Bar dataKey="value" fill="#b8962e" radius={[0, 3, 3, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
