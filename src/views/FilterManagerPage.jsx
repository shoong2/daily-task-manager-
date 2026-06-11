import { useState } from 'react'
import { useSearchFilter } from '../hooks/useSearchFilter'

function AddInput({ onAdd, placeholder = '직접 추가...' }) {
  const [value, setValue] = useState('')
  function handleAdd() {
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
  }
  return (
    <div className="flex gap-2 mt-2">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
        placeholder={placeholder}
        className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
      />
      <button
        onClick={handleAdd}
        className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
      >
        추가
      </button>
    </div>
  )
}

export default function FilterManagerPage() {
  const { filters, addDomain, removeDomain, addKeyword, removeKeyword, updateThreshold } = useSearchFilter()
  const [thresholdInput, setThresholdInput] = useState(String(filters.threshold))

  const blockedDomains = Object.entries(filters.domains).filter(([, v]) => v.blocked)
  const blockedKeywords = Object.entries(filters.keywords).filter(([, v]) => v.blocked)

  function handleThresholdChange(e) {
    const val = e.target.value
    setThresholdInput(val)
    const n = parseInt(val, 10)
    if (!isNaN(n) && n >= 1) updateThreshold(n)
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold text-gray-900 mb-6">필터 관리</h1>

      <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">
          차단된 도메인
          <span className="text-gray-400 font-normal ml-1">({blockedDomains.length}개)</span>
        </h2>
        <p className="text-xs text-gray-400 mb-3">해당 도메인의 모든 결과를 숨깁니다</p>

        {blockedDomains.length === 0 && (
          <p className="text-xs text-gray-400 py-2">차단된 도메인이 없어요</p>
        )}
        {blockedDomains.map(([domain, rule]) => (
          <div key={domain} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-700">{domain}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{rule.count}회</span>
              {rule.manual && <span className="text-xs text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded">수동</span>}
              <button
                onClick={() => removeDomain(domain)}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
        <AddInput onAdd={addDomain} placeholder="직접 추가..." />
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">
          차단된 키워드
          <span className="text-gray-400 font-normal ml-1">({blockedKeywords.length}개)</span>
        </h2>
        <p className="text-xs text-gray-400 mb-3">제목에 키워드가 포함된 결과는 점수에 반영됩니다</p>

        {blockedKeywords.length === 0 && (
          <p className="text-xs text-gray-400 py-2">차단된 키워드가 없어요</p>
        )}
        {blockedKeywords.map(([keyword, rule]) => (
          <div key={keyword} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-700">{keyword}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{rule.count}회</span>
              {rule.manual && <span className="text-xs text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded">수동</span>}
              <button
                onClick={() => removeKeyword(keyword)}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
        <AddInput onAdd={addKeyword} placeholder="직접 추가..." />
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">자동 차단 임계값</h2>
        <p className="text-xs text-gray-400 mb-3">같은 도메인/키워드에 "광고"를 이 횟수 이상 클릭하면 자동 차단합니다</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="20"
            value={thresholdInput}
            onChange={handleThresholdChange}
            className="w-20 text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          <span className="text-sm text-gray-500">회</span>
        </div>
      </section>
    </div>
  )
}
