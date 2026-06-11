import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSearchFilter } from './useSearchFilter'

beforeEach(() => localStorage.clear())

describe('useSearchFilter 초기화', () => {
  it('localStorage가 비어있으면 기본 키워드로 초기화된다', () => {
    const { result } = renderHook(() => useSearchFilter())
    expect(result.current.filters.keywords['협찬']).toBeDefined()
    expect(result.current.filters.keywords['협찬'].blocked).toBe(true)
    expect(result.current.filters.threshold).toBe(3)
  })

  it('localStorage에 기존 데이터가 있으면 덮어쓰지 않는다', () => {
    localStorage.setItem('search-filters', JSON.stringify({
      domains: {},
      keywords: { '커스텀키워드': { count: 5, blocked: true, manual: true } },
      threshold: 5,
    }))
    const { result } = renderHook(() => useSearchFilter())
    expect(result.current.filters.threshold).toBe(5)
    expect(result.current.filters.keywords['커스텀키워드']).toBeDefined()
    expect(result.current.filters.keywords['협찬']).toBeUndefined()
  })
})

describe('markAsAd', () => {
  it('도메인 count가 1 증가한다', () => {
    const { result } = renderHook(() => useSearchFilter())
    act(() => result.current.markAsAd({ title: '어떤 글', url: 'https://spam.com/post/1' }))
    expect(result.current.filters.domains['spam.com'].count).toBe(1)
  })

  it('count >= threshold면 blocked가 true가 된다', () => {
    const { result } = renderHook(() => useSearchFilter())
    act(() => result.current.markAsAd({ title: '어떤 글', url: 'https://spam.com/1' }))
    act(() => result.current.markAsAd({ title: '어떤 글', url: 'https://spam.com/2' }))
    act(() => result.current.markAsAd({ title: '어떤 글', url: 'https://spam.com/3' }))
    expect(result.current.filters.domains['spam.com'].blocked).toBe(true)
  })

  it('제목의 키워드 count도 증가한다', () => {
    const { result } = renderHook(() => useSearchFilter())
    act(() => result.current.markAsAd({ title: '신규키워드 포함 글', url: 'https://site.com/1' }))
    expect(result.current.filters.keywords['신규키워드']).toBeDefined()
    expect(result.current.filters.keywords['신규키워드'].count).toBe(1)
  })

  it('localStorage에 저장된다', () => {
    const { result } = renderHook(() => useSearchFilter())
    act(() => result.current.markAsAd({ title: '글 제목', url: 'https://spam.com/1' }))
    const saved = JSON.parse(localStorage.getItem('search-filters'))
    expect(saved.domains['spam.com'].count).toBe(1)
  })

  it('manual 도메인은 markAsAd를 호출해도 blocked 상태가 변하지 않는다', () => {
    const { result } = renderHook(() => useSearchFilter())
    act(() => result.current.addDomain('manual.com'))  // blocked:true, manual:true
    act(() => result.current.markAsAd({ title: '글', url: 'https://manual.com/1' }))
    expect(result.current.filters.domains['manual.com'].blocked).toBe(true)
    expect(result.current.filters.domains['manual.com'].manual).toBe(true)
  })
})

describe('markAsNormal', () => {
  it('도메인 count가 1 감소하고 0 미만이 되지 않는다', () => {
    const { result } = renderHook(() => useSearchFilter())
    act(() => result.current.markAsAd({ title: '글', url: 'https://site.com/1' }))
    act(() => result.current.markAsNormal({ title: '글', url: 'https://site.com/2' }))
    act(() => result.current.markAsNormal({ title: '글', url: 'https://site.com/3' }))
    expect(result.current.filters.domains['site.com'].count).toBe(0)
  })

  it('manual 도메인은 markAsNormal을 호출해도 count가 변하지 않는다', () => {
    const { result } = renderHook(() => useSearchFilter())
    act(() => result.current.addDomain('manual.com'))  // count: threshold(3)
    const countBefore = result.current.filters.domains['manual.com'].count
    act(() => result.current.markAsNormal({ title: '글', url: 'https://manual.com/1' }))
    expect(result.current.filters.domains['manual.com'].count).toBe(countBefore)
  })

  it('키워드 count가 1 감소하고 0 미만이 되지 않는다', () => {
    const { result } = renderHook(() => useSearchFilter())
    act(() => result.current.markAsAd({ title: '신규키워드 테스트', url: 'https://site.com/1' }))
    act(() => result.current.markAsNormal({ title: '신규키워드 테스트', url: 'https://site.com/2' }))
    act(() => result.current.markAsNormal({ title: '신규키워드 테스트', url: 'https://site.com/3' }))
    expect(result.current.filters.keywords['신규키워드'].count).toBe(0)
  })

  it('존재하지 않는 도메인에 markAsNormal을 호출해도 오류가 없다', () => {
    const { result } = renderHook(() => useSearchFilter())
    expect(() => {
      act(() => result.current.markAsNormal({ title: '글', url: 'https://unknown.com/1' }))
    }).not.toThrow()
    expect(result.current.filters.domains['unknown.com']).toBeUndefined()
  })
})

describe('addDomain / removeDomain', () => {
  it('addDomain은 manual:true로 즉시 차단된 도메인을 추가한다', () => {
    const { result } = renderHook(() => useSearchFilter())
    act(() => result.current.addDomain('badsite.com'))
    expect(result.current.filters.domains['badsite.com'].blocked).toBe(true)
    expect(result.current.filters.domains['badsite.com'].manual).toBe(true)
  })

  it('removeDomain은 해당 도메인 규칙을 삭제한다', () => {
    const { result } = renderHook(() => useSearchFilter())
    act(() => result.current.addDomain('badsite.com'))
    act(() => result.current.removeDomain('badsite.com'))
    expect(result.current.filters.domains['badsite.com']).toBeUndefined()
  })
})

describe('addKeyword / removeKeyword', () => {
  it('addKeyword는 manual:true로 즉시 차단된 키워드를 추가한다', () => {
    const { result } = renderHook(() => useSearchFilter())
    act(() => result.current.addKeyword('광고글'))
    expect(result.current.filters.keywords['광고글'].blocked).toBe(true)
    expect(result.current.filters.keywords['광고글'].manual).toBe(true)
  })

  it('removeKeyword는 해당 키워드 규칙을 삭제한다', () => {
    const { result } = renderHook(() => useSearchFilter())
    act(() => result.current.addKeyword('광고글'))
    act(() => result.current.removeKeyword('광고글'))
    expect(result.current.filters.keywords['광고글']).toBeUndefined()
  })
})

describe('updateThreshold', () => {
  it('threshold를 변경하고 localStorage에 저장한다', () => {
    const { result } = renderHook(() => useSearchFilter())
    act(() => result.current.updateThreshold(5))
    expect(result.current.filters.threshold).toBe(5)
    expect(JSON.parse(localStorage.getItem('search-filters')).threshold).toBe(5)
  })
})

describe('score', () => {
  it('필터 규칙에 따라 스팸 점수를 반환한다', () => {
    const { result } = renderHook(() => useSearchFilter())
    const { score, filtered } = result.current.score({ title: '협찬 리뷰 제품', url: 'https://normal.com' })
    expect(score).toBeGreaterThan(0)
    expect(typeof filtered).toBe('boolean')
  })
})
