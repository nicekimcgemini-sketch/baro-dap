import ComplaintList from '@/components/ComplaintList'
import { Complaint } from '@/lib/types'

async function getComplaints(status?: string): Promise<Complaint[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const url = new URL(`${baseUrl}/api/complaints`)
  if (status) url.searchParams.set('status', status)

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) return []
  return res.json()
}

export default async function CounselPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const complaints = await getComplaints(searchParams.status)

  const statuses = [
    { value: '', label: '전체' },
    { value: 'pending', label: '접수' },
    { value: 'in_progress', label: '처리중' },
    { value: 'resolved', label: '완료' },
    { value: 'closed', label: '종료' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-spring-text">민원 목록</h1>
        <span className="text-sm text-spring-text-light">총 {complaints.length}건</span>
      </div>

      <div className="flex gap-2 mb-4">
        {statuses.map(({ value, label }) => {
          const isActive = (searchParams.status ?? '') === value
          return (
            <a
              key={value}
              href={value ? `/counsel?status=${value}` : '/counsel'}
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

      <ComplaintList complaints={complaints} />
    </div>
  )
}
