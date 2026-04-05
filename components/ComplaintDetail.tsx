'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Complaint, ComplaintStatus, Priority, PRIORITY_EMOJI, PRIORITY_LABEL, STATUS_LABEL, RelatedStaff } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface Props {
  complaint: Complaint
}

const CATEGORIES = ['시설', 'IT', '행정', '민원', '기타']
const PRIORITIES: Priority[] = [1, 2, 3, 4, 5]

export default function ComplaintDetail({ complaint }: Props) {
  const router = useRouter()
  const [finalResponse, setFinalResponse] = useState(complaint.final_response ?? complaint.ai_response ?? '')
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manualPriority, setManualPriority] = useState<Priority>(complaint.priority ?? 3)
  const [manualCategory, setManualCategory] = useState(complaint.category ?? '기타')
  const [manualSaving, setManualSaving] = useState(false)

  const reAnalyze = async () => {
    setAnalyzing(true)
    const res = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaint_id: complaint.id }),
    })
    const data = await res.json()
    if (!res.ok) alert('AI 분석 오류: ' + data.error)
    else router.refresh()
    setAnalyzing(false)
  }

  const saveManual = async () => {
    setManualSaving(true)
    await fetch(`/api/complaints/${complaint.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority: manualPriority, category: manualCategory }),
    })
    setManualSaving(false)
    setShowManual(false)
    router.refresh()
  }

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
        <div className="bg-white rounded-2xl border border-spring-pink-border p-5 shadow-sm">
          <h2 className="font-bold text-spring-text text-lg mb-4">{complaint.title}</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-spring-text-light block mb-1">민원 내용</span>
              <p className="text-spring-text whitespace-pre-wrap leading-relaxed">{complaint.content}</p>
            </div>
            <div className="pt-3 border-t border-spring-pink-light">
              <span className="text-spring-text-light block mb-0.5">상담원명</span>
              <p className="text-spring-text">{complaint.customer_name}</p>
            </div>
            <div className="pt-3 border-t border-spring-pink-light">
              <span className="text-spring-text-light block mb-0.5">접수일시</span>
              <p className="text-spring-text">{formatDate(complaint.created_at)}</p>
            </div>
          </div>
        </div>

        {/* 상태 변경 */}
        <div className="bg-white rounded-2xl border border-spring-pink-border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-spring-text-light block mb-1">현재 상태</span>
              <StatusBadge status={complaint.status} />
            </div>
            {nextStatus[complaint.status] && (
              <button
                onClick={() => updateStatus(nextStatus[complaint.status]!)}
                disabled={saving}
                className="spring-gradient text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-50 shadow-sm"
              >
                {STATUS_LABEL[nextStatus[complaint.status]!]}으로 변경
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 우측: AI 분석 결과 */}
      <div className="space-y-4">
        <div className="bg-spring-emerald-light rounded-2xl border border-spring-emerald/30 p-5">
          <h3 className="font-semibold text-spring-emerald-dark mb-4 flex items-center gap-2">
            <span>🤖</span> AI 분석 결과
          </h3>

          {/* AI 분석 / 수동 입력 버튼 */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={reAnalyze}
              disabled={analyzing}
              className="flex-1 spring-gradient text-white text-sm py-2 rounded-xl hover:opacity-90 disabled:opacity-50 shadow-sm"
            >
              {analyzing ? 'AI 분석 중...' : '🔄 AI 분석 실행'}
            </button>
            <button
              onClick={() => setShowManual(!showManual)}
              className="flex-1 bg-white border border-spring-pink-border text-spring-text text-sm py-2 rounded-xl hover:border-spring-pink transition"
            >
              ✏️ 수동 입력
            </button>
          </div>

          {/* 수동 입력 폼 */}
          {showManual && (
            <div className="mb-4 bg-white rounded-xl border border-spring-pink-border p-4 space-y-3">
              <p className="text-xs font-semibold text-spring-text">수동 분석 입력</p>

              <div>
                <span className="text-xs text-spring-text-light block mb-1.5">긴급도</span>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setManualPriority(p)}
                      className={`flex-1 py-1.5 rounded-lg text-lg transition border ${
                        manualPriority === p
                          ? 'border-spring-pink bg-spring-pink-light'
                          : 'border-spring-pink-border bg-white hover:bg-spring-pink-light'
                      }`}
                      title={PRIORITY_LABEL[p]}
                    >
                      {PRIORITY_EMOJI[p]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-spring-text-light mt-1 text-center">
                  {PRIORITY_EMOJI[manualPriority]} {PRIORITY_LABEL[manualPriority]}
                </p>
              </div>

              <div>
                <span className="text-xs text-spring-text-light block mb-1.5">카테고리</span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setManualCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition border ${
                        manualCategory === cat
                          ? 'spring-gradient text-white border-transparent'
                          : 'border-spring-pink-border text-spring-text hover:border-spring-pink'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveManual}
                  disabled={manualSaving}
                  className="flex-1 spring-gradient text-white text-sm py-1.5 rounded-xl hover:opacity-90 disabled:opacity-50 shadow-sm"
                >
                  {manualSaving ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={() => setShowManual(false)}
                  className="flex-1 bg-white border border-spring-pink-border text-spring-text-light text-sm py-1.5 rounded-xl hover:border-spring-pink transition"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {complaint.priority ? (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-spring-emerald block mb-0.5 text-xs font-medium">긴급도</span>
                  <span className="text-xl">{PRIORITY_EMOJI[complaint.priority]}</span>
                  <span className="text-spring-text ml-1">{PRIORITY_LABEL[complaint.priority]}</span>
                </div>
                <div>
                  <span className="text-spring-emerald block mb-0.5 text-xs font-medium">카테고리</span>
                  <span className="bg-white text-spring-text px-2 py-0.5 rounded-full text-xs border border-spring-emerald/30">
                    {complaint.category}
                  </span>
                </div>
              </div>

              {complaint.ai_analysis?.is_legal_sensitive && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-base">⚖️</span>
                    <span className="text-xs font-semibold text-amber-700">법령 민감 민원</span>
                  </div>
                  {complaint.ai_analysis.legal_topics && complaint.ai_analysis.legal_topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {complaint.ai_analysis.legal_topics.map((topic, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-white border border-amber-200 rounded-full text-xs text-amber-800 font-medium"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-amber-600 mt-2">
                    이 민원은 관련 법령상 소비자 권리와 직결될 수 있습니다. 답변 시 법령 기준을 준수하세요.
                  </p>
                </div>
              )}

              {complaint.ai_analysis && (
                <div>
                  <span className="text-spring-emerald block mb-0.5 text-xs font-medium">분석 이유</span>
                  <p className="text-spring-text text-xs">{complaint.ai_analysis.reasoning}</p>
                </div>
              )}

              {complaint.assigned_staff && (
                <div className="pt-2 border-t border-spring-emerald/20">
                  <span className="text-spring-emerald block mb-0.5 text-xs font-medium">배정 담당자</span>
                  <p className="text-spring-text">
                    {complaint.assigned_staff.name}
                    <span className="text-spring-text-light ml-1">({complaint.assigned_staff.department})</span>
                  </p>
                </div>
              )}

              {complaint.ai_analysis?.related_staff && complaint.ai_analysis.related_staff.length > 0 && (
                <div className="pt-2 border-t border-spring-emerald/20">
                  <span className="text-spring-emerald block mb-2 text-xs font-medium">
                    관련 담당자 ({complaint.ai_analysis.department} 부서)
                  </span>
                  <div className="space-y-2">
                    {complaint.ai_analysis.related_staff.map((s: RelatedStaff) => (
                      <div
                        key={s.id}
                        className={`rounded-xl px-3 py-2.5 text-xs border ${
                          s.is_assigned
                            ? 'bg-spring-emerald/10 border-spring-emerald/40'
                            : 'bg-white border-spring-emerald/15'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-spring-text">{s.name}</span>
                            {s.is_assigned && (
                              <span className="px-1.5 py-0.5 rounded-full bg-spring-emerald text-white text-[10px] font-bold">배정</span>
                            )}
                            <span className="text-spring-text-light">
                              {s.role === 'admin' ? '관리자' : '실무담당자'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-0.5 text-spring-text-light">
                          <div className="flex items-center gap-1">
                            <span>✉️</span>
                            <a href={`mailto:${s.email}`} className="hover:text-spring-emerald transition-colors">{s.email}</a>
                          </div>
                          {s.phone && (
                            <div className="flex items-center gap-1">
                              <span>📞</span>
                              <a href={`tel:${s.phone}`} className="hover:text-spring-emerald transition-colors">{s.phone}</a>
                            </div>
                          )}
                          {s.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {s.specialties.map((sp: string) => (
                                <span key={sp} className="px-1.5 py-0.5 bg-spring-emerald/10 text-spring-emerald rounded-full text-[10px]">
                                  {sp}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-spring-emerald text-sm">AI 분석 결과가 없습니다.</p>
          )}
        </div>

        {/* 최종 답변 작성 */}
        <div className="bg-white rounded-2xl border border-spring-pink-border p-5 shadow-sm">
          <h3 className="font-semibold text-spring-text mb-3">최종 답변 작성</h3>
          <textarea
            rows={8}
            value={finalResponse}
            onChange={(e) => setFinalResponse(e.target.value)}
            placeholder="AI 예상 답변을 수정하거나 새로 작성하세요"
            className="w-full border border-spring-pink-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spring-emerald resize-none bg-spring-bg"
          />
          {complaint.ai_response && finalResponse !== complaint.ai_response && (
            <button
              onClick={() => setFinalResponse(complaint.ai_response!)}
              className="text-xs text-spring-emerald hover:underline mt-1"
            >
              AI 답변으로 되돌리기
            </button>
          )}
          <button
            onClick={saveFinalResponse}
            disabled={saving || !finalResponse}
            className="mt-3 w-full spring-gradient text-white py-2 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 shadow-sm"
          >
            {saving ? '저장 중...' : '🌸 답변 저장 및 완료 처리'}
          </button>
        </div>
      </div>
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
    <span className={`text-sm px-3 py-1 rounded-full font-medium ${styles[status] ?? ''}`}>
      {STATUS_LABEL[status as keyof typeof STATUS_LABEL] ?? status}
    </span>
  )
}
