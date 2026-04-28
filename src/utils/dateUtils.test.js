import { describe, it, expect, vi } from 'vitest'
import { toDateKey, formatDisplay, getWeekDates, getMonthGrid, isToday, isPast } from './dateUtils'

describe('toDateKey', () => {
  it('Date 객체를 YYYY-MM-DD 문자열로 변환한다', () => {
    const date = new Date(2026, 3, 28) // 4월 28일 (month는 0-indexed)
    expect(toDateKey(date)).toBe('2026-04-28')
  })
})

describe('formatDisplay', () => {
  it('날짜 키를 한국어 표시 형식으로 변환한다', () => {
    expect(formatDisplay('2026-04-28')).toMatch(/4월 28일/)
  })
})

describe('getWeekDates', () => {
  it('주어진 날짜가 포함된 월요일~일요일 7일을 반환한다', () => {
    const dates = getWeekDates('2026-04-28') // 화요일
    expect(dates).toHaveLength(7)
    expect(dates[0]).toBe('2026-04-27') // 월요일
    expect(dates[6]).toBe('2026-05-03') // 일요일
  })

  it('일요일이 포함된 주의 월요일~일요일을 반환한다', () => {
    const dates = getWeekDates('2026-05-03') // 일요일
    expect(dates).toHaveLength(7)
    expect(dates[0]).toBe('2026-04-27') // 월요일
    expect(dates[6]).toBe('2026-05-03') // 일요일
  })
})

describe('getMonthGrid', () => {
  it('달력 그리드용 날짜 배열(6주 42칸)을 반환한다', () => {
    const grid = getMonthGrid(2026, 3) // 4월 (0-indexed)
    expect(grid).toHaveLength(42)
    expect(grid.some(d => d === '2026-04-01')).toBe(true)
    expect(grid.some(d => d === '2026-04-30')).toBe(true)
  })

  it('그리드가 월요일로 시작하고 올바른 경계값을 포함한다', () => {
    const grid = getMonthGrid(2026, 3) // 4월 2026
    expect(grid[0]).toBe('2026-03-30') // 첫 월요일 (3월 30일)
    expect(grid[41]).toBe('2026-05-10') // 마지막 일요일
    // 순서 확인
    for (let i = 1; i < grid.length; i++) {
      expect(grid[i] > grid[i - 1]).toBe(true)
    }
  })
})

describe('isToday', () => {
  it('오늘 날짜 키를 true로 반환한다', () => {
    vi.setSystemTime(new Date(2026, 3, 28)) // 2026-04-28
    expect(isToday('2026-04-28')).toBe(true)
    vi.useRealTimers()
  })

  it('오늘이 아닌 날짜를 false로 반환한다', () => {
    vi.setSystemTime(new Date(2026, 3, 28))
    expect(isToday('2026-04-27')).toBe(false)
    vi.useRealTimers()
  })
})

describe('isPast', () => {
  it('오늘 이전 날짜를 true로 반환한다', () => {
    vi.setSystemTime(new Date(2026, 3, 28))
    expect(isPast('2026-04-27')).toBe(true)
    vi.useRealTimers()
  })

  it('오늘 날짜를 false로 반환한다 (오늘은 과거가 아님)', () => {
    vi.setSystemTime(new Date(2026, 3, 28))
    expect(isPast('2026-04-28')).toBe(false)
    vi.useRealTimers()
  })

  it('미래 날짜를 false로 반환한다', () => {
    vi.setSystemTime(new Date(2026, 3, 28))
    expect(isPast('2026-04-29')).toBe(false)
    vi.useRealTimers()
  })
})
