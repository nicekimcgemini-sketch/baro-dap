import { GoogleGenerativeAI } from '@google/generative-ai'
import { AiAnalysis, Priority } from './types'
import { findRelatedFaqsWithContent } from './shinhan-faq'
import type { SimilarResponse } from './complaint-history'
import { findRelevantLaws } from './consumer-law'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

async function generateWithRetry(prompt: string, retries = 2, delayMs = 15000): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
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

export async function analyzeComplaint(
  title: string,
  content: string,
  similarResponses: SimilarResponse[] = []
): Promise<AiAnalysis> {
  const relatedFaqs = await findRelatedFaqsWithContent(title, content)
  const faqContext = relatedFaqs.length > 0
    ? `\n\n[신한카드 공식 FAQ 참고 - 아래 내용을 바탕으로 정확한 답변 작성]\n${
        relatedFaqs.map((f, i) =>
          `${i + 1}. Q: ${f.title}\n   A: ${f.answer}`
        ).join('\n\n')
      }\n위 FAQ 공식 답변 내용을 반드시 반영하여 답변의 정확도를 높이세요.`
    : ''

  const historyContext = similarResponses.length > 0
    ? `\n\n[과거 유사 민원 처리 사례 - 상담원이 직접 작성한 답변이므로 스타일과 내용을 참고하세요]\n${
        similarResponses.map((r, i) =>
          `${i + 1}. 민원: ${r.title}\n   카테고리: ${r.category ?? '미분류'}\n   답변: ${r.final_response}`
        ).join('\n\n')
      }`
    : ''

  const relevantLaws = findRelevantLaws(title, content)
  const lawContext = relevantLaws.length > 0
    ? `\n\n[한국소비자원 생활법령 - 신용카드 이용자 관련 법령 (반드시 준수)]\n${
        relevantLaws.map((l) => l.content).join('\n\n')
      }`
    : ''

  const prompt = `당신은 신한카드 고객 민원 대응 전문가입니다. 신한카드 고객이 접수한 민원을 분석하고 JSON 형식으로 답변해주세요.

신한카드는 카드 발급, 한도, 결제, 포인트/혜택, 분실/도난, 부정사용, 앱/온라인 서비스, 민생회복 소비쿠폰 등 금융 서비스를 제공하는 카드사입니다.
답변은 신한카드 직원이 고객에게 보내는 공식 답변 초안으로, 정중하고 신뢰감 있게 작성해야 합니다.
금융 민원의 특성상 개인정보 보호, 금융소비자보호법 등을 준수하는 어조를 유지하세요.${lawContext}${faqContext}${historyContext}

민원 제목: ${title}
민원 내용: ${content}

다음 JSON 형식으로만 답변하세요 (다른 텍스트 없이):
{
  "priority": 1~5 사이 숫자 (기준: 5=부정사용·분실·도난·개인정보유출, 4=이중청구·결제오류·한도차단·긴급민원, 3=일반 결제문의·한도조정, 2=포인트·혜택·카드발급 문의, 1=단순 안내 요청),
  "category": "결제/청구" | "카드발급/해지" | "한도/승인" | "포인트/혜택" | "분실/도난/부정사용" | "앱/온라인" | "기타" 중 하나,
  "department": "현업" | "IT" 중 하나,
  "ai_response": "신한카드 공식 답변 초안 (한국어, 정중하고 신뢰감 있게, 3~5문장)",
  "reasoning": "긴급도와 카테고리를 이렇게 판단한 이유 (한국어, 1~2문장)",
  "is_legal_sensitive": true | false (여신전문금융업법·할부거래법·신용정보법·금융소비자보호법·개인정보보호법 등 법령상 소비자 권리·의무·분쟁·처벌과 직접 관련된 민감한 사항이면 true),
  "legal_topics": ["관련 법령명 또는 권리 항목 (예: 할부청약철회권, 여신전문금융업법 제14조, 부정사용 보상 기준 등)"] (is_legal_sensitive가 true일 때만 1~3개, false면 빈 배열 [])
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
      is_legal_sensitive: parsed.is_legal_sensitive ?? false,
      legal_topics: Array.isArray(parsed.legal_topics) ? parsed.legal_topics : [],
    }
  } catch {
    return {
      priority: 3,
      category: '기타',
      department: '현업',
      ai_response: '민원을 접수하였습니다. 담당자가 확인 후 빠르게 처리해드리겠습니다.',
      reasoning: 'AI 분석에 실패하여 기본값으로 설정되었습니다.',
      is_legal_sensitive: false,
      legal_topics: [],
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
