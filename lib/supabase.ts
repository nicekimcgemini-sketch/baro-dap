import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 클라이언트 사이드 싱글턴
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 서버 사이드 싱글턴 (요청마다 새 인스턴스 생성 방지)
let _serverClient: ReturnType<typeof createClient> | null = null

export function createServerClient() {
  if (!_serverClient) {
    _serverClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _serverClient
}
