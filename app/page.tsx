import ComplaintForm from '@/components/ComplaintForm'
import Link from 'next/link'
import { Complaint, PRIORITY_EMOJI } from '@/lib/types'
import { formatDateShort } from '@/lib/utils'

async function getComplaints(): Promise<Complaint[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/complaints`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function Home() {
  const complaints = await getComplaints()

  const total = complaints.length
  const resolved = complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length
  const inProgress = complaints.filter((c) => c.status === 'in_progress').length
  const pending = complaints.filter((c) => c.status === 'pending').length
  const resolveRate = total > 0 ? Math.round((resolved / total) * 100) : 0

  const statCards = [
    { label: '총 민원', value: total, color: 'text-spring-text' },
    { label: '처리완료율', value: `${resolveRate}%`, color: 'text-spring-emerald' },
    { label: '처리중', value: inProgress, color: 'text-spring-pink' },
    { label: '미처리', value: pending, color: 'text-yellow-500' },
  ]

  const byPriority = [5, 4, 3, 2, 1].map((p) => ({
    p,
    count: complaints.filter((c) => c.priority === p).length,
  }))

  return (
    <div className="min-h-screen bg-spring-soft">
      <header className="spring-gradient px-6 py-4 flex items-center justify-between shadow-md">
        <h1 className="text-2xl font-bold text-white tracking-wide drop-shadow">🦜 baro-dap</h1>
        <Link href="/login" className="text-white/80 hover:text-white text-sm transition">
          관리자/상담원 로그인
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 왼쪽: 민원 접수 폼 */}
        <div>
          <h2 className="text-xl font-bold text-spring-text mb-4">🌸 민원 접수</h2>
          <p className="text-spring-text-light text-sm mb-6">
            불편하신 사항을 접수해 주시면 AI가 분석하여 담당자가 빠르게 처리해드립니다.
          </p>
          <div className="bg-white rounded-2xl shadow-sm border border-spring-pink-border p-8">
            <ComplaintForm />
          </div>
        </div>

        {/* 오른쪽: 대시보드 */}
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-spring-text">📊 대시보드</h2>

          {/* 통계 카드 */}
          <div className="grid grid-cols-2 gap-3">
            {statCards.map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-spring-pink-border p-4 shadow-sm">
                <p className="text-xs text-spring-text-light mb-1">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* 긴급도별 현황 */}
          <div className="bg-white rounded-2xl border border-spring-pink-border p-5 shadow-sm">
            <h3 className="font-semibold text-spring-text mb-3 text-sm">긴급도별 현황</h3>
            <div className="space-y-2">
              {byPriority.map(({ p, count }) => (
                <div key={p} className="flex items-center gap-3">
                  <span className="text-base w-5">{PRIORITY_EMOJI[p as 1 | 2 | 3 | 4 | 5]}</span>
                  <div className="flex-1 bg-spring-pink-light rounded-full h-2">
                    <div
                      className="spring-gradient h-2 rounded-full"
                      style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-sm text-spring-text w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 최근 민원 */}
          <div className="bg-white rounded-2xl border border-spring-pink-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-spring-text text-sm">최근 민원</h3>
              <Link href="/admin" className="text-xs text-spring-pink hover:underline">
                전체 보기
              </Link>
            </div>
            {complaints.length === 0 ? (
              <p className="text-spring-text-light text-sm">접수된 민원이 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {complaints.slice(0, 6).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm py-2 border-b border-spring-pink-light last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span>{c.priority ? PRIORITY_EMOJI[c.priority] : '⏳'}</span>
                      <a href={`/counsel/${c.id}`} className="text-spring-text hover:text-spring-pink transition truncate">
                        {c.title}
                      </a>
                    </div>
                    <span className="text-spring-text-light text-xs shrink-0 ml-2">{formatDateShort(c.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
