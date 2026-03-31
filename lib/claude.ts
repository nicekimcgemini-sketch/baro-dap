import Anthropic from '@anthropic-ai/sdk'
import { AiAnalysis, Priority } from './types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function analyzeComplaint(title: string, content: string): Promise<AiAnalysis> {
  const prompt = `당신은 민원 처리 전문가입니다. 다음 민원을 분석하고 JSON 형식으로 답변해주세요.

민원 제목: ${title}
민원 내용: ${content}

다음 JSON 형식으로만 답변하세요 (다른 텍스트 없이):
{
  "priority": 1~5 사이 숫자 (1=매우낮음, 2=낮음, 3=보통, 4=높음, 5=매우높음),
  "category": "시설" | "IT" | "행정" | "민원" | "기타" 중 하나,
  "department": "현업" | "IT" 중 하나,
  "ai_response": "민원에 대한 적절한 답변 초안 (한국어, 정중하게)",
  "reasoning": "긴급도와 카테고리를 이렇게 판단한 이유 (한국어, 1~2문장)"
}`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const parsed = JSON.parse(text)
    return {
      priority: parsed.priority as Priority,
      category: parsed.category,
      department: parsed.department,
      ai_response: parsed.ai_response,
      reasoning: parsed.reasoning,
    }
  } catch {
    // JSON 파싱 실패 시 기본값
    return {
      priority: 3,
      category: '기타',
      department: '현업',
      ai_response: '민원을 접수하였습니다. 담당자가 확인 후 빠르게 처리해드리겠습니다.',
      reasoning: 'AI 분석에 실패하여 기본값으로 설정되었습니다.',
    }
  }
}

export async function findBestStaff(
  category: string,
  department: string,
  staffList: Array<{ id: string; name: string; specialties: string[] }>
): Promise<string | null> {
  if (staffList.length === 0) return null

  // specialties에 카테고리가 포함된 담당자 우선
  const matched = staffList.find((s) =>
    s.specialties.some((sp) => sp.includes(category) || category.includes(sp))
  )

  return matched?.id ?? staffList[0].id
}
