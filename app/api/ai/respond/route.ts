import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { findRelatedFaqsWithContent } from '@/lib/shinhan-faq'
import { findSimilarResponses } from '@/lib/complaint-history'
import { findRelevantLaws } from '@/lib/consumer-law'

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

  // 신한카드 공식 FAQ + 과거 수기 답변 사례 병렬 조회
  const [relatedFaqs, similarResponses] = await Promise.all([
    findRelatedFaqsWithContent(complaint.title, complaint.content),
    findSimilarResponses(supabase, complaint.title, complaint.content),
  ])

  const faqContext = relatedFaqs.length > 0
    ? `\n\n[신한카드 공식 FAQ - 반드시 아래 내용을 바탕으로 답변하세요]\n${
        relatedFaqs.map((f, i) =>
          `${i + 1}. Q: ${f.title}\n   A: ${f.answer}`
        ).join('\n\n')
      }`
    : ''

  const historyContext = similarResponses.length > 0
    ? `\n\n[과거 유사 민원 처리 사례 - 상담원이 직접 작성한 답변이므로 스타일과 내용을 참고하세요]\n${
        similarResponses.map((r, i) =>
          `${i + 1}. 민원: ${r.title}\n   카테고리: ${r.category ?? '미분류'}\n   답변: ${r.final_response}`
        ).join('\n\n')
      }`
    : ''

  const relevantLaws = findRelevantLaws(complaint.title, complaint.content)
  const lawContext = relevantLaws.length > 0
    ? `\n\n[한국소비자원 생활법령 - 신용카드 이용자 관련 법령 (반드시 준수)]\n${
        relevantLaws.map((l) => l.content).join('\n\n')
      }`
    : ''

  const prompt = `당신은 신한카드 고객 민원 대응 전문가입니다. 아래 상담 내용에 대한 공식 답변을 작성해주세요.

상담 제목: ${complaint.title}
상담 내용: ${complaint.content}
담당 상담원: ${complaint.customer_name}${lawContext}${faqContext}${historyContext}

고객에게 전달할 공식 답변을 정중하고 신뢰감 있게 작성해주세요.
- 한국어로 작성
- 3~5문장 분량
- 신한카드 직원 입장에서 고객에게 보내는 답변 형식
- 친절하고 전문적인 어조
- 관련 법령 내용을 준수하여 정확하게 안내할 것
- FAQ 공식 내용이 있다면 해당 내용을 정확히 반영할 것
- 과거 처리 사례가 있다면 답변 톤과 형식을 참고할 것`

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
