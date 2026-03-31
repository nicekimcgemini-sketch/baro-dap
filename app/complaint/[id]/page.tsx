import { Complaint, STATUS_LABEL, PRIORITY_EMOJI, PRIORITY_LABEL } from '@/lib/types'
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-blue-600">baro-dap</Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800">민원이 접수되었습니다</h2>
          <p className="text-gray-500 mt-2">AI가 분석하여 담당자를 배정해드렸습니다.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-xs text-gray-400">접수번호</span>
            <span className="text-xs font-mono text-gray-600">{complaint.id}</span>
          </div>

          <div>
            <span className="text-xs text-gray-400 block mb-1">현재 상태</span>
            <span className="inline-block bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">
              {STATUS_LABEL[complaint.status]}
            </span>
          </div>

          <div>
            <span className="text-xs text-gray-400 block mb-1">민원 제목</span>
            <p className="text-gray-800 font-medium">{complaint.title}</p>
          </div>

          <div>
            <span className="text-xs text-gray-400 block mb-1">민원 내용</span>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{complaint.content}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-400 block mb-1">접수자</span>
              <p className="text-gray-700 text-sm">{complaint.customer_name}</p>
            </div>
            <div>
              <span className="text-xs text-gray-400 block mb-1">연락처</span>
              <p className="text-gray-700 text-sm">{complaint.customer_contact}</p>
            </div>
          </div>

          {complaint.priority && (
            <div>
              <span className="text-xs text-gray-400 block mb-1">AI 분석 긴급도</span>
              <span className="text-lg">
                {PRIORITY_EMOJI[complaint.priority]} {PRIORITY_LABEL[complaint.priority]}
              </span>
            </div>
          )}

          {complaint.category && (
            <div>
              <span className="text-xs text-gray-400 block mb-1">분류</span>
              <span className="inline-block bg-gray-100 text-gray-700 text-sm px-2 py-0.5 rounded">
                {complaint.category}
              </span>
            </div>
          )}

          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              접수일시: {new Date(complaint.created_at).toLocaleString('ko-KR')}
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            새 민원 접수하기
          </Link>
        </div>
      </main>
    </div>
  )
}
