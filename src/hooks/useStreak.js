import { useMemo } from 'react'
import { toDateKey } from '../utils/dateUtils'

export function calcStreak(allTasks, todayKey) {
  if (!allTasks) return 0
  let streak = 0
  const [y, m, d] = todayKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)

  for (let i = 0; i < 365; i++) {
    const dateKey = toDateKey(date)
    const tasks = allTasks[dateKey]

    if (!tasks) {
      // 오늘이 없는 건 아직 시작 안 한 것 — 어제부터 계속
      if (i === 0) {
        date.setDate(date.getDate() - 1)
        continue
      }
      break // 기록 없는 날 = 스트릭 종료
    }

    const routineTasks = tasks.filter(t => t.type === 'routine')

    if (routineTasks.length === 0) {
      // 루틴 없는 날 — 스트릭 유지, 넘어감
      date.setDate(date.getDate() - 1)
      continue
    }

    if (routineTasks.some(t => t.done)) {
      streak++
    } else {
      // 오늘은 아직 진행 중일 수 있으므로 꺾지 않음
      if (i === 0) {
        date.setDate(date.getDate() - 1)
        continue
      }
      break
    }

    date.setDate(date.getDate() - 1)
  }

  return streak
}

export function useStreak(allTasks, todayKey) {
  return useMemo(() => calcStreak(allTasks, todayKey), [allTasks, todayKey])
}
