'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-spring-soft">
      <div className="text-center space-y-4">
        <p className="text-4xl">⚠️</p>
        <h2 className="text-lg font-bold text-spring-text">오류가 발생했습니다</h2>
        <p className="text-sm text-spring-text-light">{error.message}</p>
        <button
          onClick={reset}
          className="spring-gradient text-white px-6 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition"
        >
          다시 시도
        </button>
      </div>
    </div>
  )
}
