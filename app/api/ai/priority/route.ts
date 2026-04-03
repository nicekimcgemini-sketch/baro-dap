import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Priority } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { title, content } = await req.json()

  if (!title || !content) {
    return NextResponse.json({ error: '제목과 내용이 필요합니다.' }, { status: 400 })
  }

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
{
  "priority": 1~5 사이 숫자,
  "reasoning": "긴급도 판단 이유 (1~2문장, 한국어)"
}`

  try {
    const result = await model.generateContent(prompt)
    const parsed = JSON.parse(result.response.text())
    return NextResponse.json({
      priority: Math.min(5, Math.max(1, parseInt(parsed.priority))) as Priority,
      reasoning: parsed.reasoning,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const is429 = message.includes('429') || message.includes('quota')
    if (is429) {
      return NextResponse.json({ error: '잠시 후 다시 시도해 주세요.' }, { status: 429 })
    }
    return NextResponse.json({ error: 'AI 분석에 실패했습니다.' }, { status: 502 })
  }
}
