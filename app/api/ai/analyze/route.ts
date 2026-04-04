import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { analyzeComplaint, findBestStaff } from '@/lib/ai'
import { findSimilarResponses } from '@/lib/complaint-history'

// 특정 민원 재분석 (priority가 null인 경우 수동 트리거)
export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { complaint_id } = await req.json()

  if (!complaint_id) {
    return NextResponse.json({ error: 'complaint_id 필요' }, { status: 400 })
  }

  const { data: complaint, error: fetchError } = await supabase
    .from('complaints')
    .select('id, title, content')
    .eq('id', complaint_id)
    .single()

  if (fetchError || !complaint) {
    return NextResponse.json({ error: '민원을 찾을 수 없습니다.' }, { status: 404 })
  }

  const similarResponses = await findSimilarResponses(supabase, complaint.title, complaint.content)

  let analysis
  try {
    analysis = await analyzeComplaint(complaint.title, complaint.content, similarResponses)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message === 'API_RATE_LIMIT') {
      return NextResponse.json(
        { error: '잠시 후 다시 시도해 주세요. (AI 서비스 요청 한도를 초과했습니다)' },
        { status: 429 }
      )
    }
    return NextResponse.json({ error: `AI 분석 실패: ${message}` }, { status: 502 })
  }

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

  const { error: updateError } = await supabase
    .from('complaints')
    .update({
      priority: analysis.priority,
      category: analysis.category,
      ai_response: analysis.ai_response,
      ai_analysis: analysis,
      assigned_staff_id: assignedStaffId,
    })
    .eq('id', complaint_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, analysis })
}
