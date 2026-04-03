'use client'

import Link from 'next/link'
import { Complaint, STATUS_LABEL, PRIORITY_EMOJI } from '@/lib/types'
import { formatDateShort } from '@/lib/utils'

interface Props {
  complaints: Complaint[]
}

export default function ComplaintList({ complaints }: Props) {
  if (complaints.length === 0) {
    return (
      <div className="text-center py-16 text-spring-text-light">
        <p className="text-4xl mb-3">🌸</p>
        <p>접수된 민원이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-spring-pink-border overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-spring-pink-light border-b border-spring-pink-border">
            <th className="px-4 py-3 text-left text-spring-text font-semibold w-12">긴급도</th>
            <th className="px-4 py-3 text-left text-spring-text font-semibold">제목</th>
            <th className="px-4 py-3 text-left text-spring-text font-semibold w-20">분류</th>
            <th className="px-4 py-3 text-left text-spring-text font-semibold w-24">상담원명</th>
            <th className="px-4 py-3 text-left text-spring-text font-semibold w-20">상태</th>
            <th className="px-4 py-3 text-left text-spring-text font-semibold w-32">접수일시</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-spring-pink-light">
          {complaints.map((c) => (
            <tr key={c.id} className="hover:bg-spring-emerald-light transition-colors">
              <td className="px-4 py-3 text-center text-lg">
                {c.priority ? PRIORITY_EMOJI[c.priority] : '⏳'}
              </td>
              <td className="px-4 py-3">
                <Link href={`/counsel/${c.id}`} className="text-spring-text hover:text-spring-pink font-medium transition">
                  {c.title}
                </Link>
              </td>
              <td className="px-4 py-3">
                {c.category ? (
                  <span className="bg-spring-pink-light text-spring-pink px-2 py-0.5 rounded-full text-xs font-medium">
                    {c.category}
                  </span>
                ) : (
                  <span className="text-spring-text-light text-xs">분석중</span>
                )}
              </td>
              <td className="px-4 py-3 text-spring-text">{c.customer_name}</td>
              <td className="px-4 py-3">
                <StatusBadge status={c.status} />
              </td>
              <td className="px-4 py-3 text-spring-text-light text-xs">
                {formatDateShort(c.created_at)}
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
    pending:     'bg-yellow-50 text-yellow-600',
    in_progress: 'bg-spring-emerald-light text-spring-emerald',
    resolved:    'bg-spring-pink-light text-spring-pink',
    closed:      'bg-gray-100 text-gray-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? ''}`}>
      {STATUS_LABEL[status as keyof typeof STATUS_LABEL] ?? status}
    </span>
  )
}
