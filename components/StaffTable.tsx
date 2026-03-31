'use client'

import { useState } from 'react'
import { Staff, StaffRole } from '@/lib/types'

interface Props {
  initialStaff: Staff[]
}

const emptyForm: { name: string; department: string; role: StaffRole; email: string; specialties: string } = {
  name: '',
  department: '현업',
  role: 'counselor',
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

  const inputClass = 'border border-spring-pink-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spring-emerald bg-spring-bg'

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="spring-gradient text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 shadow-sm"
        >
          + 담당자 추가
        </button>
      </div>

      {showForm && (
        <form onSubmit={addStaff} className="bg-spring-emerald-light rounded-2xl border border-spring-emerald/30 p-5 space-y-3">
          <h3 className="font-semibold text-spring-emerald-dark text-sm">새 담당자 추가</h3>
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="이름" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass} />
            <input required type="email" placeholder="이메일" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass} />
            <select value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className={inputClass}>
              <option value="현업">현업</option>
              <option value="IT">IT</option>
            </select>
            <select value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
              className={inputClass}>
              <option value="counselor">상담원</option>
              <option value="admin">관리자</option>
            </select>
          </div>
          <input placeholder="담당 분야 (쉼표로 구분, 예: IT, 시스템)"
            value={form.specialties}
            onChange={(e) => setForm({ ...form, specialties: e.target.value })}
            className={`w-full ${inputClass}`} />
          {error && <p className="text-spring-pink text-xs">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="spring-gradient text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-50 shadow-sm">
              {saving ? '저장 중...' : '저장'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-sm text-spring-text-light px-4 py-2">
              취소
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-spring-pink-border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-spring-pink-light border-b border-spring-pink-border">
              <th className="px-4 py-3 text-left text-spring-text font-semibold">이름</th>
              <th className="px-4 py-3 text-left text-spring-text font-semibold">부서</th>
              <th className="px-4 py-3 text-left text-spring-text font-semibold">역할</th>
              <th className="px-4 py-3 text-left text-spring-text font-semibold">이메일</th>
              <th className="px-4 py-3 text-left text-spring-text font-semibold">담당 분야</th>
              <th className="px-4 py-3 text-left text-spring-text font-semibold w-16">활성</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-spring-pink-light">
            {staff.map((s) => (
              <tr key={s.id} className={`${!s.is_active ? 'opacity-50' : ''} hover:bg-spring-emerald-light transition-colors`}>
                <td className="px-4 py-3 font-medium text-spring-text">{s.name}</td>
                <td className="px-4 py-3 text-spring-text-light">{s.department}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.role === 'admin'
                      ? 'bg-spring-pink-light text-spring-pink'
                      : 'bg-spring-emerald-light text-spring-emerald'
                  }`}>
                    {s.role === 'admin' ? '관리자' : '상담원'}
                  </span>
                </td>
                <td className="px-4 py-3 text-spring-text-light text-xs">{s.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {s.specialties.map((sp) => (
                      <span key={sp} className="bg-spring-pink-light text-spring-pink text-xs px-1.5 py-0.5 rounded-full">
                        {sp}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(s.id, !s.is_active)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      s.is_active ? 'bg-spring-emerald' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`block w-4 h-4 bg-white rounded-full mx-0.5 transition-transform shadow-sm ${
                      s.is_active ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => deleteStaff(s.id)} className="text-spring-pink/50 hover:text-spring-pink text-xs transition">
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-spring-text-light">
                  🌸 등록된 담당자가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
