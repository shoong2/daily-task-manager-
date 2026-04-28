import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTasks } from './useTasks'

beforeEach(() => localStorage.clear())

const routines = [
  { id: 'r1', name: '운동하기' },
  { id: 'r2', name: '독서 30분' },
]

describe('ensureDate', () => {
  it('해당 날짜가 없으면 routines를 done:false로 복사하여 생성한다', () => {
    const { result } = renderHook(() => useTasks(routines))
    act(() => result.current.ensureDate('2026-04-28', routines))
    const tasks = result.current.allTasks['2026-04-28']
    expect(tasks).toHaveLength(2)
    expect(tasks[0]).toMatchObject({ id: 'r1', name: '운동하기', done: false, type: 'routine' })
  })

  it('해당 날짜가 이미 있으면 기존 상태를 유지한다', () => {
    const existing = [{ id: 'r1', name: '운동하기', done: true, type: 'routine' }]
    localStorage.setItem('tasks', JSON.stringify({ '2026-04-28': existing }))
    const { result } = renderHook(() => useTasks(routines))
    act(() => result.current.ensureDate('2026-04-28', routines))
    expect(result.current.allTasks['2026-04-28'][0].done).toBe(true)
  })
})

describe('toggleTask', () => {
  it('done 상태를 토글한다', () => {
    const { result } = renderHook(() => useTasks(routines))
    act(() => result.current.ensureDate('2026-04-28', routines))
    act(() => result.current.toggleTask('2026-04-28', 'r1'))
    expect(result.current.allTasks['2026-04-28'].find(t => t.id === 'r1').done).toBe(true)
  })
})

describe('addTask', () => {
  it('one-time 할 일을 추가한다', () => {
    const { result } = renderHook(() => useTasks(routines))
    act(() => result.current.ensureDate('2026-04-28', routines))
    act(() => result.current.addTask('2026-04-28', '병원 예약'))
    const tasks = result.current.allTasks['2026-04-28']
    const added = tasks.find(t => t.name === '병원 예약')
    expect(added).toBeDefined()
    expect(added.type).toBe('one-time')
    expect(added.done).toBe(false)
  })
})

describe('removeTask', () => {
  it('해당 id 할 일을 제거한다', () => {
    const { result } = renderHook(() => useTasks(routines))
    act(() => result.current.ensureDate('2026-04-28', routines))
    act(() => result.current.addTask('2026-04-28', '병원 예약'))
    const id = result.current.allTasks['2026-04-28'].find(t => t.name === '병원 예약').id
    act(() => result.current.removeTask('2026-04-28', id))
    expect(result.current.allTasks['2026-04-28'].find(t => t.id === id)).toBeUndefined()
  })
})

describe('addRoutineToToday', () => {
  it('오늘 날짜에 루틴을 추가한다', () => {
    vi.setSystemTime(new Date(2026, 3, 28))
    const { result } = renderHook(() => useTasks(routines))
    act(() => result.current.addRoutineToToday(routines[0]))
    const todayTasks = result.current.allTasks['2026-04-28']
    expect(todayTasks).toBeDefined()
    expect(todayTasks.find(t => t.id === 'r1')).toMatchObject({
      id: 'r1',
      name: '운동하기',
      done: false,
      type: 'routine',
    })
    vi.useRealTimers()
  })

  it('같은 루틴을 두 번 추가해도 중복되지 않는다', () => {
    vi.setSystemTime(new Date(2026, 3, 28))
    const { result } = renderHook(() => useTasks(routines))
    act(() => {
      result.current.addRoutineToToday(routines[0])
      result.current.addRoutineToToday(routines[0])
    })
    const todayTasks = result.current.allTasks['2026-04-28']
    expect(todayTasks.filter(t => t.id === 'r1')).toHaveLength(1)
    vi.useRealTimers()
  })
})
