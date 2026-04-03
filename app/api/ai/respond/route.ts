import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { complaint_id } = await req.json()

  if (!complaint_id) {
    return NextResponse.json({ error: 'complaint_id가 필요합니다.' }, { status: 400 })
  }

  const { data: complaint, error } = await supabase
    .from('complaints')
    .select('title, content, customer_name')
    .eq('id', complaint_id)
    .single()

  if (error || !complaint) {
    return NextResponse.json({ error: '문의를 찾을 수 없습니다.' }, { status: 404 })
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `당신은 신한카드 고객 민원 대응 전문가입니다. 아래 상담 내용에 대한 공식 답변을 작성해주세요.

상담 제목: ${complaint.title}
상담 내용: ${complaint.content}
담당 상담원: ${complaint.customer_name}

고객에게 전달할 공식 답변을 정중하고 신뢰감 있게 작성해주세요.
- 한국어로 작성
- 3~5문장 분량
- 신한카드 직원 입장에서 고객에게 보내는 답변 형식
- 친절하고 전문적인 어조`

  try {
    const result = await model.generateContent(prompt)
    const response = result.response.text()
    return NextResponse.json({ response })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const is429 = message.includes('429') || message.includes('quota')
    if (is429) {
      return NextResponse.json(
        { error: '잠시 후 다시 시도해 주세요. (API 요청 한도 초과)' },
        { status: 429 }
      )
    }
    return NextResponse.json({ error: 'AI 생성에 실패했습니다.' }, { status: 502 })
  }
}
