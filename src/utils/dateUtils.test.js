import { describe, it, expect } from 'vitest'
import { toDateKey, formatDisplay, getWeekDates, getMonthGrid } from './dateUtils'

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
})

describe('getMonthGrid', () => {
  it('달력 그리드용 날짜 배열(6주 42칸)을 반환한다', () => {
    const grid = getMonthGrid(2026, 3) // 4월 (0-indexed)
    expect(grid).toHaveLength(42)
    expect(grid.some(d => d === '2026-04-01')).toBe(true)
    expect(grid.some(d => d === '2026-04-30')).toBe(true)
  })
})
