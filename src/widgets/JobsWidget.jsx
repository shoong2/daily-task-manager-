import { useEffect, useState, useCallback } from 'react'
import Pagination from './Pagination'

const PAGE_SIZE = 5

function JobItem({ item }) {
  return (
    <li className="py-2.5 border-b border-gray-100 last:border-b-0">
      <a href={item.url} target="_blank" rel="noopener noreferrer"
        className="text-sm font-medium text-gray-800 hover:text-gray-500 leading-snug block">
        {item.title}
      </a>
      <p className="text-xs text-gray-400 mt-0.5">
        {[item.organization, item.region, item.employmentType, `~${item.deadline}`]
          .filter(Boolean).join(' · ')}
      </p>
    </li>
  )
}

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse flex-1">
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-1">
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  )
}

export default function JobsWidget() {
  const [tab, setTab] = useState('all')
  const [data, setData] = useState({ all: null, keyword: null })
  const [loading, setLoading] = useState({ all: false, keyword: false })
  const [error, setError] = useState({ all: null, keyword: null })
  const [page, setPage] = useState({ all: 0, keyword: 0 })

  const fetchAll = useCallback(async () => {
    setLoading(s => ({ ...s, all: true }))
    setError(s => ({ ...s, all: null }))
    try {
      const r = await fetch('/api/jobs')
      const d = await r.json()
      if (d.error) {
        setError(s => ({ ...s, all: d.error }))
        setData(s => ({ ...s, all: [] }))
      } else {
        setData(s => ({ ...s, all: d.items ?? [] }))
      }
    } catch (e) {
      setError(s => ({ ...s, all: e.message }))
      setData(s => ({ ...s, all: [] }))
    } finally {
      setLoading(s => ({ ...s, all: false }))
    }
  }, [])

  useEffect(() => {
    if (tab === 'all' && data.all === null && !loading.all) fetchAll()
  }, [tab, data.all, loading.all, fetchAll])

  const items = data[tab] ?? []
  const currentPage = page[tab]
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const visible = items.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  const handlePage = (p) => setPage(s => ({ ...s, [tab]: p }))
  const handleRefresh = () => {
    setData(s => ({ ...s, [tab]: null }))
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest text-gray-400">채용공고 💼</p>
        <button
          type="button"
          aria-label="새로고침"
          onClick={handleRefresh}
          className="text-xs text-gray-300 hover:text-gray-500"
        >↻</button>
      </div>

      <div className="flex gap-3.5 border-b border-gray-200 mb-2.5">
        {[{ id: 'all', label: '전체' }].map(t => (
          <button
            key={t.id}
            type="button"
            role="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`text-xs pb-2 -mb-px ${
              tab === t.id ? 'font-semibold text-gray-800 border-b-2 border-gray-800' : 'text-gray-400'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {loading[tab] && <Skeleton />}

      {!loading[tab] && error[tab] && (
        <p className="text-sm text-gray-400 flex-1">데이터를 불러올 수 없습니다 ({error[tab]})</p>
      )}

      {!loading[tab] && !error[tab] && visible.length === 0 && (
        <p className="text-sm text-gray-400 flex-1">공고가 없습니다</p>
      )}

      {!loading[tab] && !error[tab] && visible.length > 0 && (
        <ul className="flex-1">
          {visible.map(item => <JobItem key={item.id} item={item} />)}
        </ul>
      )}

      <Pagination page={currentPage} totalPages={totalPages} onChange={handlePage} />
    </div>
  )
}
