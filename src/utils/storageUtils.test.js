import { describe, it, expect, beforeEach } from 'vitest'
import { getRoutines, setRoutines, getAllTasks, setAllTasks, getSearchFilters, setSearchFilters } from './storageUtils'

beforeEach(() => {
  localStorage.clear()
})

describe('getRoutines', () => {
  it('저장된 routines가 없으면 빈 배열을 반환한다', () => {
    expect(getRoutines()).toEqual([])
  })

  it('저장된 routines를 반환한다', () => {
    const routines = [{ id: 'r1', name: '운동하기' }]
    localStorage.setItem('routines', JSON.stringify(routines))
    expect(getRoutines()).toEqual(routines)
  })
})

describe('setRoutines', () => {
  it('routines를 localStorage에 저장한다', () => {
    const routines = [{ id: 'r1', name: '독서' }]
    setRoutines(routines)
    expect(JSON.parse(localStorage.getItem('routines'))).toEqual(routines)
  })
})

describe('getAllTasks / setAllTasks', () => {
  it('저장된 tasks가 없으면 빈 객체를 반환한다', () => {
    expect(getAllTasks()).toEqual({})
  })

  it('tasks를 저장하고 다시 읽을 수 있다', () => {
    const tasks = { '2026-04-28': [{ id: 't1', name: '운동', done: false, type: 'one-time' }] }
    setAllTasks(tasks)
    expect(getAllTasks()).toEqual(tasks)
  })
})

describe('getSearchFilters / setSearchFilters', () => {
  it('저장된 search-filters가 없으면 null을 반환한다', () => {
    expect(getSearchFilters()).toBeNull()
  })

  it('search-filters를 저장하고 다시 읽을 수 있다', () => {
    const filters = { domains: {}, keywords: { '협찬': { count: 3, blocked: true, manual: false } }, threshold: 3 }
    setSearchFilters(filters)
    expect(getSearchFilters()).toEqual(filters)
  })

  it('손상된 JSON이면 null을 반환한다', () => {
    localStorage.setItem('search-filters', 'invalid json{')
    expect(getSearchFilters()).toBeNull()
  })
})
