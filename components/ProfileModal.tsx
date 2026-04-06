'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Staff } from '@/lib/types'

interface Props {
  staff: Staff
  onClose: () => void
  onUpdated: (updated: Staff) => void
}

export default function ProfileModal({ staff, onClose, onUpdated }: Props) {
  const [name, setName] = useState(staff.name)
  const [phone, setPhone] = useState(staff.phone ?? '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)

  const [infoSaving, setInfoSaving] = useState(false)
  const [infoError, setInfoError] = useState('')
  const [infoSuccess, setInfoSuccess] = useState(false)

  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  const ic = 'w-full border border-spring-pink-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-spring-emerald bg-spring-bg'

  const saveInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    setInfoSaving(true)
    setInfoError('')
    setInfoSuccess(false)

    const res = await fetch(`/api/staff/${staff.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone: phone || null }),
    })

    if (!res.ok) {
      setInfoError((await res.json()).error ?? '수정에 실패했습니다.')
    } else {
      const updated = await res.json()
      setInfoSuccess(true)
      onUpdated(updated)
    }
    setInfoSaving(false)
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)

    if (newPw.length < 6) return setPwError('새 비밀번호는 6자 이상이어야 합니다.')
    if (newPw !== confirmPw) return setPwError('새 비밀번호가 일치하지 않습니다.')

    setPwSaving(true)

    // 현재 비밀번호로 재인증
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { setPwError('인증 정보를 찾을 수 없습니다.'); setPwSaving(false); return }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPw,
    })
    if (signInError) { setPwError('현재 비밀번호가 올바르지 않습니다.'); setPwSaving(false); return }

    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) {
      setPwError(error.message)
    } else {
      setPwSuccess(true)
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    }
    setPwSaving(false)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-3 sm:mx-4 overflow-hidden">
        {/* 헤더 */}
        <div className="spring-gradient px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div aria-hidden="true" className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-lg font-black text-white">
              {staff.name[0]}
            </div>
            <div>
              <p id="profile-modal-title" className="text-white font-bold text-base leading-tight">{staff.name}</p>
              <p className="text-white/70 text-xs">{staff.email}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="프로필 닫기" className="text-white/70 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* 기본 정보 수정 */}
          <form onSubmit={saveInfo} className="space-y-3">
            <h3 className="text-sm font-bold text-spring-text">기본 정보</h3>
            <div>
              <label htmlFor="profile-name" className="text-xs text-spring-text-light block mb-1">이름</label>
              <input id="profile-name" value={name} onChange={e => { setName(e.target.value); setInfoSuccess(false) }} className={ic} required aria-describedby={infoError ? 'info-error' : undefined} />
            </div>
            <div>
              <label htmlFor="profile-phone" className="text-xs text-spring-text-light block mb-1">연락처</label>
              <input id="profile-phone" type="tel" autoComplete="tel" value={phone} onChange={e => { setPhone(e.target.value); setInfoSuccess(false) }} className={ic} placeholder="010-0000-0000" />
            </div>
            <div>
              <label htmlFor="profile-dept" className="text-xs text-spring-text-light block mb-1">부서 / 역할</label>
              <input id="profile-dept" value={`${staff.department} / ${staff.role === 'admin' ? '관리자' : '상담원'}`} disabled aria-disabled="true" className={`${ic} opacity-50 cursor-not-allowed`} />
            </div>
            {infoError && <p id="info-error" role="alert" className="text-spring-pink text-xs">{infoError}</p>}
            {infoSuccess && <p role="status" className="text-spring-emerald text-xs font-medium">저장됐습니다.</p>}
            <button type="submit" disabled={infoSaving} className="w-full spring-gradient text-white text-sm py-2 rounded-xl hover:opacity-90 disabled:opacity-50 font-medium">
              {infoSaving ? '저장 중...' : '정보 저장'}
            </button>
          </form>

          <div className="border-t border-spring-pink-border" />

          {/* 비밀번호 변경 */}
          <form onSubmit={changePassword} className="space-y-3">
            <h3 className="text-sm font-bold text-spring-text">비밀번호 변경</h3>
            <div className="relative">
              <label htmlFor="profile-current-pw" className="text-xs text-spring-text-light block mb-1">현재 비밀번호</label>
              <input
                id="profile-current-pw"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={currentPw}
                onChange={e => { setCurrentPw(e.target.value); setPwSuccess(false) }}
                className={`${ic} pr-14`}
                placeholder="현재 비밀번호"
                aria-describedby={pwError ? 'pw-error' : undefined}
              />
            </div>
            <div>
              <label htmlFor="profile-new-pw" className="text-xs text-spring-text-light block mb-1">새 비밀번호 (6자 이상)</label>
              <input
                id="profile-new-pw"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPw}
                onChange={e => { setNewPw(e.target.value); setPwSuccess(false) }}
                className={ic}
                placeholder="새 비밀번호"
              />
            </div>
            <div>
              <label htmlFor="profile-confirm-pw" className="text-xs text-spring-text-light block mb-1">새 비밀번호 확인</label>
              <input
                id="profile-confirm-pw"
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPw}
                onChange={e => { setConfirmPw(e.target.value); setPwSuccess(false) }}
                className={ic}
                placeholder="새 비밀번호 확인"
              />
            </div>
            <label htmlFor="profile-show-pw" className="flex items-center gap-2 text-xs text-spring-text-light cursor-pointer select-none">
              <input id="profile-show-pw" type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)} className="accent-spring-emerald" />
              비밀번호 표시
            </label>
            {pwError && <p id="pw-error" role="alert" className="text-spring-pink text-xs">{pwError}</p>}
            {pwSuccess && <p role="status" className="text-spring-emerald text-xs font-medium">비밀번호가 변경됐습니다.</p>}
            <button type="submit" disabled={pwSaving || !currentPw || !newPw || !confirmPw} className="w-full bg-spring-emerald text-white text-sm py-2 rounded-xl hover:opacity-90 disabled:opacity-50 font-medium">
              {pwSaving ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
