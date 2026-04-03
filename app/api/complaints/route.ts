import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { analyzeComplaint, findBestStaff } from '@/lib/ai'
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

  const { title, content, counselor_name } = body
  if (!title || !content || !counselor_name) {
    return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 })
  }

  // 1. 민원 먼저 저장
  const { data: complaint, error: insertError } = await supabase
    .from('complaints')
    .insert({ title, content, customer_name: counselor_name, customer_contact: '' })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // 2. AI 분석 (실패 시 기본값 사용)
  let analysis
  try {
    analysis = await analyzeComplaint(title, content)
  } catch (err) {
    console.error('AI 분석 오류 (기본값 사용):', err)
    analysis = {
      priority: 3 as const,
      category: '기타',
      department: '현업',
      ai_response: '담당자가 민원 내용을 검토 후 빠르게 처리해드리겠습니다.',
      reasoning: 'AI 분석을 사용할 수 없어 기본값으로 처리되었습니다.',
    }
  }

  // 3. 담당자 자동 배정
  const { data: staffList, error: staffError } = await supabase
    .from('staff')
    .select('id, name, specialties')
    .eq('is_active', true)
    .eq('department', analysis.department)

  if (staffError) console.error('담당자 조회 오류:', staffError)

  const assignedStaffId = await findBestStaff(
    analysis.category,
    analysis.department,
    staffList ?? []
  )

  // 4. 분석 결과 업데이트
  const { error: updateError } = await supabase
    .from('complaints')
    .update({
      priority: analysis.priority,
      category: analysis.category,
      ai_response: analysis.ai_response,
      ai_analysis: analysis,
      assigned_staff_id: assignedStaffId,
    })
    .eq('id', complaint.id)

  if (updateError) console.error('AI 분석 저장 오류:', updateError)

  return NextResponse.json({ id: complaint.id }, { status: 201 })
}
