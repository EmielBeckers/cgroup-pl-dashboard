'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function confirmInvoiceCategory(invoiceId: string, category: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('invoices').update({
    confirmed_category: category,
    review_status: 'confirmed',
    reviewed_by: user?.id ?? null,
    reviewed_at: new Date().toISOString(),
  }).eq('id', invoiceId)

  revalidatePath('/invoices/review')
  revalidatePath('/invoices')
}

export async function correctInvoiceCategory(invoiceId: string, category: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('invoices').update({
    confirmed_category: category,
    review_status: 'corrected',
    reviewed_by: user?.id ?? null,
    reviewed_at: new Date().toISOString(),
  }).eq('id', invoiceId)

  revalidatePath('/invoices/review')
  revalidatePath('/invoices')
}
