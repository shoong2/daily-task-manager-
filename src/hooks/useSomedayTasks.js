import { useState, useCallback } from 'react'
import { getSomedayTasks, setSomedayTasks } from '../utils/storageUtils'

export function useSomedayTasks() {
  const [tasks, setTasks] = useState(() => getSomedayTasks())

  const addTask = useCallback((name) => {
    const task = { id: crypto.randomUUID(), name, done: false }
    setTasks(prev => {
      const next = [...prev, task]
      setSomedayTasks(next)
      return next
    })
  }, [])

  const toggleTask = useCallback((id) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, done: !t.done } : t)
      setSomedayTasks(next)
      return next
    })
  }, [])

  const removeTask = useCallback((id) => {
    setTasks(prev => {
      const next = prev.filter(t => t.id !== id)
      setSomedayTasks(next)
      return next
    })
  }, [])

  return { tasks, addTask, toggleTask, removeTask }
}
