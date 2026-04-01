import { GoogleGenerativeAI } from '@google/generative-ai'
import { AiAnalysis, Priority } from './types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

async function generateWithRetry(prompt: string, retries = 2, delayMs = 15000): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' },
  })

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      const is429 = message.includes('429') || message.includes('Too Many Requests') || message.includes('quota')

      if (is429 && attempt < retries) {
        // 분당 요청 한도(RPM) 초과 시 15초씩 대기 후 재시도
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)))
        continue
      }

      if (is429) {
        throw new Error('API_RATE_LIMIT')
      }
      throw err
    }
  }
  throw new Error('API_RATE_LIMIT')
}

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

  const text = await generateWithRetry(prompt)

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

  const matched = staffList.find((s) =>
    s.specialties.some((sp) => sp.includes(category) || category.includes(sp))
  )

  return matched?.id ?? staffList[0].id
}
