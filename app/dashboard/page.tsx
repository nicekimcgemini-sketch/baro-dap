'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Complaint, Staff, STATUS_LABEL } from '@/lib/types'
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

  return (
    <div className="space-y-6">
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
