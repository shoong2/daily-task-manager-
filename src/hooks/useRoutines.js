import { useState, useCallback } from 'react'
import { getRoutines, setRoutines } from '../utils/storageUtils'

export function useRoutines() {
  const [routines, setRoutinesState] = useState(() => getRoutines())

  const addRoutine = useCallback((name) => {
    const routine = { id: crypto.randomUUID(), name }
    setRoutinesState(prev => {
      const next = [...prev, routine]
      setRoutines(next)
      return next
    })
    return routine
  }, [])

  const removeRoutine = useCallback((id) => {
    setRoutinesState(prev => {
      const next = prev.filter(r => r.id !== id)
      setRoutines(next)
      return next
    })
  }, [])

  return { routines, addRoutine, removeRoutine }
}
