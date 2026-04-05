import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const FAQ_API_URL = 'https://www.shinhancard.com/mob/MOBFM147N/faqProxy.shc'
const FAQ_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'Referer': 'https://www.shinhancard.com/mob/MOBFM147N/MOBFM147R01.shc',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
}
const NODE_IDS = [
  'NODE0000000480', 'NODE0000000253', 'NODE0000000260', 'NODE0000000270',
  'NODE0000000267', 'NODE0000000274', 'NODE0000000249', 'NODE0000000316',
  'NODE0000000295', 'NODE0000000280', 'NODE0000000298', 'NODE0000000301',
  'NODE0000000345', 'NODE0000000287', 'NODE0000000474',
]

function faqApiBody(params: Record<string, unknown>): string {
  return new URLSearchParams({ cmd: JSON.stringify(params) }).toString()
}

async function fetchNodeFaqList(nodeId: string) {
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

export async function GET(req: NextRequest) {
  // 크론 시크릿 검증 (Vercel cron은 Authorization 헤더로 전송)
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0]

  // 1. faq_cache 테이블 생성 (없으면)
  if (accessToken) {
    await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        query: `
          CREATE TABLE IF NOT EXISTS faq_cache (
            id text PRIMARY KEY DEFAULT 'shinhan',
            data jsonb NOT NULL,
            fetched_at timestamptz DEFAULT now()
          );
          ALTER TABLE faq_cache ENABLE ROW LEVEL SECURITY;
          DO $$ BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'faq_cache' AND policyname = 'faq_cache_all'
            ) THEN
              CREATE POLICY "faq_cache_all" ON faq_cache FOR ALL USING (true);
            END IF;
          END $$;
        `,
      }),
    })
    // 스키마 캐시 갱신
    await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ query: "NOTIFY pgrst, 'reload schema';" }),
    })
    await new Promise(r => setTimeout(r, 2000))
  }

  // 2. 신한카드 FAQ 전체 fetch
  const results = await Promise.all(NODE_IDS.map(fetchNodeFaqList))
  const data = results.flat()

  // 3. Supabase에 저장 (upsert)
  const supabase = createServerClient()
  const { error } = await supabase
    .from('faq_cache')
    .upsert({ id: 'shinhan', data, fetched_at: new Date().toISOString() })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, count: data.length, fetched_at: new Date().toISOString() })
}
