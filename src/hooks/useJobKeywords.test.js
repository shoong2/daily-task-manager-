import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useJobKeywords } from './useJobKeywords'

beforeEach(() => localStorage.clear())

describe('useJobKeywords', () => {
  it('초기 keywords는 빈 배열이다', () => {
    const { result } = renderHook(() => useJobKeywords())
    expect(result.current.keywords).toEqual([])
  })

  it('addKeyword가 항목을 추가한다', () => {
    const { result } = renderHook(() => useJobKeywords())
    act(() => result.current.addKeyword('React'))
    expect(result.current.keywords).toEqual(['React'])
  })

  it('중복 키워드는 추가되지 않는다', () => {
    const { result } = renderHook(() => useJobKeywords())
    act(() => result.current.addKeyword('React'))
    act(() => result.current.addKeyword('React'))
    expect(result.current.keywords).toEqual(['React'])
  })

  it('공백만 있는 입력은 무시한다', () => {
    const { result } = renderHook(() => useJobKeywords())
    act(() => result.current.addKeyword('   '))
    expect(result.current.keywords).toEqual([])
  })

  it('앞뒤 공백을 trim한다', () => {
    const { result } = renderHook(() => useJobKeywords())
    act(() => result.current.addKeyword('  Unity  '))
    expect(result.current.keywords).toEqual(['Unity'])
  })

  it('removeKeyword가 항목을 제거한다', () => {
    const { result } = renderHook(() => useJobKeywords())
    act(() => result.current.addKeyword('React'))
    act(() => result.current.removeKeyword('React'))
    expect(result.current.keywords).toEqual([])
  })

  it('localStorage에 저장된다', () => {
    const { result } = renderHook(() => useJobKeywords())
    act(() => result.current.addKeyword('Vue'))
    expect(JSON.parse(localStorage.getItem('job-keywords'))).toEqual(['Vue'])
  })
})
