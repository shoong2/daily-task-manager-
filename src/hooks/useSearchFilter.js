import { useState, useCallback } from 'react'
import { getSearchFilters, setSearchFilters } from '../utils/storageUtils'
import { scoreResult, extractKeywords, extractDomain } from '../utils/filterEngine'

const DEFAULT_THRESHOLD = 3
const DEFAULT_KEYWORDS = ['협찬', '제공받음', '리뷰노트', '유료광고', '소정의', '내돈내산 아님']

function initFilters() {
  const saved = getSearchFilters()
  if (saved) return saved
  const keywords = {}
  for (const kw of DEFAULT_KEYWORDS) {
    keywords[kw] = { count: DEFAULT_THRESHOLD, blocked: true, manual: true }
  }
  const initial = { domains: {}, keywords, threshold: DEFAULT_THRESHOLD }
  setSearchFilters(initial)
  return initial
}

export function useSearchFilter() {
  const [filters, setFiltersState] = useState(initFilters)

  const markAsAd = useCallback((result) => {
    setFiltersState(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      const domain = extractDomain(result.url)

      if (!next.domains[domain]) next.domains[domain] = { count: 0, blocked: false, manual: false }
      next.domains[domain].count = Math.min(next.domains[domain].count + 1, 999)
      if (!next.domains[domain].manual) {
        next.domains[domain].blocked = next.domains[domain].count >= next.threshold
      }

      const kws = extractKeywords(result.title)
      for (const kw of kws) {
        if (!next.keywords[kw]) next.keywords[kw] = { count: 0, blocked: false, manual: false }
        next.keywords[kw].count = Math.min(next.keywords[kw].count + 1, 999)
        if (!next.keywords[kw].manual) {
          next.keywords[kw].blocked = next.keywords[kw].count >= next.threshold
        }
      }

      setSearchFilters(next)
      return next
    })
  }, [])

  const markAsNormal = useCallback((result) => {
    setFiltersState(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      const domain = extractDomain(result.url)

      if (next.domains[domain] && !next.domains[domain].manual) {
        next.domains[domain].count = Math.max(0, next.domains[domain].count - 1)
        next.domains[domain].blocked = next.domains[domain].count >= next.threshold
      }

      const kws = extractKeywords(result.title)
      for (const kw of kws) {
        if (next.keywords[kw] && !next.keywords[kw].manual) {
          next.keywords[kw].count = Math.max(0, next.keywords[kw].count - 1)
          next.keywords[kw].blocked = next.keywords[kw].count >= next.threshold
        }
      }

      setSearchFilters(next)
      return next
    })
  }, [])

  const addDomain = useCallback((domain) => {
    setFiltersState(prev => {
      const next = {
        ...prev,
        domains: {
          ...prev.domains,
          [domain]: { count: prev.threshold, blocked: true, manual: true },
        },
      }
      setSearchFilters(next)
      return next
    })
  }, [])

  const removeDomain = useCallback((domain) => {
    setFiltersState(prev => {
      const domains = { ...prev.domains }
      delete domains[domain]
      const next = { ...prev, domains }
      setSearchFilters(next)
      return next
    })
  }, [])

  const addKeyword = useCallback((keyword) => {
    setFiltersState(prev => {
      const next = {
        ...prev,
        keywords: {
          ...prev.keywords,
          [keyword]: { count: prev.threshold, blocked: true, manual: true },
        },
      }
      setSearchFilters(next)
      return next
    })
  }, [])

  const removeKeyword = useCallback((keyword) => {
    setFiltersState(prev => {
      const keywords = { ...prev.keywords }
      delete keywords[keyword]
      const next = { ...prev, keywords }
      setSearchFilters(next)
      return next
    })
  }, [])

  const updateThreshold = useCallback((threshold) => {
    setFiltersState(prev => {
      const next = { ...prev, threshold }
      setSearchFilters(next)
      return next
    })
  }, [])

  const score = useCallback((result) => {
    return scoreResult(result, filters)
  }, [filters])

  return {
    filters,
    markAsAd,
    markAsNormal,
    addDomain,
    removeDomain,
    addKeyword,
    removeKeyword,
    updateThreshold,
    score,
  }
}
