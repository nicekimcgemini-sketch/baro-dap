'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ProfileModal from '@/components/ProfileModal'
import { Staff } from '@/lib/types'

export default function Navbar() {
  const router = useRouter()
  const [staffInfo, setStaffInfo] = useState<Staff | null>(null)
  const [showProfile, setShowProfile] = useState(false)

  const userName = staffInfo?.name ?? ''
  const userRole = staffInfo ? (staffInfo.role === 'admin' ? '관리자' : '상담원') : ''

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: staff } = await supabase
        .from('staff')
        .select('*')
        .eq('email', user.email!)
        .single()
      if (staff) setStaffInfo(staff as Staff)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="h-20 w-full bg-gradient-to-r from-[#00C2A0] via-[#00B4D8] to-[#FF2A7A] flex items-center justify-between px-6 lg:px-10 shadow-lg sticky top-0 z-50 border-b border-white/20"
      style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      {/* 앵무새 로고 */}
      <Link href="/dashboard" className="flex items-center gap-4 group">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute inset-0 bg-white/40 blur-md rounded-full group-hover:scale-110 transition-transform duration-500" />
          <span className="text-[36px] relative z-10 drop-shadow-xl" style={{ animation: 'float 6s ease-in-out infinite' }}>
            🦜
          </span>
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-xl md:text-2xl font-black tracking-tighter text-white drop-shadow-sm flex items-baseline gap-2">
            baro-dap
            <span className="px-2 py-0.5 rounded border border-white/30 bg-white/20 text-[10px] uppercase font-bold tracking-widest text-white/90">
              {userRole || 'AI'}
            </span>
          </span>
          <span className="hidden md:block text-[10px] font-medium text-white/80 tracking-widest uppercase mt-0.5">
            AI Complaint Management
          </span>
        </div>
      </Link>

      {/* 우측 */}
      <div className="flex items-center gap-5 text-white">
        {userName && (
          <button
            onClick={() => setShowProfile(true)}
            className="hidden md:flex items-center gap-3 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-white/20 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-sm font-black">
              {userName[0]}
            </div>
            <div className="text-sm text-right">
              <div className="font-semibold leading-tight">{userName}</div>
              <div className="text-[11px] text-white/70">{userRole}</div>
            </div>
          </button>
        )}

        {userRole === '관리자' && (
          <>
            {/* 데스크탑 */}
            <Link
              href="/admin/staff"
              className="hidden md:flex items-center gap-1.5 text-sm font-bold text-white/90 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/10 border border-white/20 hover:border-white/40 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                <path d="M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1,0-16,24,24,0,1,0-23.63-28.19,8,8,0,1,1-15.72-2.62A40,40,0,1,1,192,112a67.5,67.5,0,0,1,54.4,27.2A8,8,0,0,1,244.8,150.4ZM136,184a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16h88A8,8,0,0,1,136,184Zm-32-56a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H96A8,8,0,0,1,104,128Zm-8-56a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H88A8,8,0,0,1,96,72Z"/>
              </svg>
              담당자 관리
            </Link>
            {/* 모바일 아이콘만 */}
            <Link
              href="/admin/staff"
              className="md:hidden p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="담당자 관리"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1,0-16,24,24,0,1,0-23.63-28.19,8,8,0,1,1-15.72-2.62A40,40,0,1,1,192,112a67.5,67.5,0,0,1,54.4,27.2A8,8,0,0,1,244.8,150.4ZM136,184a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16h88A8,8,0,0,1,136,184Zm-32-56a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H96A8,8,0,0,1,104,128Zm-8-56a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H88A8,8,0,0,1,96,72Z"/>
              </svg>
            </Link>
          </>
        )}

        <div className="h-6 w-px bg-white/30 hidden md:block" />

        <button
          onClick={handleLogout}
          className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          title="로그아웃"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 256 256">
            <path d="M120,216a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8h64a8,8,0,0,1,0,16H56V208h56A8,8,0,0,1,120,216Zm109.66-93.66-40-40a8,8,0,0,0-11.32,11.32L204.69,120H112a8,8,0,0,0,0,16h92.69l-26.35,26.34a8,8,0,0,0,11.32,11.32l40-40A8,8,0,0,0,229.66,122.34Z" />
          </svg>
        </button>
      </div>

      {showProfile && staffInfo && (
        <ProfileModal
          staff={staffInfo}
          onClose={() => setShowProfile(false)}
          onUpdated={(updated) => setStaffInfo(updated)}
        />
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </nav>
  )
}
