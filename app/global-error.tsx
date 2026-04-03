'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ko">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '2rem' }}>⚠️</p>
            <h2>오류가 발생했습니다</h2>
            <p style={{ color: '#666', fontSize: '0.875rem' }}>{error.message}</p>
            <button onClick={reset} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', borderRadius: '0.75rem', border: 'none', background: '#e91e8c', color: '#fff', cursor: 'pointer' }}>
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
