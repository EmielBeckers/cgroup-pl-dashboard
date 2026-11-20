import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDiscountTransactions } from '@/lib/hr-db'

// Windowed staff-discount transactions for the period picker.
// BOARD ONLY — per-colleague personal data from hr_sync; the gate here
// mirrors the page's and getDiscountTransactions() enforces it again.
export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get('from') ?? ''
  const to = req.nextUrl.searchParams.get('to') ?? ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to) {
    return new NextResponse('Bad request', { status: 400 })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'board') return new NextResponse('Forbidden', { status: 403 })

  try {
    const data = await getDiscountTransactions(profile, from, to)
    return NextResponse.json(data)
  } catch (e) {
    return new NextResponse(e instanceof Error ? e.message : 'query failed', { status: 500 })
  }
}
