import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { PlSnapshot, PlDerived } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, compact = false): string {
  if (compact && Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
      notation: 'compact',
    }).format(amount)
  }
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

export function formatMargin(value: number): string {
  return `${value.toFixed(1)}%`
}

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec',
]

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`
}

export function derivePl(snapshot: PlSnapshot): PlDerived {
  const total_revenue = snapshot.revenue_food + snapshot.revenue_beverage + snapshot.revenue_other
  const total_cogs = snapshot.cogs_food + snapshot.cogs_beverage
  const gross_profit = total_revenue - total_cogs
  const total_labour = snapshot.labour_management + snapshot.labour_service + snapshot.labour_kitchen
  const total_overhead = snapshot.overhead_rent + snapshot.overhead_utilities + snapshot.overhead_marketing + snapshot.overhead_other
  const ebitda = gross_profit - total_labour - total_overhead

  return {
    ...snapshot,
    total_revenue,
    total_cogs,
    gross_profit,
    total_labour,
    total_overhead,
    ebitda,
    gross_margin_pct: total_revenue > 0 ? (gross_profit / total_revenue) * 100 : 0,
    labour_pct: total_revenue > 0 ? (total_labour / total_revenue) * 100 : 0,
    ebitda_margin_pct: total_revenue > 0 ? (ebitda / total_revenue) * 100 : 0,
  }
}

export function sumSnapshots(snapshots: PlSnapshot[]): PlSnapshot {
  const base = snapshots[0]
  return snapshots.reduce((acc, s) => ({
    ...acc,
    revenue_food: acc.revenue_food + s.revenue_food,
    revenue_beverage: acc.revenue_beverage + s.revenue_beverage,
    revenue_other: acc.revenue_other + s.revenue_other,
    cogs_food: acc.cogs_food + s.cogs_food,
    cogs_beverage: acc.cogs_beverage + s.cogs_beverage,
    labour_management: acc.labour_management + s.labour_management,
    labour_service: acc.labour_service + s.labour_service,
    labour_kitchen: acc.labour_kitchen + s.labour_kitchen,
    overhead_rent: acc.overhead_rent + s.overhead_rent,
    overhead_utilities: acc.overhead_utilities + s.overhead_utilities,
    overhead_marketing: acc.overhead_marketing + s.overhead_marketing,
    overhead_other: acc.overhead_other + s.overhead_other,
  }), { ...base })
}
