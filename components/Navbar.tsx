'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold text-blue-600">
        baro-dap
      </Link>
      <div className="flex gap-4 text-sm">
        {pathname.startsWith('/counsel') && (
          <Link
            href="/counsel"
            className="text-gray-600 hover:text-blue-600 font-medium"
          >
            민원 목록
          </Link>
        )}
        {pathname.startsWith('/admin') && (
          <>
            <Link href="/admin" className="text-gray-600 hover:text-blue-600 font-medium">
              대시보드
            </Link>
            <Link href="/admin/staff" className="text-gray-600 hover:text-blue-600 font-medium">
              담당자 관리
            </Link>
          </>
        )}
        {(pathname.startsWith('/counsel') || pathname.startsWith('/admin')) && (
          <form action="/api/auth/logout" method="POST">
            <button className="text-gray-400 hover:text-red-500 text-sm">로그아웃</button>
          </form>
        )}
      </div>
    </nav>
  )
}
