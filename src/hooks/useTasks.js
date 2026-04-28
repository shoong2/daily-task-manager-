import { useState, useCallback } from 'react'
import { getAllTasks, setAllTasks } from '../utils/storageUtils'
import { today } from '../utils/dateUtils'

export function useTasks(routines) {
  const [allTasks, setAllTasksState] = useState(() => getAllTasks())

  const ensureDate = useCallback((dateKey, routines) => {
    setAllTasksState(prev => {
      if (prev[dateKey]) return prev
      const initial = (routines ?? []).map(r => ({ id: r.id, name: r.name, done: false, type: 'routine' }))
      const next = { ...prev, [dateKey]: initial }
      setAllTasks(next)
      return next
    })
  }, [])

  const toggleTask = useCallback((dateKey, taskId) => {
    setAllTasksState(prev => {
      const tasks = (prev[dateKey] ?? []).map(t =>
        t.id === taskId ? { ...t, done: !t.done } : t
      )
      const next = { ...prev, [dateKey]: tasks }
      setAllTasks(next)
      return next
    })
  }, [])

  const addTask = useCallback((dateKey, name) => {
    const task = { id: crypto.randomUUID(), name, done: false, type: 'one-time' }
    setAllTasksState(prev => {
      const next = { ...prev, [dateKey]: [...(prev[dateKey] ?? []), task] }
      setAllTasks(next)
      return next
    })
  }, [])

  const removeTask = useCallback((dateKey, taskId) => {
    setAllTasksState(prev => {
      const next = { ...prev, [dateKey]: (prev[dateKey] ?? []).filter(t => t.id !== taskId) }
      setAllTasks(next)
      return next
    })
  }, [])

  const addRoutineToToday = useCallback((routine) => {
    const dateKey = today()
    const task = { id: routine.id, name: routine.name, done: false, type: 'routine' }
    setAllTasksState(prev => {
      const existing = prev[dateKey] ?? []
      if (existing.some(t => t.id === routine.id)) return prev
      const next = { ...prev, [dateKey]: [...existing, task] }
      setAllTasks(next)
      return next
    })
  }, [])

  return { allTasks, ensureDate, toggleTask, addTask, removeTask, addRoutineToToday }
}
