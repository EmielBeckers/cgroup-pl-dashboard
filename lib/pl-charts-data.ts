// Real-data adapters for the charts. Every figure is a GROUP/SUM of rows
// returned by the validated views (public.pl_month / pl_entity / pl_venue);
// percentages are display-only ratios of those sums. Nothing is estimated,
// spread, or zero-filled — months or blocks without rows simply don't chart.

import { PlEntityRow, blockOf } from './pl-live'

/** Row from public.pl_month (adsolut.mv_pl_month, refreshed nightly). */
export interface PlMonthRow {
  dossier_code: string
  month: string // ISO date, first of month
  calendar_year: number
  is_revenue: boolean
  amount: number
}

export interface TrailingPoint {
  label: string
  current: number | null
  prior: number | null
}

const MONTH_SHORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

/**
 * Revenue per month for the trailing window, next to the same month a year
 * earlier. Anchored on the latest month with revenue activity (not after
 * today — the source contains a handful of mistyped future dates, see
 * DATA_QUESTIONS). Months without revenue rows stay null.
 */
export function trailingRevenue(rows: PlMonthRow[], monthsBack = 12, today = new Date()): TrailingPoint[] {
  const byMonth = new Map<string, number>() // 'YYYY-MM' -> revenue
  for (const r of rows) {
    if (!r.is_revenue) continue
    const key = r.month.slice(0, 7)
    byMonth.set(key, (byMonth.get(key) ?? 0) + r.amount)
  }
  const cutoff = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const inRange = Array.from(byMonth.keys()).filter(k => k >= '2023-01' && k <= cutoff).sort()
  if (inRange.length === 0) return []
  const [ay, am] = inRange[inRange.length - 1].split('-').map(Number)
  const points: TrailingPoint[] = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    let y = ay, m = am - i
    while (m < 1) { m += 12; y -= 1 }
    const key = `${y}-${String(m).padStart(2, '0')}`
    const prior = `${y - 1}-${String(m).padStart(2, '0')}`
    points.push({
      label: `${MONTH_SHORT[m - 1]} ${String(y).slice(2)}`,
      current: byMonth.get(key) ?? null,
      prior: byMonth.get(prior) ?? null,
    })
  }
  return points
}

/** Year-to-date revenue vs the same months last year (real months only). */
export interface YtdComparison {
  year: number
  throughMonth: number // 1..12, latest month with revenue this year
  current: number
  prior: number
}

export function ytdRevenue(rows: PlMonthRow[], today = new Date()): YtdComparison | null {
  const byMonth = new Map<string, number>()
  for (const r of rows) {
    if (!r.is_revenue) continue
    const key = r.month.slice(0, 7)
    byMonth.set(key, (byMonth.get(key) ?? 0) + r.amount)
  }
  const cutoff = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const inRange = Array.from(byMonth.keys()).filter(k => k >= '2023-01' && k <= cutoff).sort()
  if (inRange.length === 0) return null
  const [year, throughMonth] = inRange[inRange.length - 1].split('-').map(Number)
  let current = 0, prior = 0
  for (let m = 1; m <= throughMonth; m++) {
    const mm = String(m).padStart(2, '0')
    current += byMonth.get(`${year}-${mm}`) ?? 0
    prior += byMonth.get(`${year - 1}-${mm}`) ?? 0
  }
  return { year, throughMonth, current, prior }
}

export function monthLabel(m: number): string { return MONTH_SHORT[m - 1] }

/**
 * Block sums for one calendar year — the same blockOf() grouping the
 * statement tables use, plus the F&B food/beverage sub-splits taken from
 * the mapping's own line labels. Costs keep their sign from the views
 * (negative).
 */
export interface BlockSums {
  revenue: number
  costOfSales: number
  labour: number
  otherOpex: number
  mgmtFees: number
  nonOperating: number
  unmapped: number
  operatingResult: number // everything except Non-Operating and UNMAPPED
  result: number
  foodRevenue: number
  beverageRevenue: number
  foodCost: number
  beverageCost: number
}

export function blockSums(rows: PlEntityRow[], year: number): BlockSums {
  const s: BlockSums = {
    revenue: 0, costOfSales: 0, labour: 0, otherOpex: 0, mgmtFees: 0,
    nonOperating: 0, unmapped: 0, operatingResult: 0, result: 0,
    foodRevenue: 0, beverageRevenue: 0, foodCost: 0, beverageCost: 0,
  }
  for (const r of rows) {
    if (r.calendar_year !== year) continue
    const b = blockOf(r)
    s.result += r.amount
    if (b === 'Revenue') s.revenue += r.amount
    else if (b === 'Cost of Sales') s.costOfSales += r.amount
    else if (b === 'Labour') s.labour += r.amount
    else if (b === 'Other Operating Expenses') s.otherOpex += r.amount
    else if (b === 'Management Fees') s.mgmtFees += r.amount
    else if (b === 'Non-Operating') s.nonOperating += r.amount
    else s.unmapped += r.amount
    if (b !== 'Non-Operating' && b !== 'UNMAPPED') s.operatingResult += r.amount
    if (r.usali_department === 'F&B') {
      if (r.is_revenue && r.usali_line.startsWith('Food Revenue')) s.foodRevenue += r.amount
      if (r.is_revenue && r.usali_line.startsWith('Beverage Revenue')) s.beverageRevenue += r.amount
      if (r.usali_line.startsWith('Cost of Sales — Food')) s.foodCost += r.amount
      if (r.usali_line.startsWith('Cost of Sales — Beverage')) s.beverageCost += r.amount
    }
  }
  return s
}

