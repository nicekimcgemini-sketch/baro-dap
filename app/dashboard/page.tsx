'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Complaint, Staff, STATUS_LABEL, Priority, PRIORITY_EMOJI } from '@/lib/types'
import { formatDateShort } from '@/lib/utils'
import Pagination from '@/components/Pagination'

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

  // 선택된 문의 (하단바)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [PAGE_SIZE, setPAGE_SIZE] = useState(10)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 인라인 수정
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', content: '', counselor_name: '' })
  const [editSaving, setEditSaving] = useState(false)

  // 대시보드 필터
  type FilterDef =
    | { type: 'status'; value: string; label: string }
    | { type: 'staff'; value: string; label: string }
    | { type: 'category'; value: string; label: string }
    | { type: 'priority'; value: Priority; label: string }
    | { type: 'date'; value: string; label: string }
    | { type: 'answered'; label: string }
  const [activeFilters, setActiveFiltersRaw] = useState<FilterDef[]>([])
  const toggleFilter = (f: FilterDef) => {
    setActiveFiltersRaw(prev => {
      const exists = prev.some(p => p.type === f.type && ('value' in p && 'value' in f ? p.value === f.value : true))
      return exists ? prev.filter(p => !(p.type === f.type && ('value' in p && 'value' in f ? p.value === f.value : true))) : [...prev, f]
    })
    setCurrentPage(1)
  }
  const removeFilter = (f: FilterDef) => {
    setActiveFiltersRaw(prev => prev.filter(p => !(p.type === f.type && ('value' in p && 'value' in f ? p.value === f.value : true))))
    setCurrentPage(1)
  }
  const clearFilters = () => { setActiveFiltersRaw([]); setCurrentPage(1) }
  const isFilterActive = (f: FilterDef) =>
    activeFilters.some(p => p.type === f.type && ('value' in p && 'value' in f ? p.value === f.value : true))

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

  const loadComplaints = async (resetPage = false) => {
    const res = await fetch('/api/complaints')
    if (res.ok) {
      setComplaints(await res.json())
      if (resetPage) setCurrentPage(1)
    }
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
      await loadComplaints(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRowClick = (c: Complaint) => {
    if (clickTimerRef.current) return
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null
      setSelectedComplaint(prev => prev?.id === c.id ? null : c)
    }, 220)
  }

  const handleRowDoubleClick = (c: Complaint) => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
    }
    router.push(`/dashboard/${c.id}`)
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
    await loadComplaints(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-spring-text-light text-lg font-semibold">🦜 로딩 중...</p>
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

  // 상담원별 집계 (요청 건수 top5)
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
  const catOrder = (name: string) => name === '미분류' ? 2 : name === '기타' ? 1 : 0
  const categoryStats = Object.entries(byCategory).sort(([aName, aCount], [bName, bCount]) => {
    const diff = catOrder(aName) - catOrder(bName)
    if (diff !== 0) return diff
    return bCount - aCount
  })
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

  // 필터 적용 (AND 조건 - 같은 type 내에서는 OR, 다른 type 간에는 AND)
  const filteredComplaints = activeFilters.length === 0 ? complaints : complaints.filter(c => {
    const byType = activeFilters.reduce((acc, f) => {
      acc[f.type] = acc[f.type] ?? []
      acc[f.type].push(f)
      return acc
    }, {} as Record<string, FilterDef[]>)

    return Object.values(byType).every(group =>
      group.some(f => {
        switch (f.type) {
          case 'status':
            if (f.value === 'resolved') return c.status === 'resolved' || c.status === 'closed'
            return c.status === f.value
          case 'staff': return c.customer_name === f.value
          case 'category': return f.value === '미분류' ? !c.category : c.category === f.value
          case 'priority': return c.priority === f.value
          case 'date': return c.created_at.slice(0, 10) === f.value
          case 'answered': return !!c.final_response
          default: return true
        }
      })
    )
  })

  const statCardDefs = [
    {
      label: '총 문의', sublabel: 'Total', value: total,
      valueClass: 'text-spring-text',
      borderClass: 'from-spring-emerald via-spring-blue to-white/20',
      iconBg: 'bg-spring-text/5 group-hover:bg-spring-text',
      icon: '📋', trend: null,
      filter: null as FilterDef | null,
    },
    {
      label: '미처리', sublabel: 'Pending', value: pending,
      valueClass: 'text-yellow-500',
      borderClass: 'from-yellow-400 via-yellow-300 to-white/20',
      iconBg: 'bg-yellow-50 group-hover:bg-yellow-400',
      icon: '⚠️', trend: null,
      filter: { type: 'status', value: 'pending', label: '미처리' } as FilterDef,
    },
    {
      label: '처리중', sublabel: 'Active', value: inProgress,
      valueClass: 'text-priority-high',
      borderClass: 'from-priority-high via-orange-300 to-white/20',
      iconBg: 'bg-orange-50 group-hover:bg-priority-high',
      icon: '🔄', trend: null,
      filter: { type: 'status', value: 'in_progress', label: '처리중' } as FilterDef,
    },
    {
      label: '완료', sublabel: 'Done', value: resolved,
      valueClass: 'text-spring-emerald',
      borderClass: 'from-spring-emerald via-emerald-300 to-white/20',
      iconBg: 'bg-spring-emerald/10 group-hover:bg-spring-emerald',
      icon: '✅', trend: null,
      filter: { type: 'status', value: 'resolved', label: '완료' } as FilterDef,
    },
    {
      label: '답변완료율', sublabel: 'Resolution', value: `${answerRate}%`,
      valueClass: 'text-spring-blue',
      borderClass: 'from-spring-blue via-spring-emerald to-white/20',
      iconBg: 'bg-blue-50 group-hover:bg-spring-blue',
      icon: '📈', trend: answerRate,
      filter: null as FilterDef | null,
    },
  ]

  return (
    <div className="space-y-6 relative">
      {/* 배경 글로우 */}
      <div className="fixed top-0 left-0 w-[600px] h-[500px] bg-gradient-to-br from-spring-emerald/15 via-spring-blue/10 to-transparent blur-[120px] rounded-full pointer-events-none -translate-x-1/3 -translate-y-1/3 z-0" />
      <div className="fixed top-0 right-0 w-[500px] h-[400px] bg-gradient-to-bl from-spring-pink/10 to-transparent blur-[100px] rounded-full pointer-events-none translate-x-1/4 -translate-y-1/4 z-0" />

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 relative z-10">
        {statCardDefs.map(({ label, sublabel, value, valueClass, borderClass, iconBg, icon, trend, filter }) => {
          const isActive = filter !== null && isFilterActive(filter)
          return (
          <div
            key={label}
            onClick={() => filter && toggleFilter(filter)}
            className={`p-[1.5px] rounded-2xl bg-gradient-to-br ${borderClass} shadow-feather group hover:-translate-y-1.5 transition-all duration-300 ${filter ? 'cursor-pointer' : ''} ${isActive ? 'ring-2 ring-offset-1 ring-spring-emerald scale-[1.03]' : ''}`}
          >
            <div className={`h-full rounded-[14px] p-5 flex flex-col justify-between relative overflow-hidden transition-colors ${isActive ? 'bg-spring-emerald/5' : 'bg-white/95'}`}>
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-spring-text/60 uppercase tracking-wide">
                  {label} <span className="lowercase normal-case font-medium">({sublabel})</span>
                </p>
                <div className={`p-2 rounded-xl ${iconBg} transition-colors text-base`}>{icon}</div>
              </div>
              <div className="mt-4 flex items-end gap-2">
                <h3 className={`text-4xl font-black tabular-nums tracking-tighter ${valueClass}`}>{value}</h3>
              </div>
              {trend !== null && (
                <div className="mt-2 w-full bg-spring-bg h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-spring-blue to-spring-emerald h-full rounded-full" style={{ width: `${trend}%` }} />
                </div>
              )}
              {isActive && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-spring-emerald animate-pulse" />
              )}
            </div>
          </div>
        )})}
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 relative z-10">
        {/* 상담원별 문의 현황 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-spring-emerald/10 shadow-feather p-6 flex flex-col h-[300px] relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 opacity-[0.03] pointer-events-none">
            <span className="text-[160px]">👥</span>
          </div>
          <h3 className="font-extrabold text-spring-text text-sm mb-5 flex items-center gap-2">
            <span className="text-spring-emerald">🎯</span> 요청 Top 5
          </h3>
          {staffStats.length === 0 ? (
            <p className="text-spring-text-light text-sm text-center py-4">데이터 없음</p>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {staffStats.map(([name, count], i) => {
                const barColors = [
                  'bg-gradient-to-r from-spring-emerald to-[#1EE3B9]',
                  'bg-gradient-to-r from-spring-pink to-[#FF6699]',
                  'bg-gradient-to-r from-spring-blue to-[#4DD6FF]',
                  'bg-gradient-to-r from-spring-orange to-[#FFC436]',
                  'bg-gradient-to-r from-purple-400 to-purple-300',
                ]
                const isActive = isFilterActive({ type: 'staff', value: name, label: name })
                return (
                  <div
                    key={name}
                    onClick={() => toggleFilter({ type: 'staff', value: name, label: name })}
                    className={`flex items-center gap-3 cursor-pointer rounded-lg px-1 py-0.5 transition-colors ${isActive ? 'bg-spring-emerald/10' : 'hover:bg-spring-bg'}`}
                  >
                    <span className={`text-xs font-bold w-16 shrink-0 truncate ${isActive ? 'text-spring-emerald' : 'text-spring-text'}`}>{name}</span>
                    <div className="flex-1 bg-spring-bg h-3 rounded-full overflow-hidden">
                      <div
                        className={`${barColors[i % barColors.length]} h-full rounded-full`}
                        style={{ width: `${(count / maxStaffCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-spring-text bg-spring-soft px-2 py-0.5 rounded w-6 text-right shrink-0">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 일별 접수 추이 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-spring-emerald/10 shadow-feather p-6 flex flex-col h-[300px]">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-extrabold text-spring-text text-sm flex items-center gap-2">
              <span className="text-spring-pink">📊</span> 일별 접수 (7일)
            </h3>
          </div>
          <div className="flex-1 flex items-end justify-between gap-2 mt-4 pb-3 border-b-2 border-spring-bg">
            {byDate.map(({ date, count }) => {
              const fullDate = last7.find(d => d.slice(5) === date) ?? date
              const isMax = count === maxDateCount && count > 0
              const isActive = isFilterActive({ type: 'date', value: fullDate, label: date })
              return (
                <div
                  key={date}
                  onClick={() => count > 0 && toggleFilter({ type: 'date', value: fullDate, label: date })}
                  className={`flex-1 flex flex-col items-center gap-1 group relative ${count > 0 ? 'cursor-pointer' : ''} ${isActive ? 'rounded-lg bg-spring-emerald/10' : ''}`}
                >
                  <span className="text-[10px] text-spring-text-light font-bold">{count > 0 ? count : ''}</span>
                  <div className="w-full flex items-end" style={{ height: '60px' }}>
                    <div
                      className={`w-full rounded-t-lg transition-all ${isActive ? 'bg-spring-emerald shadow-[0_-4px_12px_rgba(0,217,165,0.4)]' : isMax ? 'bg-gradient-to-t from-spring-pink via-[#FF6699] to-[#FF2A7A] shadow-[0_-4px_12px_rgba(255,42,122,0.3)]' : 'bg-spring-bg group-hover:bg-spring-emerald/30'}`}
                      style={{ height: `${(count / maxDateCount) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-spring-emerald' : 'text-spring-text-light'}`}>{date}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 긴급도별 현황 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-spring-emerald/10 shadow-feather p-6 flex flex-col h-[300px]">
          <h3 className="font-extrabold text-spring-text text-sm mb-5 flex items-center gap-2">
            <span className="text-priority-high">🔥</span> 긴급도 분포
          </h3>
          <div className="flex-1 flex flex-col justify-between">
            {([5, 4, 3, 2, 1] as Priority[]).map((p) => {
              const count = complaints.filter(c => c.priority === p).length
              const priorityBarColors: Record<number, string> = {
                5: 'bg-gradient-to-r from-rose-500 to-priority-critical shadow-[0_0_8px_rgba(244,63,94,0.4)]',
                4: 'bg-gradient-to-r from-orange-400 to-priority-high shadow-[0_0_8px_rgba(249,115,22,0.3)]',
                3: 'bg-gradient-to-r from-cyan-400 to-priority-medium',
                2: 'bg-gradient-to-r from-emerald-300 to-priority-low',
                1: 'bg-gradient-to-r from-slate-300 to-priority-lowest',
              }
              const isActive = isFilterActive({ type: 'priority', value: p, label: `긴급도 ${PRIORITY_EMOJI[p]}` })
              return (
                <div
                  key={p}
                  onClick={() => count > 0 && toggleFilter({ type: 'priority', value: p, label: `긴급도 ${PRIORITY_EMOJI[p]}` })}
                  className={`flex items-center gap-3 group rounded-lg px-1 py-0.5 transition-colors ${count > 0 ? 'cursor-pointer' : ''} ${isActive ? 'bg-spring-emerald/10' : 'hover:bg-spring-bg'}`}
                >
                  <span className="text-xl w-6 text-center group-hover:scale-125 transition-transform origin-center">{PRIORITY_EMOJI[p]}</span>
                  <div className="flex-1 bg-spring-bg h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`${isActive ? 'bg-spring-emerald' : priorityBarColors[p]} h-full rounded-full`}
                      style={{ width: `${maxPriorityCount > 0 ? (count / maxPriorityCount) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="font-black text-xs w-5 text-right shrink-0 text-spring-text/80">{count}</span>
                </div>
              )
            })}
            {unsetCount > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xl w-6 text-center">⏳</span>
                <div className="flex-1 bg-spring-bg h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gray-300 h-full rounded-full" style={{ width: `${(unsetCount / maxPriorityCount) * 100}%` }} />
                </div>
                <span className="font-black text-xs w-5 text-right shrink-0 text-spring-text/60">{unsetCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* 카테고리별 현황 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-spring-emerald/10 shadow-feather p-6 flex flex-col h-[300px]">
          <h3 className="font-extrabold text-spring-text text-sm mb-5 flex items-center gap-2">
            <span className="text-spring-orange">🗂️</span> 카테고리별
          </h3>
          {categoryStats.length === 0 ? (
            <p className="text-spring-text-light text-sm text-center py-4">데이터 없음</p>
          ) : (
            <>
              <div className="w-full h-8 flex rounded-xl overflow-hidden shadow-sm mb-4 ring-1 ring-black/5">
                {categoryStats.slice(0, 4).map(([cat, count], i) => {
                  const stackColors = ['bg-priority-critical', 'bg-spring-pink', 'bg-spring-blue', 'bg-spring-orange', 'bg-spring-emerald', 'bg-purple-400', 'bg-gray-300']
                  return (
                    <div
                      key={cat}
                      className={`${stackColors[i % stackColors.length]} hover:opacity-90 transition-opacity`}
                      style={{ width: `${(count / total) * 100}%` }}
                      title={`${cat}: ${count}건`}
                    />
                  )
                })}
              </div>
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {categoryStats.map(([cat, count], i) => {
                  const barColors = [
                    'bg-gradient-to-r from-priority-critical to-rose-400',
                    'bg-gradient-to-r from-spring-pink to-[#FF6699]',
                    'bg-gradient-to-r from-spring-blue to-[#4DD6FF]',
                    'bg-gradient-to-r from-spring-orange to-[#FFC436]',
                    'bg-gradient-to-r from-spring-emerald to-[#1EE3B9]',
                    'bg-gradient-to-r from-purple-400 to-purple-300',
                    'bg-gray-300',
                  ]
                  const isActive = isFilterActive({ type: 'category', value: cat, label: cat })
                  return (
                    <div
                      key={cat}
                      onClick={() => toggleFilter({ type: 'category', value: cat, label: cat })}
                      className={`flex items-center gap-2 cursor-pointer rounded-lg px-1 py-0.5 transition-colors ${isActive ? 'bg-spring-emerald/10' : 'hover:bg-spring-bg'}`}
                    >
                      <span className={`text-xs font-bold w-20 shrink-0 truncate ${isActive ? 'text-spring-emerald' : 'text-spring-text'}`}>{cat}</span>
                      <div className="flex-1 bg-spring-bg h-2 rounded-full overflow-hidden">
                        <div
                          className={`${isActive ? 'bg-spring-emerald' : barColors[i % barColors.length]} h-full rounded-full`}
                          style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-spring-text w-5 text-right shrink-0">{count}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 활성 필터 표시 */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap relative z-10">
          <span className="text-xs text-spring-text-light">필터:</span>
          {activeFilters.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-spring-emerald text-white shadow-sm">
              {f.label}
              <button onClick={() => removeFilter(f)} className="ml-0.5 hover:opacity-70 transition-opacity">✕</button>
            </span>
          ))}
          {activeFilters.length > 1 && (
            <button onClick={clearFilters} className="text-xs text-spring-text-light hover:text-spring-pink transition-colors underline">
              전체 해제
            </button>
          )}
          <span className="text-xs text-spring-text-light">{filteredComplaints.length}건</span>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between relative z-10">
        <h2 className="text-xl font-black text-spring-text flex items-center gap-2">
          <span className="text-spring-blue">📋</span> 문의 목록
          <span className="text-sm font-medium text-spring-text-light ml-1">
            {activeFilters.length > 0 ? `${filteredComplaints.length}건 / 전체 ${complaints.length}건` : `총 ${complaints.length}건`}
          </span>
        </h2>
        <div className="flex items-center gap-3">
          {staff?.role === 'counselor' && (
            <button
              onClick={() => { setShowForm(!showForm); setFormError('') }}
              className="spring-gradient text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:opacity-90 hover:-translate-y-0.5 transition-all"
            >
              + 문의 등록
            </button>
          )}
        </div>
      </div>

      {/* 문의 등록 모달 (상담원 전용) */}
      {showForm && staff?.role === 'counselor' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setFormError('') } }}
        >
          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-spring-text/40 backdrop-blur-sm" />

          {/* 모달 */}
          <form
            onSubmit={handleRegister}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 space-y-5 animate-fade-in-up"
            style={{ animation: 'fadeInUp 0.25s ease-out' }}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-spring-text">문의 등록</h2>
                <p className="text-xs text-spring-text-light mt-0.5">등록 후 AI가 자동으로 긴급도를 분석합니다</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError('') }}
                className="p-2 rounded-xl text-spring-text-light hover:bg-spring-bg hover:text-spring-text transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 구분선 */}
            <div className="h-px bg-gradient-to-r from-spring-emerald/30 via-spring-pink/30 to-transparent" />

            <div>
              <label className="block text-sm font-bold text-spring-text mb-1.5">
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
              <label className="block text-sm font-bold text-spring-text mb-1.5">
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
              <label className="block text-sm font-bold text-spring-text mb-1.5">
                작성자
              </label>
              <div className="w-full border border-spring-pink-border rounded-xl px-3 py-2 text-sm bg-spring-bg/60 text-spring-text-light select-none">
                {form.counselor_name}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-spring-bg rounded-xl px-4 py-3 text-xs text-spring-text-light">
              <span>🔮</span>
              <span>등록 후 AI가 자동으로 긴급도·카테고리·담당자를 분석합니다.</span>
            </div>

            {formError && <p className="text-red-500 text-sm font-medium">{formError}</p>}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError('') }}
                className="flex-1 border border-spring-emerald/20 text-spring-text py-2.5 rounded-xl text-sm font-bold hover:bg-spring-bg transition"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 spring-gradient text-white py-2.5 rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition"
              >
                {submitting ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 문의 목록 */}
      {(() => {
        const pagedComplaints = filteredComplaints.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
        return (
      <div className="space-y-3 relative z-10">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-spring-emerald/10 shadow-feather overflow-hidden">
        {filteredComplaints.length === 0 ? (
          <div className="text-center py-16 text-spring-text-light">
            <p className="text-5xl mb-3">🦜</p>
            <p className="font-semibold">등록된 문의가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-spring-bg/80 border-b-2 border-spring-emerald/5 text-[11px] text-spring-text/50 uppercase tracking-widest font-black">
                <th className="px-3 py-4 text-center w-14">긴급도</th>
                <th className="px-3 py-4 text-left">제목</th>
                <th className="px-3 py-4 text-left w-24">상담원</th>
                <th className="px-3 py-4 text-left w-20">상태</th>
                <th className="px-3 py-4 text-left w-24">등록일</th>
                {staff?.role === 'counselor' && (
                  <th className="px-3 py-4 text-left w-20">관리</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-spring-emerald/5">
              {pagedComplaints.map((c) => {
                const isOwn = c.created_by_staff_id === staff?.id
                const isEditing = editingId === c.id

                if (isEditing) {
                  return (
                    <tr key={c.id} className="bg-spring-soft">
                      <td colSpan={6} className="px-6 py-4">
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
                              className="spring-gradient text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50"
                            >
                              {editSaving ? '저장 중...' : '저장'}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="border border-spring-emerald/20 text-spring-text px-4 py-1.5 rounded-xl text-xs hover:bg-white transition"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                }

                const isSelected = selectedComplaint?.id === c.id
                const colSpan = staff?.role === 'counselor' ? 6 : 5
                return (
                  <React.Fragment key={c.id}>
                  <tr
                    onClick={() => handleRowClick(c)}
                    onDoubleClick={() => handleRowDoubleClick(c)}
                    className={`transition-colors group cursor-pointer select-none ${isSelected ? 'bg-spring-emerald/5 border-l-2 border-spring-emerald' : 'hover:bg-spring-emerald/5'}`}
                  >
                    <td className="px-3 py-4 text-center text-xl group-hover:scale-110 transition-transform">
                      {c.priority ? PRIORITY_EMOJI[c.priority] : '⏳'}
                    </td>
                    <td className="px-3 py-4 max-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`font-extrabold truncate transition-colors ${isSelected ? 'text-spring-pink' : 'text-spring-text group-hover:text-spring-pink'}`}>
                          {c.title}
                        </span>
                        {c.final_response && (
                          <span className="shrink-0 text-[10px] font-bold bg-spring-emerald-light text-spring-emerald px-2 py-0.5 rounded-md border border-spring-emerald/20 uppercase tracking-wide">
                            답변완료
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-spring-emerald/20 to-spring-blue/20 flex items-center justify-center text-xs font-black text-spring-text">
                          {c.customer_name?.[0] ?? '?'}
                        </div>
                        <span className="text-xs font-bold text-spring-text">{c.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-3 py-4 text-xs font-bold text-spring-text-light">
                      {formatDateShort(c.created_at)}
                    </td>
                    {staff?.role === 'counselor' && (
                      <td className="px-3 py-4">
                        {isOwn && (
                          <div className="flex gap-1">
                            <button
                              onClick={e => { e.stopPropagation(); startEdit(c) }}
                              className="text-xs bg-spring-emerald-light text-spring-emerald px-3 py-1 rounded-lg font-bold hover:opacity-80"
                            >
                              수정
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDelete(c.id) }}
                              className="text-xs bg-red-50 text-red-400 px-3 py-1 rounded-lg font-bold hover:opacity-80"
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                  {isSelected && (
                    <tr key={`${c.id}-accordion`} className="bg-spring-emerald/5 border-l-2 border-spring-emerald">
                      <td colSpan={colSpan} className="px-6 pb-5 pt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-spring-emerald/10 pt-4">
                          <div>
                            <p className="text-[11px] font-bold text-spring-text-light uppercase tracking-wide mb-2">문의 내용</p>
                            <p className="text-sm text-spring-text leading-relaxed whitespace-pre-wrap bg-white rounded-xl px-4 py-3 border border-spring-emerald/10 max-h-36 overflow-y-auto">{c.content}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-spring-text-light uppercase tracking-wide mb-2">
                              {c.final_response ? '최종 답변' : c.ai_response ? 'AI 답변' : '답변'}
                            </p>
                            {c.final_response || c.ai_response ? (
                              <p className="text-sm text-spring-text leading-relaxed whitespace-pre-wrap bg-white rounded-xl px-4 py-3 border border-spring-emerald/10 max-h-36 overflow-y-auto">
                                {c.final_response ?? c.ai_response}
                              </p>
                            ) : (
                              <p className="text-sm text-spring-text-light italic bg-white rounded-xl px-4 py-3 border border-spring-emerald/10">아직 답변이 없습니다.</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => router.push(`/dashboard/${c.id}`)}
                            className="text-xs spring-gradient text-white px-4 py-1.5 rounded-lg font-bold hover:opacity-90 transition"
                          >
                            상세 보기 →
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <Pagination
        total={filteredComplaints.length}
        currentPage={currentPage}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
        onPageSizeChange={(size) => { setPAGE_SIZE(size); setCurrentPage(1) }}
      />
      </div>
        )
      })()}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:     'bg-yellow-50 text-yellow-600 border border-yellow-200',
    in_progress: 'bg-orange-50 text-priority-high border border-orange-100',
    resolved:    'bg-emerald-50 text-priority-low border border-emerald-100',
    closed:      'bg-slate-50 text-priority-lowest border border-slate-200',
  }
  const icons: Record<string, string> = {
    pending:     '⚠️',
    in_progress: '🔄',
    resolved:    '✅',
    closed:      '🔒',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold uppercase tracking-wide ${styles[status] ?? ''}`}>
      <span className="text-xs">{icons[status] ?? ''}</span>
      {STATUS_LABEL[status as keyof typeof STATUS_LABEL] ?? status}
    </span>
  )
}
