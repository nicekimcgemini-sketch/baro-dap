'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Complaint } from '@/lib/types'
import { formatDate } from '@/lib/utils'

export default function ComplaintResponsePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [response, setResponse] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: staff } = await supabase
        .from('staff')
        .select('role')
        .eq('email', user.email!)
        .single()

      if (!staff || staff.role !== 'admin') { router.push('/dashboard'); return }

      const res = await fetch(`/api/complaints/${params.id}`)
      if (!res.ok) { router.push('/dashboard'); return }

      const data: Complaint = await res.json()
      setComplaint(data)
      setResponse(data.final_response ?? '')
      setLoading(false)
    }
    init()
  }, [params.id, router])

  const generateResponse = async () => {
    setGenerating(true)
    const res = await fetch('/api/ai/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaint_id: params.id }),
    })
    const data = await res.json()
    if (res.ok) {
      setResponse(data.response)
    } else {
      alert('AI 생성 실패: ' + data.error)
    }
    setGenerating(false)
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
        <h2 className="font-bold text-spring-text text-lg">{complaint.title}</h2>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-spring-text-light block mb-1">문의 내용</span>
            <p className="text-spring-text whitespace-pre-wrap leading-relaxed bg-spring-soft rounded-xl p-4">
              {complaint.content}
            </p>
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
        </div>
      </div>

      {/* AI 답변 작성 */}
      <div className="bg-white rounded-2xl border border-spring-pink-border p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-spring-text">AI 답변 작성</h3>
          <button
            onClick={generateResponse}
            disabled={generating}
            className="spring-gradient text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-50 shadow-sm transition"
          >
            {generating ? 'AI 생성 중...' : '🤖 AI 답변 생성'}
          </button>
        </div>

        {generating && (
          <div className="text-center py-4">
            <p className="text-spring-text-light text-sm">Gemini AI가 답변을 작성 중입니다...</p>
          </div>
        )}

        <textarea
          rows={10}
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="AI 답변 생성 버튼을 클릭하거나 직접 입력해 주세요"
          className="w-full border border-spring-pink-border rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-spring-emerald resize-none bg-spring-bg"
        />

        <button
          onClick={saveResponse}
          disabled={saving || !response.trim()}
          className="w-full spring-gradient text-white py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 shadow-sm transition"
        >
          {saving ? '저장 중...' : '답변 저장 및 완료 처리'}
        </button>
      </div>
    </div>
  )
}
