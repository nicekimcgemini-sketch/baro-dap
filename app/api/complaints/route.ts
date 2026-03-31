import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { analyzeComplaint, findBestStaff } from '@/lib/claude'
import { CreateComplaintInput } from '@/lib/types'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')

  let query = supabase
    .from('complaints')
    .select('*, assigned_staff:staff(id, name, department)')
    .order('priority', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', parseInt(priority))

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body: CreateComplaintInput = await req.json()

  const { title, content, customer_name, customer_contact } = body
  if (!title || !content || !customer_name || !customer_contact) {
    return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 })
  }

  // 1. 민원 먼저 저장
  const { data: complaint, error: insertError } = await supabase
    .from('complaints')
    .insert({ title, content, customer_name, customer_contact })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // 2. AI 분석 (비동기 처리)
  try {
    const analysis = await analyzeComplaint(title, content)

    // 3. 담당자 자동 배정
    const { data: staffList } = await supabase
      .from('staff')
      .select('id, name, specialties')
      .eq('is_active', true)
      .eq('department', analysis.department)

    const assignedStaffId = await findBestStaff(
      analysis.category,
      analysis.department,
      staffList ?? []
    )

    // 4. 분석 결과 업데이트
    await supabase
      .from('complaints')
      .update({
        priority: analysis.priority,
        category: analysis.category,
        ai_response: analysis.ai_response,
        ai_analysis: analysis,
        assigned_staff_id: assignedStaffId,
      })
      .eq('id', complaint.id)
  } catch (err) {
    console.error('AI 분석 오류:', err)
    // AI 분석 실패해도 민원은 접수 완료 처리
  }

  return NextResponse.json({ id: complaint.id }, { status: 201 })
}
