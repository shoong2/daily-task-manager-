import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useSearchFilter } from '../hooks/useSearchFilter'

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [inputValue, setInputValue] = useState(query)
  const [retryCount, setRetryCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [googleData, setGoogleData] = useState(null)
  const [naverData, setNaverData] = useState(null)
  const [hiddenByUser, setHiddenByUser] = useState(new Set())
  const [showFiltered, setShowFiltered] = useState(false)

  const { score, markAsAd, markAsNormal } = useSearchFilter()

  useEffect(() => {
    if (!query) return
    setInputValue(query)
    setLoading(true)
    setFetchError(null)
    setHiddenByUser(new Set())
    setGoogleData(null)
    setNaverData(null)

    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        setGoogleData(data.google)
        setNaverData(data.naver)
      })
      .catch(() => setFetchError('검색 결과를 불러오지 못했어요'))
      .finally(() => setLoading(false))
  }, [query, retryCount])

  function handleSearch() {
    const q = inputValue.trim()
    if (!q) return
    setSearchParams({ q })
  }

  function handleAd(result) {
    markAsAd(result)
    setHiddenByUser(prev => new Set([...prev, result.url]))
  }

  function handleNormal(result) {
    markAsNormal(result)
  }

  function renderResult(result) {
    if (!result.url) return null  // skip results with no URL
    const { filtered } = score(result)
    if (hiddenByUser.has(result.url) || filtered) return null
    return (
      <div key={result.url} className="py-3 border-b border-gray-100 last:border-0">
        <a href={result.url} target="_blank" rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm font-medium block mb-0.5 truncate">
          {result.title}
        </a>
        <p className="text-xs text-gray-400 truncate mb-1">{result.url}</p>
        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{result.snippet}</p>
        <div className="flex gap-2">
          <button onClick={() => handleAd(result)}
            className="text-xs px-2 py-0.5 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
            광고
          </button>
          <button onClick={() => handleNormal(result)}
            className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
            정상
          </button>
        </div>
      </div>
    )
  }

  function getFilteredResults(results) {
    if (!results) return []
    return results.filter(r => {
      const { filtered } = score(r)
      return filtered || hiddenByUser.has(r.url)
    })
  }

  const googleResults = googleData?.results ?? []
  const naverResults = naverData?.results ?? []
  const allFiltered = [
    ...getFilteredResults(googleResults).map(r => ({ ...r, source: 'Google' })),
    ...getFilteredResults(naverResults).map(r => ({ ...r, source: 'Naver' })),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <span className="text-gray-400 text-sm">🔍</span>
        <input
          aria-label="검색"
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="검색..."
          className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
        <button onClick={handleSearch}
          className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
          검색
        </button>
        <Link to="/filter-manager" target="_blank" rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-gray-700 whitespace-nowrap">
          필터 관리 →
        </Link>
      </div>

      <div className="px-6 py-4">
        {loading && (
          <p className="text-center text-gray-400 text-sm py-16">검색 중...</p>
        )}

        {fetchError && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-sm mb-3">{fetchError}</p>
            <button onClick={() => setRetryCount(c => c + 1)}
              className="text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100">
              다시 시도
            </button>
          </div>
        )}

        {!loading && !fetchError && (googleData || naverData) && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                Google
                {googleData?.error && (
                  <span className="text-xs text-red-400 font-normal">{googleData.error}</span>
                )}
              </h2>
              {googleResults.length === 0 && !googleData?.error && (
                <p className="text-xs text-gray-400">결과가 없어요</p>
              )}
              {googleResults.map(renderResult)}
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                Naver
                {naverData?.error && (
                  <span className="text-xs text-red-400 font-normal">{naverData.error}</span>
                )}
              </h2>
              {naverResults.length === 0 && !naverData?.error && (
                <p className="text-xs text-gray-400">결과가 없어요</p>
              )}
              {naverResults.map(renderResult)}
            </div>
          </div>
        )}

        {allFiltered.length > 0 && (
          <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowFiltered(f => !f)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <span>숨겨진 결과 {allFiltered.length}개 (필터에 걸림)</span>
              <span>{showFiltered ? '▲' : '▾'}</span>
            </button>
            {showFiltered && (
              <div className="px-4 py-2">
                {allFiltered.map(result => {
                  const { reasons } = score(result)
                  return (
                    <div key={result.url} className="py-2 border-b border-gray-100 last:border-0 opacity-60">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {result.source}
                        </span>
                        <a href={result.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline truncate">
                          {result.title}
                        </a>
                      </div>
                      <p className="text-xs text-red-400">{reasons.join(', ')}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
