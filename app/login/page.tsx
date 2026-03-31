'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
      return
    }

    const { data: staff } = await supabase
      .from('staff')
      .select('role')
      .eq('email', data.user.email!)
      .single()

    if (staff?.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/counsel')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #FFF5F9 0%, #ffffff 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold spring-gradient-text">
            🦜 baro-dap
          </Link>
          <p className="text-spring-text-light text-sm mt-2">관리자 / 상담원 로그인</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-spring-pink-border p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-spring-text mb-1">이메일</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-spring-pink-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spring-emerald bg-spring-bg"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-spring-text mb-1">비밀번호</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-spring-pink-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spring-emerald bg-spring-bg"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-spring-pink text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full spring-gradient text-white py-2.5 rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition shadow-md"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
