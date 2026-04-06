'use client'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

interface Props {
  total: number
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  hidePageSizeSelector?: boolean
}

export default function Pagination({ total, currentPage, pageSize, onPageChange, onPageSizeChange, hidePageSizeSelector }: Props) {
  const totalPages = Math.ceil(total / pageSize)
  if (total === 0) return null

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, total)

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
    .reduce<(number | '…')[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…')
      acc.push(p)
      return acc
    }, [])

  return (
    <nav aria-label="페이지 탐색" className="flex items-center justify-center gap-4 flex-wrap">
      {/* 페이지 크기 선택 */}
      {!hidePageSizeSelector && (
      <div className="flex items-center gap-2 text-xs text-spring-text-light">
        <span>페이지당</span>
        <div className="flex gap-1">
          {PAGE_SIZE_OPTIONS.map(size => (
            <button
              key={size}
              onClick={() => { onPageSizeChange(size); onPageChange(1) }}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                pageSize === size
                  ? 'spring-gradient text-white shadow-sm'
                  : 'bg-white text-spring-text-light hover:text-spring-text hover:bg-spring-bg border border-spring-emerald/10'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
        <span>건</span>
      </div>
      )}

      {/* 페이지 버튼 */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="첫 페이지"
          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-spring-text-light hover:bg-white hover:text-spring-text disabled:opacity-30 disabled:cursor-not-allowed transition"
        >«</button>
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="이전 페이지"
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-spring-text-light hover:bg-white hover:text-spring-text disabled:opacity-30 disabled:cursor-not-allowed transition"
        >‹</button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} aria-hidden="true" className="px-2 text-xs text-spring-text-light">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              aria-label={`${p}페이지`}
              aria-current={currentPage === p ? 'page' : undefined}
              className={`w-8 h-8 rounded-lg text-xs font-black transition ${
                currentPage === p
                  ? 'spring-gradient text-white shadow-sm'
                  : 'text-spring-text-light hover:bg-white hover:text-spring-text'
              }`}
            >{p}</button>
          )
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="다음 페이지"
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-spring-text-light hover:bg-white hover:text-spring-text disabled:opacity-30 disabled:cursor-not-allowed transition"
        >›</button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="마지막 페이지"
          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-spring-text-light hover:bg-white hover:text-spring-text disabled:opacity-30 disabled:cursor-not-allowed transition"
        >»</button>

        <span className="ml-1 text-xs text-spring-text-light" aria-live="polite">{start}–{end} / {total}건</span>
      </div>
    </nav>
  )
}
