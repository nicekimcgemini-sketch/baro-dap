import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { password } = await req.json()

  if (!password || password.length < 6) {
    return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 })
  }

  // staff 테이블에서 email 조회
  const { data: staff, error: fetchError } = await supabase
    .from('staff')
    .select('email')
    .eq('id', params.id)
    .single()

  if (fetchError || !staff) {
    return NextResponse.json({ error: '담당자를 찾을 수 없습니다.' }, { status: 404 })
  }

  // Supabase Auth에서 해당 이메일의 유저 조회
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    return NextResponse.json({ error: '유저 목록 조회 실패' }, { status: 500 })
  }

  const authUser = users.find(u => u.email === staff.email)
  if (!authUser) {
    return NextResponse.json({ error: '해당 이메일로 등록된 계정이 없습니다.' }, { status: 404 })
  }

  // 비밀번호 업데이트 (service role key 필요)
  const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, { password })
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
