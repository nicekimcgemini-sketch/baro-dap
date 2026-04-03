import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { CreateComplaintInput, Priority } from '@/lib/types'

async function analyzePriority(title: string, content: string): Promise<Priority> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    })

    const prompt = `당신은 신한카드 고객 민원 긴급도 판단 전문가입니다.
아래 문의 내용을 읽고 긴급도를 1~5 중 하나로 판단해주세요.

긴급도 기준:
- 5 (매우높음): 부정사용, 분실/도난, 개인정보유출, 즉각 조치 필요
- 4 (높음): 이중청구, 결제오류, 한도차단, 긴급 민원
- 3 (보통): 일반 결제문의, 한도조정, 서비스 오류
- 2 (낮음): 포인트/혜택 문의, 카드발급 문의
- 1 (매우낮음): 단순 안내 요청, 정보 확인

문의 제목: ${title}
문의 내용: ${content}

아래 JSON 형식으로만 답변하세요:
{"priority": 1~5 사이 숫자}`

    const result = await model.generateContent(prompt)
    const parsed = JSON.parse(result.response.text())
    return Math.min(5, Math.max(1, parseInt(parsed.priority))) as Priority
  } catch {
    return 3
  }
}

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('complaints')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body: CreateComplaintInput = await req.json()

  const { title, content, counselor_name, created_by_staff_id } = body
  if (!title || !content || !counselor_name) {
    return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 })
  }

  // 1. 민원 먼저 저장
  const { data, error } = await supabase
    .from('complaints')
    .insert({
      title,
      content,
      customer_name: counselor_name,
      customer_contact: '',
      created_by_staff_id: created_by_staff_id ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 2. AI 긴급도 분석 (백그라운드 - 실패해도 등록은 완료)
  analyzePriority(title, content).then(priority => {
    supabase
      .from('complaints')
      .update({ priority })
      .eq('id', data.id)
      .then(() => {})
  })

  return NextResponse.json({ id: data.id }, { status: 201 })
}
