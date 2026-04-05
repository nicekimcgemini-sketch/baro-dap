import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const PASSWORD = 'Shinhan@2026'

export async function GET() {
  const supabase = createServerClient()

  // 1. 전체 담당자 조회
  const { data: staffList, error: fetchError } = await supabase
    .from('staff')
    .select('id, name, email')

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!staffList?.length) return NextResponse.json({ error: '담당자가 없습니다.' }, { status: 404 })

  // 2. 각 담당자 auth 등록 (이미 있으면 비밀번호 업데이트)
  const results = await Promise.all(
    staffList.map(async (s) => {
      // 기존 유저 조회
      const { data: existing } = await supabase.auth.admin.listUsers()
      const existingUser = existing?.users?.find(u => u.email === s.email)

      if (existingUser) {
        // 비밀번호 업데이트
        const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
          password: PASSWORD,
        })
        return { name: s.name, email: s.email, action: 'updated', error: error?.message }
      } else {
        // 신규 생성
        const { error } = await supabase.auth.admin.createUser({
          email: s.email,
          password: PASSWORD,
          email_confirm: true,
        })
        return { name: s.name, email: s.email, action: 'created', error: error?.message }
      }
    })
  )

  const succeeded = results.filter(r => !r.error)
  const failed = results.filter(r => r.error)

  return NextResponse.json({
    total: staffList.length,
    succeeded: succeeded.length,
    failed: failed.length,
    details: results,
  })
}
