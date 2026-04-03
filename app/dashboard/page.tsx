'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Complaint, Staff, STATUS_LABEL, Priority, PRIORITY_EMOJI } from '@/lib/types'
import { formatDateShort } from '@/lib/utils'

const inputClass =
  'w-full border border-spring-pink-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spring-emerald bg-spring-bg'

export default function DashboardPage() {
  const router = useRouter()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  // 등록 폼
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', counselor_name: '' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // 인라인 수정
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', content: '', counselor_name: '' })
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .eq('email', user.email!)
        .single()

      if (!staffData) { router.push('/login'); return }

      setStaff(staffData)
      setForm(f => ({ ...f, counselor_name: staffData.name }))
      await loadComplaints()
      setLoading(false)
    }
    init()
  }, [router])

  const loadComplaints = async () => {
    const res = await fetch('/api/complaints')
    if (res.ok) setComplaints(await res.json())
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, created_by_staff_id: staff?.id }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setShowForm(false)
      setForm(f => ({ ...f, title: '', content: '' }))
      await loadComplaints()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (c: Complaint) => {
    setEditingId(c.id)
    setEditForm({ title: c.title, content: c.content, counselor_name: c.customer_name })
  }

  const handleEdit = async (id: string) => {
    setEditSaving(true)
    await fetch(`/api/complaints/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editForm.title,
        content: editForm.content,
        customer_name: editForm.counselor_name,
      }),
    })
    setEditingId(null)
    setEditSaving(false)
    await loadComplaints()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    await fetch(`/api/complaints/${id}`, { method: 'DELETE' })
    await loadComplaints()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-spring-text-light">로딩 중...</p>
      </div>
    )
  }

  // 통계 계산
  const total = complaints.length
  const pending = complaints.filter(c => c.status === 'pending').length
  const inProgress = complaints.filter(c => c.status === 'in_progress').length
  const resolved = complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length
  const answered = complaints.filter(c => c.final_response).length
  const answerRate = total > 0 ? Math.round((answered / total) * 100) : 0

  // 상담원별 집계
  const byStaff = complaints.reduce((acc, c) => {
    const name = c.customer_name || '미입력'
    acc[name] = (acc[name] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  const staffStats = Object.entries(byStaff).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxStaffCount = staffStats[0]?.[1] ?? 1

  // 카테고리별 집계
  const byCategory = complaints.reduce((acc, c) => {
    const cat = c.category || '미분류'
    acc[cat] = (acc[cat] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  const categoryStats = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
  const maxCategoryCount = categoryStats[0]?.[1] ?? 1

  const categoryColors = [
    'bg-spring-pink', 'bg-spring-emerald', 'bg-blue-400',
    'bg-yellow-400', 'bg-purple-400', 'bg-orange-400', 'bg-gray-400',
  ]

  // 긴급도별 집계
  const priorityStats = ([5, 4, 3, 2, 1] as Priority[]).map(p => ({
    p,
    count: complaints.filter(c => c.priority === p).length,
  }))
  const unsetCount = complaints.filter(c => !c.priority).length
  const maxPriorityCount = Math.max(...priorityStats.map(s => s.count), 1)

  // 날짜별 집계 (최근 7일)
  const today = new Date()
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
  const byDate = last7.map(date => ({
    date: date.slice(5),
    count: complaints.filter(c => c.created_at.slice(0, 10) === date).length,
  }))
  const maxDateCount = Math.max(...byDate.map(d => d.count), 1)

  const statCards = [
    { label: '총 문의', value: total, color: 'text-spring-text' },
    { label: '미처리', value: pending, color: 'text-yellow-500' },
    { label: '처리중', value: inProgress, color: 'text-spring-pink' },
    { label: '완료', value: resolved, color: 'text-spring-emerald' },
    { label: '답변완료율', value: `${answerRate}%`, color: 'text-blue-500' },
  ]

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-5 gap-3">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-spring-pink-border p-4 shadow-sm text-center">
            <p className="text-xs text-spring-text-light mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-4 gap-4">
        {/* 상담원별 문의 현황 */}
        <div className="bg-white rounded-2xl border border-spring-pink-border p-5 shadow-sm">
          <h3 className="font-semibold text-spring-text text-sm mb-4">상담원별 문의 현황</h3>
          {staffStats.length === 0 ? (
            <p className="text-spring-text-light text-sm text-center py-4">데이터 없음</p>
          ) : (
            <div className="space-y-3">
              {staffStats.map(([name, count]) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs text-spring-text w-16 shrink-0 truncate">{name}</span>
                  <div className="flex-1 bg-spring-pink-light rounded-full h-2">
                    <div
                      className="spring-gradient h-2 rounded-full transition-all"
                      style={{ width: `${(count / maxStaffCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-spring-text w-5 text-right shrink-0">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 일별 접수 추이 (최근 7일) */}
        <div className="bg-white rounded-2xl border border-spring-pink-border p-5 shadow-sm">
          <h3 className="font-semibold text-spring-text text-sm mb-4">일별 접수 현황 (최근 7일)</h3>
          <div className="flex items-end justify-between gap-1 h-24">
            {byDate.map(({ date, count }) => (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-spring-text-light">{count > 0 ? count : ''}</span>
                <div className="w-full flex items-end" style={{ height: '60px' }}>
                  <div
                    className="w-full spring-gradient rounded-t-md transition-all"
                    style={{ height: `${(count / maxDateCount) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
                  />
                </div>
                <span className="text-xs text-spring-text-light">{date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 긴급도별 현황 */}
        <div className="bg-white rounded-2xl border border-spring-pink-border p-5 shadow-sm">
          <h3 className="font-semibold text-spring-text text-sm mb-4">긴급도별 현황</h3>
          <div className="space-y-3">
            {priorityStats.map(({ p, count }) => (
              <div key={p} className="flex items-center gap-2">
                <span className="text-base w-5 shrink-0">{PRIORITY_EMOJI[p]}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="spring-gradient h-2 rounded-full transition-all"
                    style={{ width: `${(count / maxPriorityCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-spring-text w-4 text-right shrink-0">{count}</span>
              </div>
            ))}
            {unsetCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-base w-5 shrink-0">⏳</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-gray-300 h-2 rounded-full"
                    style={{ width: `${(unsetCount / maxPriorityCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-spring-text w-4 text-right shrink-0">{unsetCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* 카테고리별 현황 */}
        <div className="bg-white rounded-2xl border border-spring-pink-border p-5 shadow-sm">
          <h3 className="font-semibold text-spring-text text-sm mb-4">카테고리별 현황</h3>
          {categoryStats.length === 0 ? (
            <p className="text-spring-text-light text-sm text-center py-4">데이터 없음</p>
          ) : (
            <div className="space-y-3">
              {categoryStats.map(([cat, count], i) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs text-spring-text w-20 shrink-0 truncate">{cat}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className={`${categoryColors[i % categoryColors.length]} h-2 rounded-full transition-all`}
                      style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-spring-text w-5 text-right shrink-0">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-spring-text">문의 목록</h1>
          <p className="text-sm text-spring-text-light mt-0.5">총 {complaints.length}건</p>
        </div>
        {staff?.role === 'counselor' && (
          <button
            onClick={() => { setShowForm(!showForm); setFormError('') }}
            className="spring-gradient text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:opacity-90 transition"
          >
            + 문의 등록
          </button>
        )}
      </div>

      {/* 문의 등록 폼 (상담원 전용) */}
      {showForm && staff?.role === 'counselor' && (
        <form onSubmit={handleRegister} className="bg-white rounded-2xl border border-spring-pink-border p-6 space-y-4 shadow-sm">
          <h2 className="font-semibold text-spring-text">문의 등록</h2>
          <div>
            <label className="block text-sm font-medium text-spring-text mb-1">
              제목 <span className="text-spring-pink">*</span>
            </label>
            <input
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className={inputClass}
              placeholder="문의 제목을 입력해 주세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-spring-text mb-1">
              내용 <span className="text-spring-pink">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              className={`${inputClass} resize-none`}
              placeholder="문의 내용을 자세히 입력해 주세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-spring-text mb-1">
              상담원 성명 <span className="text-spring-pink">*</span>
            </label>
            <input
              required
              value={form.counselor_name}
              onChange={e => setForm({ ...form, counselor_name: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="bg-spring-soft rounded-xl px-4 py-3 text-xs text-spring-text-light">
            🤖 등록 후 AI가 자동으로 긴급도를 분석합니다.
          </div>
          {formError && <p className="text-red-500 text-sm">{formError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 spring-gradient text-white py-2 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? '등록 중...' : '등록하기'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 border border-spring-pink-border text-spring-text py-2 rounded-xl text-sm hover:bg-spring-soft transition"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* 문의 목록 */}
      <div className="bg-white rounded-2xl border border-spring-pink-border overflow-hidden shadow-sm">
        {complaints.length === 0 ? (
          <div className="text-center py-16 text-spring-text-light">
            <p className="text-4xl mb-3">🌸</p>
            <p>등록된 문의가 없습니다.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-spring-pink-light border-b border-spring-pink-border">
                <th className="px-4 py-3 text-center text-spring-text font-semibold w-16">긴급도</th>
                <th className="px-4 py-3 text-left text-spring-text font-semibold">제목</th>
                <th className="px-4 py-3 text-left text-spring-text font-semibold w-24">상담원</th>
                <th className="px-4 py-3 text-left text-spring-text font-semibold w-20">상태</th>
                <th className="px-4 py-3 text-left text-spring-text font-semibold w-28">등록일</th>
                {staff?.role === 'counselor' && (
                  <th className="px-4 py-3 text-left text-spring-text font-semibold w-24">관리</th>
                )}
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => {
                const isOwn = c.created_by_staff_id === staff?.id
                const isEditing = editingId === c.id

                if (isEditing) {
                  return (
                    <tr key={c.id} className="bg-spring-soft border-b border-spring-pink-light">
                      <td colSpan={5} className="px-4 py-4">
                        <div className="space-y-3 max-w-2xl">
                          <input
                            value={editForm.title}
                            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                            className={inputClass}
                            placeholder="제목"
                          />
                          <textarea
                            rows={4}
                            value={editForm.content}
                            onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                            className={`${inputClass} resize-none`}
                            placeholder="내용"
                          />
                          <input
                            value={editForm.counselor_name}
                            onChange={e => setEditForm({ ...editForm, counselor_name: e.target.value })}
                            className={inputClass}
                            placeholder="상담원 성명"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(c.id)}
                              disabled={editSaving}
                              className="spring-gradient text-white px-4 py-1.5 rounded-xl text-xs font-medium hover:opacity-90 disabled:opacity-50"
                            >
                              {editSaving ? '저장 중...' : '저장'}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="border border-spring-pink-border text-spring-text px-4 py-1.5 rounded-xl text-xs hover:bg-white transition"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={c.id} className="hover:bg-spring-soft transition-colors border-b border-spring-pink-light last:border-0">
                    <td className="px-4 py-3 text-center text-xl">
                      {c.priority ? PRIORITY_EMOJI[c.priority] : '⏳'}
                    </td>
                    <td className="px-4 py-3">
                      {staff?.role === 'admin' ? (
                        <Link
                          href={`/dashboard/${c.id}`}
                          className="text-spring-text hover:text-spring-pink font-medium transition"
                        >
                          {c.title}
                        </Link>
                      ) : (
                        <span className="text-spring-text font-medium">{c.title}</span>
                      )}
                      {c.final_response && (
                        <span className="ml-2 text-xs bg-spring-emerald-light text-spring-emerald px-1.5 py-0.5 rounded-full">
                          답변완료
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-spring-text">{c.customer_name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-spring-text-light text-xs">
                      {formatDateShort(c.created_at)}
                    </td>
                    {staff?.role === 'counselor' && (
                      <td className="px-4 py-3">
                        {isOwn && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEdit(c)}
                              className="text-xs bg-spring-emerald-light text-spring-emerald px-2 py-1 rounded-lg hover:opacity-80"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="text-xs bg-red-50 text-red-400 px-2 py-1 rounded-lg hover:opacity-80"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-600',
    in_progress: 'bg-spring-emerald-light text-spring-emerald',
    resolved: 'bg-spring-pink-light text-spring-pink',
    closed: 'bg-gray-100 text-gray-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? ''}`}>
      {STATUS_LABEL[status as keyof typeof STATUS_LABEL] ?? status}
    </span>
  )
}
