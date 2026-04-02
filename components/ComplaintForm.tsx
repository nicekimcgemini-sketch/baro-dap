'use client'

import { useState } from 'react'
import { Complaint, STATUS_LABEL } from '@/lib/types'
import { formatDate } from '@/lib/utils'

const INITIAL_FORM = {
  title: '',
  content: '',
  customer_name: '',
  customer_contact: '',
}

export default function ComplaintForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(INITIAL_FORM)
  const [contactError, setContactError] = useState('')
  const [submitted, setSubmitted] = useState<Complaint | null>(null)

  const validateContact = (value: string) => {
    const phoneRegex = /^(01[016789])-?\d{3,4}-?\d{4}$/
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!phoneRegex.test(value) && !emailRegex.test(value)) {
      return '올바른 전화번호(010-0000-0000) 또는 이메일 주소를 입력해 주세요.'
    }
    return ''
  }

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm({ ...form, customer_contact: value })
    if (value) setContactError(validateContact(value))
    else setContactError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const contactErr = validateContact(form.customer_contact)
    if (contactErr) {
      setContactError(contactErr)
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '접수 실패')
      }

      const data = await res.json()

      // 접수된 민원 상세 정보 조회
      const detailRes = await fetch(`/api/complaints/${data.id}`)
      const complaint: Complaint = detailRes.ok ? await detailRes.json() : data

      setSubmitted(complaint)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSubmitted(null)
    setForm(INITIAL_FORM)
    setError('')
    setContactError('')
  }

  const inputClass =
    'w-full border border-spring-pink-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spring-emerald bg-spring-bg placeholder-spring-text-light'

  return (
    <div className="space-y-6">
      {/* 접수 폼 */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-spring-text mb-1">
            민원 제목 <span className="text-spring-pink">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="민원 내용을 간략히 요약해 주세요"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputClass}
            disabled={!!submitted}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-spring-text mb-1">
            민원 내용 <span className="text-spring-pink">*</span>
          </label>
          <textarea
            required
            rows={6}
            placeholder="불편하셨던 내용을 자세히 작성해 주세요"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className={`${inputClass} resize-none`}
            disabled={!!submitted}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-spring-text mb-1">
              성함 <span className="text-spring-pink">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="홍길동"
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              className={inputClass}
              disabled={!!submitted}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-spring-text mb-1">
              연락처 <span className="text-spring-pink">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="010-1234-5678 또는 이메일"
              value={form.customer_contact}
              onChange={handleContactChange}
              className={`${inputClass} ${contactError ? 'border-spring-pink focus:ring-spring-pink' : ''}`}
              disabled={!!submitted}
            />
            {contactError && (
              <p className="text-spring-pink text-xs mt-1">{contactError}</p>
            )}
          </div>
        </div>

        {error && <p className="text-spring-pink text-sm">{error}</p>}

        {!submitted && (
          <button
            type="submit"
            disabled={loading}
            className="w-full spring-gradient text-white py-3 rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
          >
            {loading ? '🤖 AI 분석 중...' : '🌸 민원 접수하기'}
          </button>
        )}

        {!submitted && (
          <p className="text-xs text-spring-text-light text-center">
            접수 후 AI가 자동으로 내용을 분석하여 담당자를 배정합니다.
          </p>
        )}
      </form>

      {/* 접수 완료 결과 */}
      {submitted && (
        <div className="border-t border-spring-pink-border pt-6 space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="text-lg font-bold text-spring-text">민원이 접수되었습니다</h3>
            <p className="text-spring-text-light text-sm mt-1">AI가 분석하여 담당자를 배정해드렸습니다.</p>
          </div>

          <div className="bg-spring-soft rounded-xl p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between pb-2 border-b border-spring-pink-light">
              <span className="text-xs text-spring-text-light">접수번호</span>
              <span className="text-xs font-mono text-spring-text-light">{submitted.id}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-spring-text-light">상태</span>
              <span className="inline-block bg-spring-emerald-light text-spring-emerald text-xs font-medium px-2 py-0.5 rounded-full">
                {STATUS_LABEL[submitted.status]}
              </span>
            </div>

            {submitted.category && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-spring-text-light">분류</span>
                <span className="inline-block bg-spring-pink-light text-spring-pink text-xs px-2 py-0.5 rounded-full">
                  {submitted.category}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-spring-text-light">접수자</span>
              <span className="text-spring-text text-xs">{submitted.customer_name}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-spring-text-light">연락처</span>
              <span className="text-spring-text text-xs">{submitted.customer_contact}</span>
            </div>

            <div className="pt-2 border-t border-spring-pink-light">
              <p className="text-xs text-spring-text-light">접수일시: {formatDate(submitted.created_at)}</p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full border border-spring-pink text-spring-pink py-2.5 rounded-xl text-sm font-medium hover:bg-spring-pink-light transition"
          >
            🌸 새 민원 접수하기
          </button>
        </div>
      )}
    </div>
  )
}
