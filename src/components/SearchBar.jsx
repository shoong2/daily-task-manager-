import { useState } from 'react'

export default function SearchBar() {
  const [query, setQuery] = useState('')

  function handleSearch() {
    const q = query.trim()
    if (!q) return
    window.open(`/search?q=${encodeURIComponent(q)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white">
      <span className="text-gray-400 text-sm">🔍</span>
      <input
        aria-label="검색"
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSearch()}
        placeholder="검색..."
        className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
      />
      <button
        onClick={handleSearch}
        className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
      >
        검색
      </button>
    </div>
  )
}
