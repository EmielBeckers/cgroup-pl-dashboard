'use client'

// Emiel's "In het kort" card, rewired to the real views: the year-to-date
// revenue comparison comes from pl_month (real months only) and the food
// cost from the mapping's own F&B lines. No comparison months → no claim.

import { formatCurrency } from '@/lib/utils'
import { YtdComparison, monthLabel } from '@/lib/pl-charts-data'

interface Props {
  name: string
  ytd: YtdComparison
  foodPct: number | null // food cost % over the same calendar year, or null
}

export function VenueSummary({ name, ytd, foodPct }: Props) {
  const periodLabel = `${ytd.year} (t/m ${monthLabel(ytd.throughMonth)})`

  let revSentence = `${name} draaide in ${periodLabel} ${formatCurrency(ytd.current)} omzet.`
  if (ytd.prior > 0) {
    const pct = ((ytd.current - ytd.prior) / ytd.prior) * 100
    const dir = pct >= 0 ? 'meer' : 'minder'
    revSentence =
      `${name} draaide in ${periodLabel} ${formatCurrency(ytd.current)} omzet — ` +
      `${Math.abs(pct).toFixed(0)}% ${dir} dan dezelfde periode vorig jaar.`
  }

  let foodSentence = ''
  if (foodPct != null) {
    const norm = foodPct < 32 ? 'mooi binnen de norm' : foodPct <= 38 ? 'net aan de hoge kant' : 'boven de norm'
    foodSentence = ` De voedingskost ligt op ${foodPct.toFixed(1)}% (${ytd.year}), ${norm}.`
  }

  return (
    <div className="bg-surface border border-border rounded-lg px-6 py-5">
      <p className="text-[10px] uppercase tracking-widest text-text-faint mb-2">In het kort</p>
      <p className="text-xl sm:text-2xl text-text leading-relaxed font-medium">
        {revSentence}{foodSentence}
      </p>
    </div>
  )
}
