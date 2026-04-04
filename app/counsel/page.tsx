import ComplaintList from '@/components/ComplaintList'
import { Complaint, PRIORITY_EMOJI, PRIORITY_LABEL } from '@/lib/types'

async function getComplaints(status?: string, priority?: string): Promise<Complaint[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const url = new URL(`${baseUrl}/api/complaints`)
  if (status) url.searchParams.set('status', status)
  if (priority) url.searchParams.set('priority', priority)

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

function buildUrl(params: { status?: string; priority?: string }) {
  const qs = new URLSearchParams()
  if (params.status) qs.set('status', params.status)
  if (params.priority) qs.set('priority', params.priority)
  const str = qs.toString()
  return str ? `/counsel?${str}` : '/counsel'
}

export default async function CounselPage({
  searchParams,
}: {
  searchParams: { status?: string; priority?: string }
}) {
  const complaints = await getComplaints(searchParams.status, searchParams.priority)

  const statuses = [
    { value: '', label: '전체' },
    { value: 'pending', label: '접수' },
    { value: 'in_progress', label: '처리중' },
    { value: 'resolved', label: '완료' },
    { value: 'closed', label: '종료' },
  ]

  const priorities = [
    { value: '', label: '전체' },
    { value: '5', label: `${PRIORITY_EMOJI[5]} 매우높음` },
    { value: '4', label: `${PRIORITY_EMOJI[4]} 높음` },
    { value: '3', label: `${PRIORITY_EMOJI[3]} 보통` },
    { value: '2', label: `${PRIORITY_EMOJI[2]} 낮음` },
    { value: '1', label: `${PRIORITY_EMOJI[1]} 매우낮음` },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-spring-text">민원 목록</h1>
        <span className="text-sm text-spring-text-light">총 {complaints.length}건</span>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        {statuses.map(({ value, label }) => {
          const isActive = (searchParams.status ?? '') === value
          return (
            <a
              key={value}
              href={buildUrl({ status: value, priority: searchParams.priority })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                isActive
                  ? 'spring-gradient text-white shadow-md'
                  : 'bg-white text-spring-text border border-spring-pink-border hover:border-spring-pink'
              }`}
            >
              {label}
            </a>
          )
        })}
      </div>

      <div className="flex gap-2 mb-5 flex-wrap items-center">
        <span className="text-xs text-spring-text-light font-medium mr-1">긴급도</span>
        {priorities.map(({ value, label }) => {
          const isActive = (searchParams.priority ?? '') === value
          return (
            <a
              key={value}
              href={buildUrl({ status: searchParams.status, priority: value })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                isActive
                  ? 'bg-spring-emerald text-white shadow-md'
                  : 'bg-white text-spring-text border border-spring-pink-border hover:border-spring-emerald'
              }`}
            >
              {label}
            </a>
          )
        })}
      </div>

      <ComplaintList complaints={complaints} />
    </div>
  )
}
