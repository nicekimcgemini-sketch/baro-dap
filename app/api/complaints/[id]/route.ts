import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

function maskCardNumbers(text: string | null): string | null {
  if (!text) return text
  return text.replace(
    /\b(\d{4})[-\s]?(\d{4})[-\s]?(\d{4})[-\s]?(\d{4})\b/g,
    '$1-****-****-$4'
  )
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  return NextResponse.json({
    ...data,
    content: maskCardNumbers(data.content),
    ai_response: maskCardNumbers(data.ai_response),
    final_response: maskCardNumbers(data.final_response),
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const body = await req.json()

  const allowed = ['title', 'content', 'customer_name', 'status', 'final_response', 'priority']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await supabase
    .from('complaints')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()

  const { error } = await supabase
    .from('complaints')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
