export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const isFirst = page === 0
  const isLast = page === totalPages - 1

  return (
    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 mt-1.5">
      <button
        type="button"
        aria-label="이전 페이지"
        onClick={() => onChange(page - 1)}
        disabled={isFirst}
        className="w-6 h-6 border border-gray-200 rounded-md bg-white text-xs text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
      >
        ‹
      </button>
      <span className="text-xs text-gray-500 tabular-nums">{page + 1} / {totalPages}</span>
      <button
        type="button"
        aria-label="다음 페이지"
        onClick={() => onChange(page + 1)}
        disabled={isLast}
        className="w-6 h-6 border border-gray-200 rounded-md bg-white text-xs text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
      >
        ›
      </button>
    </div>
  )
}
