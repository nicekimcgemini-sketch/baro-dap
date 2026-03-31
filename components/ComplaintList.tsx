'use client'

import Link from 'next/link'
import { Complaint, STATUS_LABEL, PRIORITY_EMOJI } from '@/lib/types'

interface Props {
  complaints: Complaint[]
}

export default function ComplaintList({ complaints }: Props) {
  if (complaints.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">📭</p>
        <p>접수된 민원이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-gray-500 font-medium w-12">긴급도</th>
            <th className="px-4 py-3 text-left text-gray-500 font-medium">제목</th>
            <th className="px-4 py-3 text-left text-gray-500 font-medium w-20">분류</th>
            <th className="px-4 py-3 text-left text-gray-500 font-medium w-24">접수자</th>
            <th className="px-4 py-3 text-left text-gray-500 font-medium w-20">상태</th>
            <th className="px-4 py-3 text-left text-gray-500 font-medium w-32">접수일시</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {complaints.map((c) => (
            <tr key={c.id} className="hover:bg-blue-50 transition-colors">
              <td className="px-4 py-3 text-center text-lg">
                {c.priority ? PRIORITY_EMOJI[c.priority] : '⏳'}
              </td>
              <td className="px-4 py-3">
                <Link href={`/counsel/${c.id}`} className="text-gray-800 hover:text-blue-600 font-medium">
                  {c.title}
                </Link>
              </td>
              <td className="px-4 py-3">
                {c.category ? (
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                    {c.category}
                  </span>
                ) : (
                  <span className="text-gray-300 text-xs">분석중</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600">{c.customer_name}</td>
              <td className="px-4 py-3">
                <StatusBadge status={c.status} />
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs">
                {new Date(c.created_at).toLocaleString('ko-KR', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700',
    in_progress: 'bg-blue-50 text-blue-700',
    resolved: 'bg-green-50 text-green-700',
    closed: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? ''}`}>
      {STATUS_LABEL[status as keyof typeof STATUS_LABEL] ?? status}
    </span>
  )
}
