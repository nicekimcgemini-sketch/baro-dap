'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Props {
  section: 'counsel' | 'admin'
}

export default function Navbar({ section }: Props) {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="spring-gradient px-6 py-3 flex items-center justify-between shadow-md">
      <Link href="/" className="text-xl font-bold text-white tracking-wide drop-shadow">
        🦜 baro-dap
      </Link>
      <div className="flex gap-4 text-sm items-center">
        {section === 'counsel' && (
          <Link href="/counsel" className="text-white/90 hover:text-white font-medium transition">
            민원 목록
          </Link>
        )}
        {section === 'admin' && (
          <>
            <Link href="/admin" className="text-white/90 hover:text-white font-medium transition">
              대시보드
            </Link>
            <Link href="/admin/staff" className="text-white/90 hover:text-white font-medium transition">
              담당자 관리
            </Link>
          </>
        )}
        <button
          onClick={handleLogout}
          className="text-white/70 hover:text-white text-sm transition"
        >
          로그아웃
        </button>
      </div>
    </nav>
  )
}
