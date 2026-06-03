import { MONTH_NAMES } from './utils'

export type PeriodType = 'this_month' | 'last_month' | 'ytd' | 'last_year' | 'custom'
export type CompType   = 'none' | 'vs_last_month' | 'vs_last_year' | 'custom'

export interface MonthYear { year: number; month: number }
export interface DateRange  { start: MonthYear; end: MonthYear }

export interface PeriodState {
  type: PeriodType
  customStart?: MonthYear
  customEnd?: MonthYear
}

export interface CompState {
  type: CompType
  customStart?: MonthYear
  customEnd?: MonthYear
}

// Detect latest available period from a set of snapshot rows
export function latestPeriod<T extends { period_year: number; period_month: number }>(
  rows: T[]
): MonthYear | null {
  if (!rows.length) return null
  return rows.reduce<MonthYear>((best, r) => {
    return r.period_year * 12 + r.period_month > best.year * 12 + best.month
      ? { year: r.period_year, month: r.period_month }
      : best
  }, { year: rows[0].period_year, month: rows[0].period_month })
}

function addMonths(my: MonthYear, n: number): MonthYear {
  const total = my.year * 12 + my.month + n
  return { year: Math.floor((total - 1) / 12), month: ((total - 1) % 12) + 1 }
}

export function resolvePeriodRange(period: PeriodState, latest: MonthYear): DateRange {
  const { year, month } = latest
  switch (period.type) {
    case 'this_month':
      return { start: { year, month }, end: { year, month } }
    case 'last_month': {
      const lm = addMonths({ year, month }, -1)
      return { start: lm, end: lm }
    }
    case 'ytd':
      return { start: { year, month: 1 }, end: { year, month } }
    case 'last_year':
      return { start: { year: year - 1, month: 1 }, end: { year: year - 1, month: 12 } }
    case 'custom':
      return {
        start: period.customStart ?? { year, month: 1 },
        end:   period.customEnd   ?? { year, month },
      }
  }
}

export function resolveCompRange(comp: CompState, primary: DateRange): DateRange | null {
  switch (comp.type) {
    case 'none': return null
    case 'vs_last_month': {
      const compEnd   = addMonths(primary.start, -1)
      const span = primary.end.year * 12 + primary.end.month - primary.start.year * 12 - primary.start.month
      const compStart = addMonths(compEnd, -span)
      return { start: compStart, end: compEnd }
    }
    case 'vs_last_year':
      return {
        start: { year: primary.start.year - 1, month: primary.start.month },
        end:   { year: primary.end.year   - 1, month: primary.end.month   },
      }
    case 'custom':
      return comp.customStart && comp.customEnd
        ? { start: comp.customStart, end: comp.customEnd }
        : null
  }
}

export function filterRows<T extends { period_year: number; period_month: number }>(
  rows: T[],
  range: DateRange
): T[] {
  const lo = range.start.year * 12 + range.start.month
  const hi = range.end.year   * 12 + range.end.month
  return rows.filter(r => {
    const t = r.period_year * 12 + r.period_month
    return t >= lo && t <= hi
  })
}

function shortMonth(m: number) {
  return MONTH_NAMES[m - 1].slice(0, 3)
}

export function rangeLabel(range: DateRange): string {
  const { start, end } = range
  if (start.year === end.year && start.month === end.month) {
    return `${shortMonth(start.month)} ${start.year}`
  }
  if (start.year === end.year) {
    return `${shortMonth(start.month)}–${shortMonth(end.month)} ${end.year}`
  }
  return `${shortMonth(start.month)} ${start.year} – ${shortMonth(end.month)} ${end.year}`
}
