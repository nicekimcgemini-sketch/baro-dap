import { Complaint, ComplaintStatus, PRIORITY_EMOJI } from '@/lib/types'
import { formatDateShort } from '@/lib/utils'

async function getComplaints(): Promise<Complaint[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/complaints`, { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function AdminPage() {
  const complaints = await getComplaints()

  const total = complaints.length
  const resolved = complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length
  const inProgress = complaints.filter((c) => c.status === 'in_progress').length
  const pending = complaints.filter((c) => c.status === 'pending').length
  const resolveRate = total > 0 ? Math.round((resolved / total) * 100) : 0

  const byPriority = [5, 4, 3, 2, 1].map((p) => ({
    p,
    count: complaints.filter((c) => c.priority === p).length,
  }))

  const categories = Array.from(
    complaints.reduce((acc, c) => {
      if (c.category) acc.set(c.category, (acc.get(c.category) ?? 0) + 1)
      return acc
    }, new Map<string, number>())
  ).sort((a, b) => b[1] - a[1])

  const statCards = [
    { label: '총 민원', value: total, color: 'text-spring-text' },
    { label: '처리 완료율', value: `${resolveRate}%`, color: 'text-spring-emerald' },
    { label: '처리중', value: inProgress, color: 'text-spring-pink' },
    { label: '미처리', value: pending, color: 'text-yellow-500' },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-spring-text">관리자 대시보드</h1>

      {/* 통계 카드 - 1줄 compact */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className="shrink-0 bg-white rounded-xl border border-spring-pink-border px-3 py-2.5 shadow-sm flex items-center gap-2.5">
            <div>
              <p className={`text-xl font-black ${color}`}>{value}</p>
              <p className="text-[11px] text-spring-text-light whitespace-nowrap">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 긴급도별 */}
        <div className="bg-white rounded-2xl border border-spring-pink-border p-4 shadow-sm">
          <h2 className="font-semibold text-spring-text text-sm mb-3">긴급도별 현황</h2>
          <div className="space-y-2">
            {byPriority.map(({ p, count }) => (
              <div key={p} className="flex items-center gap-3">
                <span className="text-lg w-6">{PRIORITY_EMOJI[p as 1 | 2 | 3 | 4 | 5]}</span>
                <div className="flex-1 bg-spring-pink-light rounded-full h-2">
                  <div
                    className="spring-gradient h-2 rounded-full"
                    style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-sm text-spring-text w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 카테고리별 */}
        <div className="bg-white rounded-2xl border border-spring-pink-border p-4 shadow-sm">
          <h2 className="font-semibold text-spring-text text-sm mb-3">카테고리별 현황</h2>
          {categories.length === 0 ? (
            <p className="text-spring-text-light text-sm">데이터 없음</p>
          ) : (
            <div className="space-y-2">
              {categories.map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs text-spring-text w-20 shrink-0 truncate">{cat}</span>
                  <div className="flex-1 bg-spring-emerald-light rounded-full h-2">
                    <div
                      className="bg-spring-emerald h-2 rounded-full"
                      style={{ width: `${(count / total) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-spring-text w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 최근 민원 */}
      <div className="bg-white rounded-2xl border border-spring-pink-border p-4 shadow-sm">
        <h2 className="font-semibold text-spring-text text-sm mb-3">최근 민원</h2>
        <div className="space-y-1">
          {complaints.slice(0, 5).map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-sm py-2 border-b border-spring-pink-light">
              <span className="shrink-0">{c.priority ? PRIORITY_EMOJI[c.priority] : '⏳'}</span>
              <a href={`/counsel/${c.id}`} className="flex-1 min-w-0 truncate text-spring-text hover:text-spring-pink transition">
                {c.title}
              </a>
              <span className="shrink-0 text-spring-text-light text-xs">{formatDateShort(c.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
