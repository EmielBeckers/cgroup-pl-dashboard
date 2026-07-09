import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Redirects to a short-lived signed URL for one invoice PDF.
// Role check here AND in storage RLS (policy "invoice pdfs board
// accounting") — the signed URL is created with the USER's session, so
// the database-level gate is the one that counts.
export async function GET(req: NextRequest) {
  const dossier = req.nextUrl.searchParams.get('dossier') ?? ''
  const doc = req.nextUrl.searchParams.get('doc') ?? ''
  if (!/^[A-Z]+$/.test(dossier) || !/^\d+$/.test(doc)) {
    return new NextResponse('Bad request', { status: 400 })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const { data: profile } = await supabase
    .from('user_profiles').select('role').eq('id', user.id).single()
  if (!profile || !['board', 'accounting'].includes(profile.role)) {
    return new NextResponse('Forbidden', { status: 403 })
  }
  const { data, error } = await supabase.storage
    .from('invoice-pdfs').createSignedUrl(`${dossier}/${doc}.pdf`, 60)
  if (error || !data) return new NextResponse('PDF niet gevonden', { status: 404 })
  return NextResponse.redirect(data.signedUrl)
}
