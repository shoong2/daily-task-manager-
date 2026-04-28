import { describe, it, expect } from 'vitest'
import { calcStreak } from './useStreak'

describe('calcStreak', () => {
  it('tasks가 비어있으면 스트릭은 0이다', () => {
    expect(calcStreak({}, '2026-04-28')).toBe(0)
  })

  it('어제 루틴을 완료했으면 스트릭은 1이다', () => {
    const tasks = {
      '2026-04-27': [{ id: 'r1', type: 'routine', done: true }],
    }
    expect(calcStreak(tasks, '2026-04-28')).toBe(1)
  })

  it('오늘 루틴도 완료했으면 스트릭에 포함된다', () => {
    const tasks = {
      '2026-04-27': [{ id: 'r1', type: 'routine', done: true }],
      '2026-04-28': [{ id: 'r1', type: 'routine', done: true }],
    }
    expect(calcStreak(tasks, '2026-04-28')).toBe(2)
  })

  it('루틴이 없는 날은 스트릭을 끊지 않는다', () => {
    const tasks = {
      '2026-04-26': [{ id: 'r1', type: 'routine', done: true }],
      '2026-04-27': [{ id: 't1', type: 'one-time', done: true }], // 루틴 없는 날
      '2026-04-28': [{ id: 'r1', type: 'routine', done: true }],
    }
    expect(calcStreak(tasks, '2026-04-28')).toBe(2)
  })

  it('어제 루틴을 하나도 완료 안했으면 스트릭은 1이다 (오늘만 카운트)', () => {
    const tasks = {
      '2026-04-26': [{ id: 'r1', type: 'routine', done: true }],
      '2026-04-27': [{ id: 'r1', type: 'routine', done: false }],
      '2026-04-28': [{ id: 'r1', type: 'routine', done: true }],
    }
    expect(calcStreak(tasks, '2026-04-28')).toBe(1)
  })

  it('7일 연속 루틴을 완료하면 스트릭은 7이다', () => {
    const tasks = {}
    for (let i = 0; i < 7; i++) {
      const date = new Date(2026, 3, 28 - i) // 4월 28일부터 역순
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      tasks[key] = [{ id: 'r1', type: 'routine', done: true }]
    }
    expect(calcStreak(tasks, '2026-04-28')).toBe(7)
  })
})
