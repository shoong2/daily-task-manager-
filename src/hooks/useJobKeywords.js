import { useState, useCallback } from 'react'
import { getJobKeywords, setJobKeywords } from '../utils/storageUtils'

export function useJobKeywords() {
  const [keywords, setKeywordsState] = useState(() => getJobKeywords())

  const addKeyword = useCallback((text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setKeywordsState(prev => {
      if (prev.includes(trimmed)) return prev
      const next = [...prev, trimmed]
      setJobKeywords(next)
      return next
    })
  }, [])

  const removeKeyword = useCallback((text) => {
    setKeywordsState(prev => {
      const next = prev.filter(k => k !== text)
      setJobKeywords(next)
      return next
    })
  }, [])

  return { keywords, addKeyword, removeKeyword }
}
