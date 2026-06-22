import { useEffect, useMemo, useState, useCallback } from 'react'
import Pagination from './Pagination'

const CATEGORIES = ['전체', '공공임대', '매입임대', '행복주택']
const PAGE_SIZE = 5

export default function HousingWidget() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [category, setCategory] = useState('전체')
  const [page, setPage] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch('/api/housing')
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
          setItems([])
        } else {
          setItems(data.items ?? [])
        }
        setPage(0)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    return category === '전체' ? items : items.filter(i => i.type === category)
  }, [items, category])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    [filtered.length]
  )
  const visible = useMemo(
    () => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filtered, page]
  )

  const handleCategoryChange = (c) => {
    setCategory(c)
    setPage(0)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest text-gray-400">경기도 임대주택 🏠</p>
        <button
          type="button"
          aria-label="새로고침"
          onClick={load}
          className="text-xs text-gray-300 hover:text-gray-500"
        >↻</button>
      </div>

      <div className="flex gap-1.5 mb-3.5 flex-wrap">
        {CATEGORIES.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => handleCategoryChange(c)}
            className={`px-2.5 py-1 text-xs rounded-full ${
              c === category ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >{c}</button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse flex-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-1">
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-gray-400 flex-1">데이터를 불러올 수 없습니다 ({error})</p>
      )}

      {!loading && !error && visible.length === 0 && (
        <p className="text-sm text-gray-400 flex-1">공고가 없습니다</p>
      )}

      {!loading && !error && visible.length > 0 && (
        <ul className="border-t border-gray-100 flex-1">
          {visible.map(item => (
            <li key={item.id} className="py-2.5 border-b border-gray-100 last:border-b-0">
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium text-gray-800 hover:text-gray-500 leading-snug block">
                {item.title}
              </a>
              <p className="text-xs text-gray-400 mt-0.5">
                {item.type} · 접수 ~{item.deadline}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}
