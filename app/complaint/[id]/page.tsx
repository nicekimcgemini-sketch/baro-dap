import { Complaint, STATUS_LABEL } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'

async function getComplaint(id: string): Promise<Complaint> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/complaints/${id}`, { cache: 'no-store' })
  if (!res.ok) notFound()
  return res.json()
}

export default async function ComplaintConfirmPage({ params }: { params: { id: string } }) {
  const complaint = await getComplaint(params.id)

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFF5F9 0%, #ffffff 100%)' }}>
      <header className="spring-gradient px-6 py-4 shadow-md">
        <Link href="/" className="text-2xl font-bold text-white tracking-wide drop-shadow">
          🦜 baro-dap
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-spring-text">민원이 접수되었습니다</h2>
          <p className="text-spring-text-light mt-2">AI가 분석하여 담당자를 배정해드렸습니다.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-spring-pink-border p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-spring-pink-light">
            <span className="text-xs text-spring-text-light">접수번호</span>
            <span className="text-xs font-mono text-spring-text-light">{complaint.id}</span>
          </div>

          <div>
            <span className="text-xs text-spring-text-light block mb-1">현재 상태</span>
            <span className="inline-block bg-spring-emerald-light text-spring-emerald text-sm font-medium px-3 py-1 rounded-full">
              {STATUS_LABEL[complaint.status]}
            </span>
          </div>

          <div>
            <span className="text-xs text-spring-text-light block mb-1">민원 제목</span>
            <p className="text-spring-text font-medium">{complaint.title}</p>
          </div>

          <div>
            <span className="text-xs text-spring-text-light block mb-1">민원 내용</span>
            <p className="text-spring-text text-sm whitespace-pre-wrap">{complaint.content}</p>
          </div>

          <div>
            <span className="text-xs text-spring-text-light block mb-1">상담원명</span>
            <p className="text-spring-text text-sm">{complaint.customer_name}</p>
          </div>

          {complaint.category && (
            <div>
              <span className="text-xs text-spring-text-light block mb-1">분류</span>
              <span className="inline-block bg-spring-pink-light text-spring-pink text-sm px-2 py-0.5 rounded-full">
                {complaint.category}
              </span>
            </div>
          )}

          <div className="pt-3 border-t border-spring-pink-light">
            <p className="text-xs text-spring-text-light">
              접수일시: {formatDate(complaint.created_at)}
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-spring-emerald hover:underline font-medium">
            🌸 새 민원 접수하기
          </Link>
        </div>
      </main>
    </div>
  )
}
