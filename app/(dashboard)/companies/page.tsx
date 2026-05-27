import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/top-bar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { derivePl, formatCurrency, formatMargin, monthLabel } from '@/lib/utils'
import Link from 'next/link'
import { PlSnapshot, Company } from '@/lib/types'
import { ArrowRight, Building2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CompaniesPage() {
  const supabase = await createClient()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const { data: companies } = await supabase.from('companies').select('*').eq('is_active', true).order('name')
  const { data: snapshots } = await supabase
    .from('pl_snapshots')
    .select('*')
    .is('venue_id', null)
    .eq('period_year', year)
    .eq('period_month', month)

  const companyMap = new Map((companies ?? []).map((c: Company) => [c.id, c]))
  const snapshotMap = new Map((snapshots ?? []).map((s: PlSnapshot) => [s.company_id, s]))

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Entiteiten" subtitle="Alle juridische entiteiten" period={{ year, month }} />

      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {(companies ?? []).map((company: Company) => {
          const snap = snapshotMap.get(company.id)
          const pl   = snap ? derivePl(snap) : null

          return (
            <Link key={company.id} href={`/companies/${company.id}`}>
              <div className="bg-surface border border-border rounded-lg p-5 hover:border-gold/40 hover:bg-surface-raised transition-all group h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-gold/10 flex items-center justify-center">
                      <Building2 size={15} className="text-gold" />
                    </div>
                    <div>
                      <p className="font-semibold text-text text-sm">{company.display_name}</p>
                      <p className="text-xs text-text-muted">{company.vat_number ?? '—'}</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-text-faint group-hover:text-gold transition-colors mt-0.5" />
                </div>

                {pl ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-text-muted">Omzet</p>
                      <p className="text-sm font-semibold text-text">{formatCurrency(pl.total_revenue, true)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">EBITDA</p>
                      <p className={`text-sm font-semibold ${pl.ebitda >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatCurrency(pl.ebitda, true)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">Brutomarge</p>
                      <p className="text-sm text-text">{formatMargin(pl.gross_margin_pct)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted">EBITDA-%</p>
                      <Badge
                        variant={pl.ebitda_margin_pct >= 10 ? 'success' : pl.ebitda_margin_pct >= 0 ? 'warning' : 'danger'}
                        className="text-xs"
                      >
                        {formatMargin(pl.ebitda_margin_pct)}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-faint">Geen data voor {monthLabel(year, month)}</p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