/* ------------------------------------------------- donut (cost of €100) -- */

export interface DonutSegment { key: string; name: string; value: number; color: string }

/**
 * Splits revenue into food cost / beverage cost / labour / remaining
 * operating costs / operating result. "Andere kosten" is the exact
 * remainder of real blocks (other CoS lines, other expenses, management
 * fees — and a negative operating result when there is one), never a plug.
 */
export function donutSegments(s: BlockSums): { segments: DonutSegment[]; revenue: number } {
  const rev = s.revenue
  if (rev <= 0) return { segments: [], revenue: rev }
  const food = -s.foodCost
  const bev = -s.beverageCost
  const labour = -s.labour
  const winst = Math.max(s.operatingResult, 0)
  const other = Math.max(rev - food - bev - labour - winst, 0)
  const segments = [
    { key: 'food', name: 'Voedingskost', value: food, color: '#c2410c' },
    { key: 'bev', name: 'Drankkost', value: bev, color: '#d4a017' },
    { key: 'labour', name: 'Personeel', value: labour, color: '#b8962e' },
    { key: 'other', name: 'Andere kosten', value: other, color: '#a08868' },
    { key: 'winst', name: 'Operationeel resultaat', value: winst, color: '#16a34a' },
  ].filter(seg => seg.value > 0)
  return { segments, revenue: rev }
}

/* ------------------------------------------------------------ waterfall -- */

export interface WaterfallStep {
  label: string
  start: number
  end: number
  color: string
  kind: 'level' | 'cost'
}

const GREEN = '#16a34a', RED = '#dc2626', ORANGE = '#d97706', GOLD = '#b8962e'

/** Omzet → blocks → Resultaat, using the statement's own block sums. */
export function waterfallSteps(s: BlockSums): WaterfallStep[] {
  const steps: WaterfallStep[] = []
  let run = s.revenue
  steps.push({ label: 'Omzet', start: 0, end: run, color: GOLD, kind: 'level' })
  if (Math.round(s.costOfSales) !== 0) {
    steps.push({ label: 'Cost of Sales', start: run, end: run + s.costOfSales, color: RED, kind: 'cost' })
    run += s.costOfSales
    steps.push({ label: 'Brutomarge', start: 0, end: run, color: run >= 0 ? GREEN : RED, kind: 'level' })
  }
  if (Math.round(s.labour) !== 0) {
    steps.push({ label: 'Loon', start: run, end: run + s.labour, color: RED, kind: 'cost' })
    run += s.labour
  }
  if (Math.round(s.otherOpex) !== 0) {
    steps.push({ label: 'Overige kosten', start: run, end: run + s.otherOpex, color: ORANGE, kind: 'cost' })
    run += s.otherOpex
  }
  if (Math.round(s.mgmtFees) !== 0) {
    steps.push({ label: 'Mgmt fees', start: run, end: run + s.mgmtFees, color: ORANGE, kind: 'cost' })
    run += s.mgmtFees
  }
  steps.push({ label: 'Operationeel', start: 0, end: s.operatingResult, color: s.operatingResult >= 0 ? GREEN : RED, kind: 'level' })
  run = s.operatingResult
  if (Math.round(s.nonOperating) !== 0) {
    steps.push({ label: 'Non-operating', start: run, end: run + s.nonOperating, color: ORANGE, kind: 'cost' })
    run += s.nonOperating
  }
  if (Math.round(s.unmapped) !== 0) {
    steps.push({ label: 'Niet gemapt', start: run, end: run + s.unmapped, color: ORANGE, kind: 'cost' })
    run += s.unmapped
  }
  steps.push({ label: 'Resultaat', start: 0, end: s.result, color: s.result >= 0 ? GREEN : RED, kind: 'level' })
  return steps
}

/* --------------------------------------------------------------- ratios -- */

export interface PlRatios {
  foodPct: number | null   // food CoS / food revenue
  bevPct: number | null    // beverage CoS / beverage revenue
  opMarginPct: number | null // operating result / revenue
}

export function plRatios(s: BlockSums): PlRatios {
  return {
    foodPct: s.foodRevenue > 0 ? (-s.foodCost / s.foodRevenue) * 100 : null,
    bevPct: s.beverageRevenue > 0 ? (-s.beverageCost / s.beverageRevenue) * 100 : null,
    opMarginPct: s.revenue > 0 ? (s.operatingResult / s.revenue) * 100 : null,
  }
}
