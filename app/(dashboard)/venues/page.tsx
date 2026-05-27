import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/top-bar'
import { Badge } from '@/components/ui/badge'
import { Venue, Company } from '@/lib/types'
import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function VenuesPage() {
  const supabase = await createClient()

  const { data: venues } = await supabase
    .from('venues')
    .select('*, company:companies(id, display_name)')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="flex flex-col flex-1">
      <TopBar title="Venues" subtitle="Alle actieve locaties" />

      <div className="p-6">
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3">Venue</th>
                <th className="text-left px-4 py-3">Entiteit</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">POS-systeem</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(venues ?? []).map((v: Venue & { company: Company }) => (
                <tr key={v.id} className="hover:bg-surface-raised transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-text-faint group-hover:text-gold transition-colors" />
                      <span className="font-medium text-text">{v.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-text-muted">{v.company?.display_name ?? '—'}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant="default">{v.type}</Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={v.pos_system === 'lightspeed' ? 'gold' : 'default'}>
                      {v.pos_system}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/venues/${v.id}`}
                      className="text-text-faint hover:text-gold transition-colors inline-flex items-center gap-1 text-xs"
                    >
                      Details <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
