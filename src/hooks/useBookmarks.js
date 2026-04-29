import { useState, useCallback } from 'react'
import { getBookmarks, setBookmarks } from '../utils/storageUtils'

export function useBookmarks() {
  const [bookmarks, setBookmarksState] = useState(() => getBookmarks())

  const addBookmark = useCallback((name, url) => {
    const normalized = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
    const bookmark = { id: crypto.randomUUID(), name, url: normalized }
    setBookmarksState(prev => {
      const next = [...prev, bookmark]
      setBookmarks(next)
      return next
    })
  }, [])

  const removeBookmark = useCallback((id) => {
    setBookmarksState(prev => {
      const next = prev.filter(b => b.id !== id)
      setBookmarks(next)
      return next
    })
  }, [])

  return { bookmarks, addBookmark, removeBookmark }
}
