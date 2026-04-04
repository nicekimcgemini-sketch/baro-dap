'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Complaint, Priority, PRIORITY_EMOJI, PRIORITY_LABEL } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export default function ComplaintResponsePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [response, setResponse] = useState('')
  const [priority, setPriority] = useState<Priority>(3)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingPriority, setSavingPriority] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isOwn, setIsOwn] = useState(false)

  // 수정 모드
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', content: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: staff } = await supabase
        .from('staff')
        .select('id, role')
        .eq('email', user.email!)
        .single()

      if (!staff) { router.push('/login'); return }

      setIsAdmin(staff.role === 'admin')

      const res = await fetch(`/api/complaints/${params.id}`)
      if (!res.ok) { router.push('/dashboard'); return }

      const data: Complaint = await res.json()
      setComplaint(data)
      setResponse(data.final_response ?? '')
      setPriority(data.priority ?? 3)
      setIsOwn(data.created_by_staff_id === staff.id)
      setLoading(false)
    }
    init()
  }, [params.id, router])

  const startEdit = () => {
    if (!complaint) return
    setEditForm({ title: complaint.title, content: complaint.content })
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!editForm.title.trim() || !editForm.content.trim()) return
    setEditSaving(true)
    const res = await fetch(`/api/complaints/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editForm.title, content: editForm.content }),
    })
    if (res.ok) {
      const updated = await res.json()
      setComplaint(updated)
      setEditing(false)
    }
    setEditSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('이 문의를 삭제하시겠습니까?')) return
    setDeleting(true)
    await fetch(`/api/complaints/${params.id}`, { method: 'DELETE' })
    router.push('/dashboard')
  }

  const generateResponse = async () => {
    setGenerating(true)
    const res = await fetch('/api/ai/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaint_id: params.id }),
    })
    const data = await res.json()
    if (res.ok) setResponse(data.response)
    else alert('AI 생성 실패: ' + data.error)
    setGenerating(false)
  }

  const savePriority = async (newPriority: Priority) => {
    setPriority(newPriority)
    setSavingPriority(true)
    await fetch(`/api/complaints/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority: newPriority }),
    })
    setSavingPriority(false)
  }

  const saveResponse = async () => {
    if (!response.trim()) return
    setSaving(true)
    await fetch(`/api/complaints/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ final_response: response, status: 'resolved' }),
    })
    setSaving(false)
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-spring-text-light">로딩 중...</p>
      </div>
    )
  }

  if (!complaint) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/dashboard" className="text-sm text-spring-text-light hover:text-spring-pink transition">
        ← 목록으로
      </Link>

      {/* 문의 내용 */}
      <div className="bg-white rounded-2xl border border-spring-pink-border p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          {editing ? (
            <input
              value={editForm.title}
              onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
              className="flex-1 font-bold text-spring-text text-lg border border-spring-pink-border rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-spring-emerald bg-spring-bg"
            />
          ) : (
            <h2 className="font-bold text-spring-text text-lg">{complaint.title}</h2>
          )}
          {isOwn && !editing && (
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={startEdit}
                className="text-xs bg-spring-emerald-light text-spring-emerald px-3 py-1.5 rounded-lg font-bold hover:opacity-80 transition"
              >
                수정
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs bg-red-50 text-red-400 px-3 py-1.5 rounded-lg font-bold hover:opacity-80 disabled:opacity-50 transition"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          )}
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-spring-text-light block mb-1">문의 내용</span>
            {editing ? (
              <textarea
                rows={6}
                value={editForm.content}
                onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                className="w-full border border-spring-pink-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-spring-emerald resize-none bg-spring-bg"
              />
            ) : (
              <p className="text-spring-text whitespace-pre-wrap leading-relaxed bg-spring-soft rounded-xl p-4">
                {complaint.content}
              </p>
            )}
          </div>
          <div className="flex gap-8 pt-1">
            <div>
              <span className="text-spring-text-light block mb-0.5">상담원</span>
              <p className="text-spring-text font-medium">{complaint.customer_name}</p>
            </div>
            <div>
              <span className="text-spring-text-light block mb-0.5">등록일시</span>
              <p className="text-spring-text">{formatDate(complaint.created_at)}</p>
            </div>
          </div>
          {editing && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={saveEdit}
                disabled={editSaving}
                className="spring-gradient text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition"
              >
                {editSaving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="border border-spring-emerald/20 text-spring-text px-4 py-2 rounded-xl text-sm hover:bg-spring-bg transition"
              >
                취소
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 긴급도 — 관리자: 수정 가능 / 상담원: 읽기 전용 */}
      <div className="bg-white rounded-2xl border border-spring-pink-border p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-spring-text">긴급도</h3>
          {savingPriority && <span className="text-xs text-spring-text-light">저장 중...</span>}
        </div>
        <div className="flex gap-2">
          {([1, 2, 3, 4, 5] as Priority[]).map(p => (
            <button
              key={p}
              onClick={() => isAdmin && savePriority(p)}
              title={PRIORITY_LABEL[p]}
              disabled={!isAdmin}
              className={`flex-1 py-2.5 rounded-xl text-2xl border-2 transition ${
                priority === p
                  ? 'border-spring-pink bg-spring-pink-light'
                  : 'border-spring-pink-border bg-white hover:bg-spring-soft'
              } ${!isAdmin ? 'cursor-default opacity-80' : ''}`}
            >
              {PRIORITY_EMOJI[p]}
            </button>
          ))}
        </div>
        <p className="text-xs text-spring-text-light text-center">
          현재: {PRIORITY_EMOJI[priority]} {PRIORITY_LABEL[priority]}
          {!isAdmin && <span className="ml-2 text-spring-text-light/60">(읽기 전용)</span>}
        </p>
      </div>

      {/* AI 답변 — 관리자: 작성/저장 / 상담원: 읽기 전용 */}
      <div className="bg-white rounded-2xl border border-spring-pink-border p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-spring-text">AI 답변</h3>
          {isAdmin && (
            <button
              onClick={generateResponse}
              disabled={generating}
              className="spring-gradient text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-50 shadow-sm transition"
            >
              {generating ? '🔮 AI 생성 중...' : '🔮 AI 답변 생성'}
            </button>
          )}
        </div>

        {generating && (
          <div className="text-center py-4">
            <p className="text-spring-text-light text-sm">AI가 답변을 작성 중입니다...</p>
          </div>
        )}

        <textarea
          rows={10}
          value={response}
          onChange={(e) => isAdmin && setResponse(e.target.value)}
          readOnly={!isAdmin}
          placeholder={isAdmin ? 'AI 답변 생성 버튼을 클릭하거나 직접 입력해 주세요' : '아직 작성된 답변이 없습니다.'}
          className={`w-full border border-spring-pink-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-spring-emerald resize-none bg-spring-bg ${!isAdmin ? 'cursor-default' : ''}`}
        />

        {isAdmin && (
          <button
            onClick={saveResponse}
            disabled={saving || !response.trim()}
            className="w-full spring-gradient text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 shadow-sm transition"
          >
            {saving ? '저장 중...' : '답변 저장 및 완료 처리'}
          </button>
        )}
      </div>
    </div>
  )
}
