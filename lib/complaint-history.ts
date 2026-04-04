import { SupabaseClient } from '@supabase/supabase-js'

export interface SimilarResponse {
  title: string
  content: string
  category: string | null
  final_response: string
}

/**
 * 이전에 수기로 작성된 답변 중 현재 민원과 유사한 사례를 반환합니다.
 * - 해결/종료 상태이고 final_response가 있는 민원만 대상
 * - 최근 100건 내에서 키워드 매칭으로 유사도 계산
 */
export async function findSimilarResponses(
  supabase: SupabaseClient,
  title: string,
  content: string,
  topK = 2
): Promise<SimilarResponse[]> {
  const { data } = await supabase
    .from('complaints')
    .select('title, content, category, final_response')
    .in('status', ['resolved', 'closed'])
    .not('final_response', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(100)

  if (!data || data.length === 0) return []

  const query = `${title} ${content}`.toLowerCase()
  const keywords = query.split(/\s+/).filter((w) => w.length > 1)

  const scored = data
    .map((row) => {
      const text = `${row.title} ${row.content}`.toLowerCase()
      const score = keywords.filter((k) => text.includes(k)).length
      return { row, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ row }) => row as SimilarResponse)

  return scored
}
