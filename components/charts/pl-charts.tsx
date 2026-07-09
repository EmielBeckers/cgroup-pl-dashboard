'use client'

// Chart deck above the P&L tables. Feeds Emiel's chart components with
// real view rows only: pl_month for the monthly trend / YTD comparison,
// pl_entity (or pl_venue) rows for the year blocks. Same rows as the
// tables below — the charts can't disagree with the statement.

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { PlEntityRow, YEARS } from '@/lib/pl-live'
import {
  PlMonthRow, trailingRevenue, ytdRevenue, blockSums, donutSegments,
  waterfallSteps, plRatios,
} from '@/lib/pl-charts-data'
import { ChartsSection } from './charts-section'
import { RevenueTrend } from './revenue-trend'
import { RevenueVsLastYear } from './revenue-vs-ly'
import { CostDonut } from './cost-donut'
import { PlWaterfall } from './pl-waterfall'
import { RatioCards } from './ratio-cards'
import { VenueSummary } from './venue-summary'

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-lg px-5 py-4">
      <p className="text-xs font-medium text-text-muted uppercase tracking-widest mb-3">{title}</p>
      {children}
    </div>
  )
}

export function PlCharts({ name, entityRows, monthRows }: {
  name: string
  entityRows: PlEntityRow[]
  monthRows: PlMonthRow[]
}) {
  const [year, setYear] = useState<number>(2025)
  const points = useMemo(() => trailingRevenue(monthRows), [monthRows])
  const ytd = useMemo(() => ytdRevenue(monthRows), [monthRows])
  const sums = useMemo(() => blockSums(entityRows, year), [entityRows, year])
  const ytdFoodPct = useMemo(
    () => (ytd ? plRatios(blockSums(entityRows, ytd.year)).foodPct : null),
    [entityRows, ytd],
  )
  const donut = donutSegments(sums)
  const steps = waterfallSteps(sums)
  const ratios = plRatios(sums)

  if (points.length === 0 && !ytd) return null

  return (
    <ChartsSection>
      {ytd && <VenueSummary name={name} ytd={ytd} foodPct={ytdFoodPct} />}

      {points.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Omzet — laatste 12 maanden">
            <RevenueTrend points={points} />
          </ChartCard>
          <ChartCard title="Omzet per maand vs vorig jaar">
            <RevenueVsLastYear points={points} />
          </ChartCard>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-widest text-text-faint mr-1">Jaar</span>
        {YEARS.map(y => (
          <button key={y} onClick={() => setYear(y)} className={cn(
            'px-2 py-0.5 rounded text-[11px] border transition-colors',
            y === year ? 'border-gold text-gold bg-gold/10' : 'border-border text-text-muted hover:text-text',
          )}>
            {y}{y === 2026 && ' YTD'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={`Waar gaat elke €100 omzet naartoe — ${year}`}>
          <CostDonut segments={donut.segments} revenue={donut.revenue} />
        </ChartCard>
        <ChartCard title={`Van omzet naar resultaat — ${year}`}>
          <PlWaterfall steps={steps} revenue={sums.revenue} />
        </ChartCard>
      </div>

      <RatioCards ratios={ratios} />

      <p className="text-[10px] text-text-faint">
        Grafieken tonen dezelfde gevalideerde viewrijen als de tabellen (excl. 69x/79x) — niets wordt geschat of gespreid.
      </p>
    </ChartsSection>
  )
}
