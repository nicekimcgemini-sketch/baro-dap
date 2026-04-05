// 신한카드 공식 FAQ API 연동
// POST https://www.shinhancard.com/mob/MOBFM147N/faqProxy.shc
// data: { cmd: JSON.stringify(params) }
// 매일 /api/faq/refresh (Vercel cron) 로 Supabase faq_cache 테이블에 저장

const FAQ_API_URL = 'https://www.shinhancard.com/mob/MOBFM147N/faqProxy.shc'

const FAQ_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'Referer': 'https://www.shinhancard.com/mob/MOBFM147N/MOBFM147R01.shc',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
}

const NODE_IDS = [
  'NODE0000000480', // 민생회복 소비쿠폰
  'NODE0000000253', // 카드발급
  'NODE0000000260', // 결제/청구
  'NODE0000000270', // 한도/승인
  'NODE0000000267', // 포인트/혜택
  'NODE0000000274', // 분실/도난/부정사용
  'NODE0000000249', // 앱/온라인
  'NODE0000000316',
  'NODE0000000295',
  'NODE0000000280',
  'NODE0000000298',
  'NODE0000000301',
  'NODE0000000345',
  'NODE0000000287',
  'NODE0000000474',
]

export interface FaqItem {
  kbId: string
  nodeId: string
  nodeName: string
  title: string
  hitCount: number
}

export interface FaqWithContent extends FaqItem {
  answer: string
}

// 인메모리 캐시 (Supabase 읽기 실패 시 fallback)
let cache: { data: FaqItem[]; fetchedAt: number } | null = null
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6시간

function faqApiBody(params: Record<string, unknown>): string {
  return new URLSearchParams({ cmd: JSON.stringify(params) }).toString()
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

async function fetchNodeFaqList(nodeId: string): Promise<FaqItem[]> {
  try {
    const res = await fetch(FAQ_API_URL, {
      method: 'POST',
      headers: FAQ_HEADERS,
      body: faqApiBody({
        command: 'FaqList',
        includeSubNode: 'Y',
        removeLinkKbIdFlag: 'Y',
        domainId: 'shcard',
        nodeIds: nodeId,
        pageNo: 1,
        rowsPerPage: 110,
      }),
    })
    const json = await res.json()
    if (json.errorCode !== 0) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (json.data?.faqList ?? []).map((item: any) => ({
      kbId: item.kbId,
      nodeId: item.nodeId,
      nodeName: item.nodeName,
      title: item.title?.trim() ?? '',
      hitCount: item.hitCount ?? 0,
    }))
  } catch {
    return []
  }
}

/** 15개 nodeId 전체 FAQ 목록 반환
 * 우선순위: 1) 인메모리 캐시 → 2) Supabase faq_cache → 3) 신한카드 API 직접 호출
 */
export async function getAllFaqs(): Promise<FaqItem[]> {
  // 1) 인메모리 캐시
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data
  }

  // 2) Supabase faq_cache 에서 읽기
  try {
    const { createServerClient } = await import('@/lib/supabase')
    const supabase = createServerClient()
    const { data: row } = await supabase
      .from('faq_cache')
      .select('data, fetched_at')
      .eq('id', 'shinhan')
      .single()

    if (row?.data) {
      const data = row.data as FaqItem[]
      cache = { data, fetchedAt: new Date(row.fetched_at).getTime() }
      return data
    }
  } catch {
    // Supabase 연결 실패 시 API fallback
  }

  // 3) 신한카드 API 직접 호출 (fallback)
  const results = await Promise.all(NODE_IDS.map(fetchNodeFaqList))
  const data = results.flat()
  cache = { data, fetchedAt: Date.now() }
  return data
}

/** 특정 FAQ 답변(contents) 가져오기 */
async function fetchFaqAnswer(kbId: string, nodeId: string): Promise<string> {
  try {
    const res = await fetch(FAQ_API_URL, {
      method: 'POST',
      headers: FAQ_HEADERS,
      body: faqApiBody({
        command: 'FaqDetailView',
        domainId: 'shcard',
        kbId,
        nodeId,
      }),
    })
    const json = await res.json()
    if (json.errorCode !== 0) return ''
    return stripHtml(json.data?.kbInfo?.contents ?? '')
  } catch {
    return ''
  }
}

/** 민원 제목+내용 기반으로 관련 FAQ 찾기 (제목+답변 포함, 최대 3개) */
export async function findRelatedFaqsWithContent(
  title: string,
  content: string
): Promise<FaqWithContent[]> {
  const allFaqs = await getAllFaqs()
  const query = `${title} ${content}`.toLowerCase()
  const keywords = query.split(/\s+/).filter((w) => w.length > 1)

  const scored = allFaqs
    .map((faq) => {
      const faqText = faq.title.toLowerCase()
      const score = keywords.filter((k) => faqText.includes(k)).length
      return { faq, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.faq.hitCount - a.faq.hitCount)
    .slice(0, 3)
    .map(({ faq }) => faq)

  const withContent = await Promise.all(
    scored.map(async (faq) => ({
      ...faq,
      answer: await fetchFaqAnswer(faq.kbId, faq.nodeId),
    }))
  )

  return withContent.filter((f) => f.answer.length > 0)
}
