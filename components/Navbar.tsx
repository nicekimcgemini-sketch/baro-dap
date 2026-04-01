'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navLinks = [
    { href: '/counsel', label: '민원 목록' },
    { href: '/admin', label: '대시보드' },
    { href: '/admin/staff', label: '담당자 관리' },
  ]

  return (
    <nav className="spring-gradient px-6 py-3 flex items-center justify-between shadow-md">
      <Link href="/" className="text-xl font-bold text-white tracking-wide drop-shadow">
        🦜 baro-dap
      </Link>
      <div className="flex gap-4 text-sm items-center">
        {navLinks.map(({ href, label }) => {
          const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`font-medium transition ${
                isActive
                  ? 'text-white underline underline-offset-4'
                  : 'text-white/75 hover:text-white'
              }`}
            >
              {label}
            </Link>
          )
        })}
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
