'use client'

import { useState, useMemo } from 'react'
import { Staff, StaffRole } from '@/lib/types'
import Pagination from '@/components/Pagination'

interface Props {
  initialStaff: Staff[]
}

type FilterType = 'department' | 'role' | 'active'
interface FilterDef { type: FilterType; value: string }

const emptyForm = {
  name: '', department: '현업', role: 'counselor' as StaffRole,
  email: '', phone: '', specialties: '',
}

export default function StaffTable({ initialStaff }: Props) {
  const [staff, setStaff] = useState<Staff[]>(initialStaff)
  const [form, setForm] = useState(emptyForm)
  const [showAddForm, setShowAddForm] = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // 검색어
  const [searchName, setSearchName] = useState('')
  const [searchSpecialty, setSearchSpecialty] = useState('')

  // 정렬
  type SortKey = 'created_at' | 'name' | 'department' | 'role' | 'is_active'
  type SortDir = 'asc' | 'desc'
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setCurrentPage(1)
  }

  // 다중 필터 상태 (부서/역할/활성)
  const [activeFilters, setActiveFilters] = useState<FilterDef[]>([])

  const toggleFilter = (f: FilterDef) => {
    setActiveFilters(prev => {
      const exists = prev.some(p => p.type === f.type && p.value === f.value)
      return exists ? prev.filter(p => !(p.type === f.type && p.value === f.value)) : [...prev, f]
    })
    setCurrentPage(1)
  }
  const isActive = (f: FilterDef) => activeFilters.some(p => p.type === f.type && p.value === f.value)

  // 필터 + 정렬 적용
  const filteredStaff = useMemo(() => {
    const byType = activeFilters.reduce<Partial<Record<FilterType, string[]>>>((acc, f) => {
      acc[f.type] = [...(acc[f.type] ?? []), f.value]
      return acc
    }, {})
    const filtered = staff.filter(s => {
      if (searchName.trim() && !s.name.includes(searchName.trim())) return false
      if (searchSpecialty.trim() && !s.specialties.some(sp => sp.includes(searchSpecialty.trim()))) return false
      return (Object.entries(byType) as [FilterType, string[]][]).every(([type, values]) => {
        if (type === 'department') return values.includes(s.department)
        if (type === 'role') return values.includes(s.role)
        if (type === 'active') return values.includes(s.is_active ? '활성' : '비활성')
        return true
      })
    })
    return [...filtered].sort((a, b) => {
      let av: string | boolean = a[sortKey] ?? ''
      let bv: string | boolean = b[sortKey] ?? ''
      if (typeof av === 'boolean') { av = av ? '1' : '0'; bv = (bv as boolean) ? '1' : '0' }
      const cmp = String(av).localeCompare(String(bv), 'ko')
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [staff, activeFilters, searchName, searchSpecialty, sortKey, sortDir])

  // 아코디언 상태
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // 인라인 수정 상태
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // 비밀번호 초기화 상태
  const [resetId, setResetId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resetSaving, setResetSaving] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)

  const pagedStaff = filteredStaff.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const ic = 'border border-spring-pink-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spring-emerald bg-spring-bg w-full'

  // 아코디언 토글 (수정/초기화 모드이면 닫힐 때 초기화)
  const toggleRow = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setEditingId(null)
      setResetId(null)
    } else {
      setExpandedId(id)
      setEditingId(null)
      setResetId(null)
    }
  }

  // 수정 모드 시작
  const startEdit = (s: Staff) => {
    setEditingId(s.id)
    setEditForm({
      name: s.name, department: s.department, role: s.role,
      email: s.email, phone: s.phone ?? '', specialties: s.specialties.join(', '),
    })
    setEditError('')
    setResetId(null)
  }

  // 수정 저장
  const saveEdit = async (id: string) => {
    setEditSaving(true)
    setEditError('')
    const res = await fetch(`/api/staff/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editForm.name,
        department: editForm.department,
        role: editForm.role,
        email: editForm.email,
        phone: editForm.phone || null,
        specialties: editForm.specialties.split(',').map(s => s.trim()).filter(Boolean),
      }),
    })
    if (!res.ok) {
      setEditError((await res.json()).error ?? '수정에 실패했습니다.')
    } else {
      const updated = await res.json()
      setStaff(staff.map(s => s.id === updated.id ? updated : s))
      setEditingId(null)
    }
    setEditSaving(false)
  }

  // 비밀번호 초기화 시작
  const startReset = (id: string) => {
    setResetId(id)
    setNewPassword('')
    setShowPassword(false)
    setResetError('')
    setResetSuccess(false)
    setEditingId(null)
  }

  // 비밀번호 초기화 실행
  const doReset = async (id: string) => {
    setResetSaving(true)
    setResetError('')
    const res = await fetch(`/api/staff/${id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    })
    if (!res.ok) {
      setResetError((await res.json()).error ?? '초기화에 실패했습니다.')
    } else {
      setResetSuccess(true)
    }
    setResetSaving(false)
  }

  // 활성 토글
  const toggleActive = async (id: string, is_active: boolean) => {
    await fetch(`/api/staff/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active }),
    })
    setStaff(staff.map(s => s.id === id ? { ...s, is_active } : s))
  }

  // 삭제
  const deleteStaff = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await fetch(`/api/staff/${id}`, { method: 'DELETE' })
    setStaff(staff.filter(s => s.id !== id))
    setExpandedId(null)
  }

  // 담당자 추가
  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddSaving(true)
    setAddError('')
    const res = await fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        phone: form.phone || null,
        specialties: form.specialties.split(',').map(s => s.trim()).filter(Boolean),
      }),
    })
    if (!res.ok) {
      setAddError((await res.json()).error ?? '오류가 발생했습니다.')
    } else {
      setStaff([await res.json(), ...staff])
      setCurrentPage(1)
      setForm(emptyForm)
      setShowAddForm(false)
    }
    setAddSaving(false)
  }

  return (
    <div className="space-y-4">
      {/* 검색 + 필터 + 추가 버튼 */}
      <div className="bg-white rounded-2xl border border-spring-pink-border p-4 space-y-3 shadow-sm">
        {/* 검색 인풋 행 */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-32">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-spring-text-light text-sm select-none">🔎</span>
            <input
              type="text"
              placeholder="이름 검색"
              value={searchName}
              onChange={e => { setSearchName(e.target.value); setCurrentPage(1) }}
              className="pl-8 pr-8 py-2 text-sm border border-spring-pink-border rounded-xl focus:outline-none focus:ring-2 focus:ring-spring-emerald bg-spring-bg w-full"
            />
            {searchName && (
              <button onClick={() => { setSearchName(''); setCurrentPage(1) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-spring-text-light hover:text-spring-pink text-xs">✕</button>
            )}
          </div>
          <div className="relative flex-1 min-w-32">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-spring-text-light text-sm select-none">🏷️</span>
            <input
              type="text"
              placeholder="분야 검색"
              value={searchSpecialty}
              onChange={e => { setSearchSpecialty(e.target.value); setCurrentPage(1) }}
              className="pl-8 pr-8 py-2 text-sm border border-spring-pink-border rounded-xl focus:outline-none focus:ring-2 focus:ring-spring-emerald bg-spring-bg w-full"
            />
            {searchSpecialty && (
              <button onClick={() => { setSearchSpecialty(''); setCurrentPage(1) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-spring-text-light hover:text-spring-pink text-xs">✕</button>
            )}
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="spring-gradient text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 shadow-sm shrink-0 ml-auto"
          >
            + 담당자 추가
          </button>
        </div>
        {/* 버튼 필터 행 */}
        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-spring-text-light shrink-0">부서</span>
            {(['현업', 'IT'] as const).map(v => (
              <button key={v} onClick={() => toggleFilter({ type: 'department', value: v })}
                className={`text-xs px-3 py-1 rounded-full border transition font-medium ${
                  isActive({ type: 'department', value: v })
                    ? 'bg-spring-emerald text-white border-spring-emerald'
                    : 'bg-white text-spring-text-light border-spring-pink-border hover:border-spring-emerald hover:text-spring-emerald'
                }`}>{v}</button>
            ))}
          </div>
          <div className="w-px h-4 bg-spring-pink-border shrink-0" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-spring-text-light shrink-0">역할</span>
            {([['counselor', '실무'] , ['admin', '관리자']] as const).map(([val, label]) => (
              <button key={val} onClick={() => toggleFilter({ type: 'role', value: val })}
                className={`text-xs px-3 py-1 rounded-full border transition font-medium ${
                  isActive({ type: 'role', value: val })
                    ? 'bg-spring-emerald text-white border-spring-emerald'
                    : 'bg-white text-spring-text-light border-spring-pink-border hover:border-spring-emerald hover:text-spring-emerald'
                }`}>{label}</button>
            ))}
          </div>
          <div className="w-px h-4 bg-spring-pink-border shrink-0" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-spring-text-light shrink-0">활성</span>
            {(['활성', '비활성'] as const).map(v => (
              <button key={v} onClick={() => toggleFilter({ type: 'active', value: v })}
                className={`text-xs px-3 py-1 rounded-full border transition font-medium ${
                  isActive({ type: 'active', value: v })
                    ? 'bg-spring-emerald text-white border-spring-emerald'
                    : 'bg-white text-spring-text-light border-spring-pink-border hover:border-spring-emerald hover:text-spring-emerald'
                }`}>{v}</button>
            ))}
          </div>
          {activeFilters.length > 0 && (
            <button onClick={() => { setActiveFilters([]); setCurrentPage(1) }} className="text-xs text-spring-text-light hover:text-spring-pink transition ml-auto">
              필터 해제
            </button>
          )}
        </div>
        {/* 결과 카운트 */}
        {(searchName || searchSpecialty || activeFilters.length > 0) && (
          <p className="text-xs text-spring-text-light pt-0.5">{filteredStaff.length}명 검색됨</p>
        )}
      </div>

      {/* 추가 폼 */}
      {showAddForm && (
        <form onSubmit={addStaff} className="bg-spring-emerald-light rounded-2xl border border-spring-emerald/30 p-5 space-y-3">
          <h3 className="font-semibold text-spring-emerald-dark text-sm">새 담당자 추가</h3>
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="이름" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={ic} />
            <input required type="email" placeholder="이메일" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={ic} />
            <input type="tel" placeholder="연락처 (예: 010-1234-5678)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={ic} />
            <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className={ic}>
              <option value="현업">현업</option>
              <option value="IT">IT</option>
            </select>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as StaffRole })} className={ic}>
              <option value="counselor">실무담당자</option>
              <option value="admin">관리자</option>
            </select>
          </div>
          <input placeholder="담당 분야 (쉼표로 구분)" value={form.specialties} onChange={e => setForm({ ...form, specialties: e.target.value })} className={ic} />
          {addError && <p className="text-spring-pink text-xs">{addError}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={addSaving} className="spring-gradient text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 disabled:opacity-50 shadow-sm">
              {addSaving ? '저장 중...' : '저장'}
            </button>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-sm text-spring-text-light px-4 py-2">취소</button>
          </div>
        </form>
      )}

      {/* 담당자 목록 */}
      <div className="bg-white rounded-2xl border border-spring-pink-border overflow-hidden shadow-sm">
        {/* 헤더 */}
        <div className="grid grid-cols-[2fr_1fr_1fr_2fr_1fr_1fr] bg-spring-pink-light border-b border-spring-pink-border px-4 py-2.5 text-xs font-semibold text-spring-text">
          {([
            ['이름 / 담당 분야', 'name'],
            ['부서', 'department'],
            ['역할', 'role'],
            ['이메일', null],
            ['연락처', null],
            ['활성', 'is_active'],
          ] as [string, SortKey | null][]).map(([label, key]) => (
            key ? (
              <button key={label} onClick={() => toggleSort(key)}
                className="flex items-center gap-1 hover:text-spring-emerald transition text-left">
                {label}
                <span className="text-[10px] text-spring-text-light">
                  {sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                </span>
              </button>
            ) : (
              <span key={label}>{label}</span>
            )
          ))}
        </div>

        <div className="divide-y divide-spring-pink-light">
          {pagedStaff.map(s => {
            const isExpanded = expandedId === s.id
            const isEditing = editingId === s.id
            const isResetting = resetId === s.id

            return (
              <div key={s.id}>
                {/* 행 */}
                <div
                  onClick={() => toggleRow(s.id)}
                  className={`grid grid-cols-[2fr_1fr_1fr_2fr_1fr_1fr] px-4 py-3 cursor-pointer select-none transition-colors ${
                    isExpanded ? 'bg-spring-emerald/5 border-l-2 border-spring-emerald' : 'hover:bg-spring-emerald-light'
                  } ${!s.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      s.department === 'IT' ? 'bg-spring-blue/20 text-spring-blue' : 'bg-spring-pink-light text-spring-pink'
                    }`}>
                      {s.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-spring-text truncate">{s.name}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {s.specialties.slice(0, 2).map(sp => (
                          <span key={sp} className="text-[10px] px-1.5 py-0.5 bg-spring-pink-light text-spring-pink rounded-full">{sp}</span>
                        ))}
                        {s.specialties.length > 2 && (
                          <span className="text-[10px] text-spring-text-light">+{s.specialties.length - 2}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.department === 'IT' ? 'bg-spring-blue/10 text-spring-blue' : 'bg-spring-emerald-light text-spring-emerald'
                    }`}>{s.department}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.role === 'admin' ? 'bg-spring-pink-light text-spring-pink' : 'bg-gray-50 text-gray-500'
                    }`}>{s.role === 'admin' ? '관리자' : '실무'}</span>
                  </div>
                  <div className="flex items-center text-xs text-spring-text-light truncate pr-2">{s.email}</div>
                  <div className="flex items-center text-xs text-spring-text-light">{s.phone ?? '-'}</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); toggleActive(s.id, !s.is_active) }}
                      className={`w-9 h-5 rounded-full transition-colors shrink-0 ${s.is_active ? 'bg-spring-emerald' : 'bg-gray-200'}`}
                    >
                      <span className={`block w-4 h-4 bg-white rounded-full mx-0.5 transition-transform shadow-sm ${s.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-[10px] font-bold transition-transform ${isExpanded ? 'rotate-180' : ''} text-spring-text-light`}>▼</span>
                  </div>
                </div>

                {/* 아코디언 패널 */}
                {isExpanded && (
                  <div className="bg-spring-emerald/5 border-l-2 border-spring-emerald px-5 py-4">
                    {!isEditing && !isResetting && (
                      /* 상세 보기 + 액션 버튼 */
                      <div className="space-y-4">
                        {/* 상세 정보 */}
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-spring-text-light font-medium mb-1">이메일</p>
                            <a href={`mailto:${s.email}`} className="text-spring-text hover:text-spring-emerald transition-colors">{s.email}</a>
                          </div>
                          <div>
                            <p className="text-xs text-spring-text-light font-medium mb-1">연락처</p>
                            {s.phone
                              ? <a href={`tel:${s.phone}`} className="text-spring-text hover:text-spring-emerald transition-colors">{s.phone}</a>
                              : <span className="text-spring-text-light">미등록</span>
                            }
                          </div>
                          <div>
                            <p className="text-xs text-spring-text-light font-medium mb-1">등록일</p>
                            <span className="text-spring-text">{s.created_at.slice(0, 10)}</span>
                          </div>
                          <div className="col-span-3">
                            <p className="text-xs text-spring-text-light font-medium mb-1">담당 분야</p>
                            <div className="flex flex-wrap gap-1.5">
                              {s.specialties.length > 0
                                ? s.specialties.map(sp => (
                                    <span key={sp} className="px-2 py-0.5 bg-white border border-spring-emerald/30 rounded-full text-xs text-spring-emerald font-medium">{sp}</span>
                                  ))
                                : <span className="text-spring-text-light text-xs">없음</span>
                              }
                            </div>
                          </div>
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex gap-2 pt-1 border-t border-spring-emerald/15">
                          <button
                            onClick={() => startEdit(s)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-spring-emerald text-white hover:opacity-90 transition shadow-sm"
                          >
                            ✏️ 정보 수정
                          </button>
                          <button
                            onClick={() => startReset(s.id)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-amber-500 text-white hover:opacity-90 transition shadow-sm"
                          >
                            🔑 비밀번호 초기화
                          </button>
                          <button
                            onClick={() => deleteStaff(s.id)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition ml-auto"
                          >
                            🗑️ 삭제
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 인라인 수정 폼 */}
                    {isEditing && (
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-spring-emerald">✏️ 정보 수정</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-spring-text-light block mb-1">이름</label>
                            <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className={ic} />
                          </div>
                          <div>
                            <label className="text-xs text-spring-text-light block mb-1">이메일</label>
                            <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className={ic} />
                          </div>
                          <div>
                            <label className="text-xs text-spring-text-light block mb-1">연락처</label>
                            <input type="tel" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className={ic} placeholder="010-0000-0000" />
                          </div>
                          <div>
                            <label className="text-xs text-spring-text-light block mb-1">부서</label>
                            <select value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} className={ic}>
                              <option value="현업">현업</option>
                              <option value="IT">IT</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-spring-text-light block mb-1">역할</label>
                            <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value as StaffRole })} className={ic}>
                              <option value="counselor">실무담당자</option>
                              <option value="admin">관리자</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-spring-text-light block mb-1">담당 분야 (쉼표 구분)</label>
                            <input value={editForm.specialties} onChange={e => setEditForm({ ...editForm, specialties: e.target.value })} className={ic} placeholder="예: 결제/청구, 이중청구" />
                          </div>
                        </div>
                        {editError && <p className="text-spring-pink text-xs">{editError}</p>}
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => setEditingId(null)} className="px-4 py-2 rounded-xl text-sm border border-spring-emerald/20 text-spring-text-light hover:bg-white transition">
                            취소
                          </button>
                          <button onClick={() => saveEdit(s.id)} disabled={editSaving} className="spring-gradient text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 shadow-sm">
                            {editSaving ? '저장 중...' : '저장'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 인라인 비밀번호 초기화 */}
                    {isResetting && (
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-amber-600">🔑 비밀번호 초기화</p>
                        {resetSuccess ? (
                          <div className="bg-spring-emerald-light rounded-xl px-4 py-4 text-center space-y-1">
                            <p className="text-xl">✅</p>
                            <p className="text-sm font-semibold text-spring-emerald">비밀번호가 초기화되었습니다.</p>
                            <p className="text-xs text-spring-text-light">담당자에게 새 비밀번호를 안전하게 전달하세요.</p>
                          </div>
                        ) : (
                          <>
                            <div className="bg-amber-50 rounded-xl px-3 py-2 text-xs text-amber-700">
                              <strong>{s.name}</strong> ({s.email}) 의 비밀번호를 변경합니다.
                            </div>
                            <div>
                              <label className="text-xs text-spring-text-light block mb-1">새 비밀번호 (6자 이상)</label>
                              <div className="relative">
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  value={newPassword}
                                  onChange={e => setNewPassword(e.target.value)}
                                  className={`${ic} pr-14`}
                                  placeholder="새 비밀번호 입력"
                                  minLength={6}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-spring-text-light hover:text-spring-text"
                                >
                                  {showPassword ? '숨김' : '표시'}
                                </button>
                              </div>
                            </div>
                            {resetError && <p className="text-spring-pink text-xs">{resetError}</p>}
                            <div className="flex gap-2 pt-1">
                              <button onClick={() => setResetId(null)} className="px-4 py-2 rounded-xl text-sm border border-spring-emerald/20 text-spring-text-light hover:bg-white transition">
                                취소
                              </button>
                              <button
                                onClick={() => doReset(s.id)}
                                disabled={resetSaving || newPassword.length < 6}
                                className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 shadow-sm"
                              >
                                {resetSaving ? '처리 중...' : '초기화'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {filteredStaff.length === 0 && (
            <div className="px-4 py-10 text-center text-spring-text-light">
              {activeFilters.length > 0 ? '🔍 조건에 맞는 담당자가 없습니다.' : '🌸 등록된 담당자가 없습니다.'}
            </div>
          )}
        </div>
      </div>

      <Pagination
        total={filteredStaff.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}
