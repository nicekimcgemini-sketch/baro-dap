import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const phones: Record<string, string> = {
  'mirae.kang@shinhancard.com':   '010-3200-0201',
  'taejun.kim@shinhancard.com':   '010-3200-0202',
  'sohyun.park@shinhancard.com':  '010-3200-0203',
  'sejin.oh@shinhancard.com':     '010-3200-0204',
  'chaewon.yun@shinhancard.com':  '010-3200-0205',
  'junhyuk.lee@shinhancard.com':  '010-3200-0206',
  'dohyun.lim@shinhancard.com':   '010-3200-0207',
  'haneul.jung@shinhancard.com':  '010-3200-0208',
  'minseo.choi@shinhancard.com':  '010-3200-0209',
  'jisu.han@shinhancard.com':     '010-3200-0210',
  'minjun@company.com':          '010-1234-5601',
  'seoyeon@company.com':         '010-1234-5602',
  'jiho@company.com':            '010-1234-5603',
  'haeun@company.com':           '010-1234-5604',
  'suhyun.jung@company.com':     '010-2100-0101',
  'jiwoo.han@company.com':       '010-2100-0102',
  'minseo.oh@company.com':       '010-2100-0103',
  'chaewon.yoon@company.com':    '010-2100-0104',
  'dohyun.lim@company.com':      '010-2100-0105',
  'nayeon.kang@company.com':     '010-2100-0106',
  'yejun.shin@company.com':      '010-2100-0107',
  'soyeon.bae@company.com':      '010-2100-0108',
  'hyunwoo.jo@company.com':      '010-2100-0109',
  'jimin.ryu@company.com':       '010-2100-0110',
  'daeun.hwang@company.com':     '010-2100-0111',
  'sungho.moon@company.com':     '010-2100-0112',
  'areum.song@company.com':      '010-2100-0113',
  'minho.jeon@company.com':      '010-2100-0114',
  'yujin.noh@company.com':       '010-2100-0115',
}

export async function GET() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN
  if (!accessToken) {
    return NextResponse.json(
      { error: '.env.local의 SUPABASE_ACCESS_TOKEN을 입력해주세요. (https://supabase.com/dashboard/account/tokens)' },
      { status: 400 }
    )
  }

  // 1. phone 컬럼 추가 (없으면)
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0]
  const migRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query: 'ALTER TABLE staff ADD COLUMN IF NOT EXISTS phone text;' }),
  })

  if (!migRes.ok) {
    const detail = await migRes.text()
    return NextResponse.json({ error: 'phone 컬럼 추가 실패', detail }, { status: 500 })
  }

  // PostgREST 스키마 캐시 갱신
  await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query: "NOTIFY pgrst, 'reload schema';" }),
  })
  await new Promise(r => setTimeout(r, 2000))

  // 2. 연락처 업데이트
  const supabase = createServerClient()
  const results = await Promise.all(
    Object.entries(phones).map(([email, phone]) =>
      supabase.from('staff').update({ phone }).eq('email', email)
    )
  )

  const errors = results.filter(r => r.error).map(r => r.error!.message)
  if (errors.length > 0) return NextResponse.json({ errors }, { status: 500 })

  return NextResponse.json({ updated: Object.keys(phones).length })
}
