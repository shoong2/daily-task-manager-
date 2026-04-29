import { useState, useEffect } from 'react'

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000 / 60
  if (diff < 60) return `${Math.round(diff)}분 전`
  if (diff < 1440) return `${Math.round(diff / 60)}시간 전`
  return `${Math.round(diff / 1440)}일 전`
}

export default function NewsWidget() {
  const [articles, setArticles] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/news')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setArticles(data.articles)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex-1">
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">게임 뉴스 🎮</p>

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-1">
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-gray-400">{error}</p>}

      {!loading && !error && (
        <ul className="divide-y divide-gray-100">
          {articles.map((article, i) => (
            <li key={i} className="py-2.5">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-gray-800 hover:text-gray-500 leading-snug line-clamp-2 block"
              >
                {article.title}
              </a>
              <p className="text-xs text-gray-400 mt-1">
                {article.source?.name} · {timeAgo(article.publishedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
