'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreateComplaintInput } from '@/lib/types'

export default function ComplaintForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<CreateComplaintInput>({
    title: '',
    content: '',
    customer_name: '',
    customer_contact: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      router.push(`/complaint/${data.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          민원 제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="민원 내용을 간략히 요약해 주세요"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          민원 내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={6}
          placeholder="불편하셨던 내용을 자세히 작성해 주세요"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            성함 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="홍길동"
            value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            연락처 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="010-1234-5678 또는 이메일"
            value={form.customer_contact}
            onChange={(e) => setForm({ ...form, customer_contact: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'AI 분석 중...' : '민원 접수하기'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        접수 후 AI가 자동으로 내용을 분석하여 담당자를 배정합니다.
      </p>
    </form>
  )
}
