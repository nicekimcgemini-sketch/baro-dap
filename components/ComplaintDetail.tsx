'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Complaint, ComplaintStatus, PRIORITY_EMOJI, PRIORITY_LABEL, STATUS_LABEL } from '@/lib/types'

interface Props {
  complaint: Complaint
}

export default function ComplaintDetail({ complaint }: Props) {
  const router = useRouter()
  const [finalResponse, setFinalResponse] = useState(complaint.final_response ?? complaint.ai_response ?? '')
  const [saving, setSaving] = useState(false)

  const updateStatus = async (status: ComplaintStatus) => {
    setSaving(true)
    await fetch(`/api/complaints/${complaint.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setSaving(false)
    router.refresh()
  }

  const saveFinalResponse = async () => {
    setSaving(true)
    await fetch(`/api/complaints/${complaint.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ final_response: finalResponse, status: 'resolved' }),
    })
    setSaving(false)
    router.refresh()
  }

  const nextStatus: Record<ComplaintStatus, ComplaintStatus | null> = {
    pending: 'in_progress',
    in_progress: null,
    resolved: 'closed',
    closed: null,
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 좌측: 민원 정보 */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-800 text-lg mb-4">{complaint.title}</h2>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-400 block mb-1">민원 내용</span>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{complaint.content}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
              <div>
                <span className="text-gray-400 block mb-0.5">접수자</span>
                <p className="text-gray-700">{complaint.customer_name}</p>
              </div>
              <div>
                <span className="text-gray-400 block mb-0.5">연락처</span>
                <p className="text-gray-700">{complaint.customer_contact}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <span className="text-gray-400 block mb-0.5">접수일시</span>
              <p className="text-gray-700">{new Date(complaint.created_at).toLocaleString('ko-KR')}</p>
            </div>
          </div>
        </div>

        {/* 상태 변경 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-400 block mb-1">현재 상태</span>
              <StatusBadge status={complaint.status} />
            </div>
            <div className="flex gap-2">
              {nextStatus[complaint.status] && (
                <button
                  onClick={() => updateStatus(nextStatus[complaint.status]!)}
                  disabled={saving}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {STATUS_LABEL[nextStatus[complaint.status]!]}으로 변경
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 우측: AI 분석 결과 */}
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
          <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
            <span>🤖</span> AI 분석 결과
          </h3>

          {complaint.priority ? (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-blue-600 block mb-0.5 text-xs">긴급도</span>
                  <span className="text-xl">{PRIORITY_EMOJI[complaint.priority]}</span>
                  <span className="text-gray-700 ml-1">{PRIORITY_LABEL[complaint.priority]}</span>
                </div>
                <div>
                  <span className="text-blue-600 block mb-0.5 text-xs">카테고리</span>
                  <span className="bg-white text-gray-700 px-2 py-0.5 rounded text-xs border border-blue-100">
                    {complaint.category}
                  </span>
                </div>
              </div>

              {complaint.ai_analysis && (
                <div>
                  <span className="text-blue-600 block mb-0.5 text-xs">분석 이유</span>
                  <p className="text-gray-600 text-xs">{complaint.ai_analysis.reasoning}</p>
                </div>
              )}

              {complaint.assigned_staff && (
                <div className="pt-2 border-t border-blue-100">
                  <span className="text-blue-600 block mb-0.5 text-xs">배정 담당자</span>
                  <p className="text-gray-700">
                    {complaint.assigned_staff.name}
                    <span className="text-gray-400 ml-1">({complaint.assigned_staff.department})</span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-blue-600 text-sm">AI 분석 중입니다...</p>
          )}
        </div>

        {/* 최종 답변 작성 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-3">최종 답변 작성</h3>
          <textarea
            rows={8}
            value={finalResponse}
            onChange={(e) => setFinalResponse(e.target.value)}
            placeholder="AI 예상 답변을 수정하거나 새로 작성하세요"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
          {complaint.ai_response && finalResponse !== complaint.ai_response && (
            <button
              onClick={() => setFinalResponse(complaint.ai_response!)}
              className="text-xs text-blue-500 hover:underline mt-1"
            >
              AI 답변으로 되돌리기
            </button>
          )}
          <button
            onClick={saveFinalResponse}
            disabled={saving || !finalResponse}
            className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '답변 저장 및 완료 처리'}
          </button>
        </div>
      </div>
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
    <span className={`text-sm px-3 py-1 rounded-full font-medium ${styles[status] ?? ''}`}>
      {STATUS_LABEL[status as keyof typeof STATUS_LABEL] ?? status}
    </span>
  )
}
