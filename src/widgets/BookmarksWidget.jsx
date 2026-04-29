import { useState } from 'react'

export default function BookmarksWidget({ bookmarks, onAdd, onRemove }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedUrl = url.trim()
    if (!trimmedName || !trimmedUrl) return
    onAdd(trimmedName, trimmedUrl)
    setName('')
    setUrl('')
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">자주 방문하는 사이트</p>

      {bookmarks.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {bookmarks.map(b => (
            <div key={b.id} className="flex items-center gap-0.5 group">
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-700 hover:text-gray-900 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {b.name}
              </a>
              <button
                onClick={() => onRemove(b.id)}
                className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity text-base leading-none px-1"
                aria-label="삭제"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="사이트 이름"
          className="w-32 text-sm text-gray-700 placeholder-gray-300 border-b border-gray-200 focus:border-gray-500 outline-none py-1 bg-transparent"
        />
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="주소 (예: google.com)"
          className="flex-1 text-sm text-gray-700 placeholder-gray-300 border-b border-gray-200 focus:border-gray-500 outline-none py-1 bg-transparent"
        />
        <button
          type="submit"
          disabled={!name.trim() || !url.trim()}
          className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xl leading-none"
        >
          +
        </button>
      </form>
    </div>
  )
}
