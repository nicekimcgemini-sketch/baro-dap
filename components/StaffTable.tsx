'use client'

import { useState } from 'react'
import { Staff } from '@/lib/types'

interface Props {
  initialStaff: Staff[]
}

const emptyForm = {
  name: '',
  department: '현업',
  role: 'counselor' as const,
  email: '',
  specialties: '',
}

export default function StaffTable({ initialStaff }: Props) {
  const [staff, setStaff] = useState<Staff[]>(initialStaff)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? '오류가 발생했습니다.')
    } else {
      const newStaff = await res.json()
      setStaff([newStaff, ...staff])
      setForm(emptyForm)
      setShowForm(false)
    }
    setSaving(false)
  }

  const toggleActive = async (id: string, is_active: boolean) => {
    await fetch(`/api/staff/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active }),
    })
    setStaff(staff.map((s) => (s.id === id ? { ...s, is_active } : s)))
  }

  const deleteStaff = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await fetch(`/api/staff/${id}`, { method: 'DELETE' })
    setStaff(staff.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + 담당자 추가
        </button>
      </div>

      {showForm && (
        <form onSubmit={addStaff} className="bg-blue-50 rounded-xl border border-blue-100 p-5 space-y-3">
          <h3 className="font-semibold text-blue-800 text-sm">새 담당자 추가</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="이름"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              required
              type="email"
              placeholder="이메일"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="현업">현업</option>
              <option value="IT">IT</option>
            </select>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as 'counselor' | 'admin' })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="counselor">상담원</option>
              <option value="admin">관리자</option>
            </select>
          </div>
          <input
            placeholder="담당 분야 (쉼표로 구분, 예: IT, 시스템)"
            value={form.specialties}
            onChange={(e) => setForm({ ...form, specialties: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 px-4 py-2"
            >
              취소
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-gray-500 font-medium">이름</th>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">부서</th>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">역할</th>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">이메일</th>
              <th className="px-4 py-3 text-left text-gray-500 font-medium">담당 분야</th>
              <th className="px-4 py-3 text-left text-gray-500 font-medium w-16">활성</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staff.map((s) => (
              <tr key={s.id} className={`${!s.is_active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                <td className="px-4 py-3 text-gray-600">{s.department}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    s.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {s.role === 'admin' ? '관리자' : '상담원'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{s.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {s.specialties.map((sp) => (
                      <span key={sp} className="bg-blue-50 text-blue-600 text-xs px-1.5 py-0.5 rounded">
                        {sp}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(s.id, !s.is_active)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      s.is_active ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`block w-4 h-4 bg-white rounded-full mx-0.5 transition-transform ${
                      s.is_active ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => deleteStaff(s.id)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  등록된 담당자가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
