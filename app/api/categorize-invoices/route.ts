import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { USALI_EXPENSE_CATEGORIES } from '@/lib/pl-structure'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BATCH_SIZE = 10
const AUTO_CONFIRM_THRESHOLD = 90

interface InvoiceRow {
  id: string
  supplier_name: string
  description: string | null
}

interface AiResult {
  id: string
  category: string
  confidence: number
}

async function categoriseBatch(invoices: InvoiceRow[]): Promise<AiResult[]> {
  const categoryList = USALI_EXPENSE_CATEGORIES.join(', ')
  const lines = invoices.map((inv, i) =>
    `${i + 1}. id=${inv.id} | supplier=${inv.supplier_name} | description=${inv.description ?? '(none)'}`
  ).join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a hospitality accounting assistant. Categorise each invoice into exactly one USALI category.

Allowed categories:
${categoryList}

Invoices to categorise:
${lines}

Respond with a JSON array only — no explanation, no markdown fences. Each element: {"id":"<id>","category":"<category>","confidence":<0-100>}`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]'
  try {
    const parsed = JSON.parse(text) as AiResult[]
    // Validate categories
    return parsed.map(r => ({
      id: r.id,
      category: USALI_EXPENSE_CATEGORIES.includes(r.category as typeof USALI_EXPENSE_CATEGORIES[number])
        ? r.category
        : 'Miscellaneous',
      confidence: Math.max(0, Math.min(100, Number(r.confidence) || 50)),
    }))
  } catch {
    return []
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200)

  const supabase = await createClient()

  const { data: pending, error } = await supabase
    .from('invoices')
    .select('id, supplier_name, description')
    .eq('review_status', 'pending_ai')
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const invoices = (pending ?? []) as InvoiceRow[]
  if (invoices.length === 0) {
    return NextResponse.json({ processed: 0, autoConfirmed: 0, pendingReview: 0 })
  }

  let autoConfirmed = 0
  let pendingReview = 0
  const errors: string[] = []

  // Process in batches
  for (let i = 0; i < invoices.length; i += BATCH_SIZE) {
    const batch = invoices.slice(i, i + BATCH_SIZE)
    try {
      const results = await categoriseBatch(batch)

      for (const result of results) {
        const isConfident = result.confidence >= AUTO_CONFIRM_THRESHOLD
        const { error: updateErr } = await supabase
          .from('invoices')
          .update({
            ai_suggested_category: result.category,
            ai_confidence: result.confidence,
            ai_categorized_at: new Date().toISOString(),
            review_status: isConfident ? 'auto_confirmed' : 'pending_review',
            confirmed_category: isConfident ? result.category : null,
          })
          .eq('id', result.id)

        if (updateErr) {
          errors.push(`${result.id}: ${updateErr.message}`)
        } else if (isConfident) {
          autoConfirmed++
        } else {
          pendingReview++
        }
      }
    } catch (err) {
      errors.push(`batch ${i / BATCH_SIZE + 1}: ${String(err)}`)
    }
  }

  return NextResponse.json({
    processed: invoices.length,
    autoConfirmed,
    pendingReview,
    errors: errors.length > 0 ? errors : undefined,
  })
}
