'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: staff } = await supabase
        .from('staff')
        .select('name, role')
        .eq('email', user.email!)
        .single()
      if (staff) {
        setUserName(staff.name)
        setUserRole(staff.role === 'admin' ? '관리자' : '상담원')
      }
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="spring-gradient px-6 py-3 flex items-center justify-between shadow-md">
      <Link href="/dashboard" className="text-xl font-bold text-white tracking-wide drop-shadow">
        🦜 baro-dap
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {userName && (
          <span className="text-white/80">
            {userName}
            <span className="text-white/50 text-xs ml-1">({userRole})</span>
          </span>
        )}
        <button onClick={handleLogout} className="text-white/70 hover:text-white transition">
          로그아웃
        </button>
      </div>
    </nav>
  )
}
