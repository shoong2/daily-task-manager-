import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRoutines } from './useRoutines'

beforeEach(() => localStorage.clear())

describe('useRoutines', () => {
  it('초기 routines는 빈 배열이다', () => {
    const { result } = renderHook(() => useRoutines())
    expect(result.current.routines).toEqual([])
  })

  it('addRoutine이 routines에 항목을 추가한다', () => {
    const { result } = renderHook(() => useRoutines())
    act(() => result.current.addRoutine('운동하기'))
    expect(result.current.routines).toHaveLength(1)
    expect(result.current.routines[0].name).toBe('운동하기')
    expect(result.current.routines[0].id).toBeDefined()
  })

  it('removeRoutine이 해당 id의 항목을 제거한다', () => {
    const { result } = renderHook(() => useRoutines())
    act(() => result.current.addRoutine('운동하기'))
    const id = result.current.routines[0].id
    act(() => result.current.removeRoutine(id))
    expect(result.current.routines).toHaveLength(0)
  })

  it('localStorage에 routines가 저장된다', () => {
    const { result } = renderHook(() => useRoutines())
    act(() => result.current.addRoutine('독서'))
    expect(JSON.parse(localStorage.getItem('routines'))).toHaveLength(1)
  })
})
