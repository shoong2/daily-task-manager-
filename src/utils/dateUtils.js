export function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function today() {
  return toDateKey(new Date())
}

export function formatDisplay(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

export function getWeekDates(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay() // 0=일, 1=월 ... 6=토
  const monday = new Date(date)
  monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const cur = new Date(monday)
    cur.setDate(monday.getDate() + i)
    return toDateKey(cur)
  })
}

export function getMonthGrid(year, month) {
  // month: 0-indexed (0=1월)
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // 첫날의 요일 (월요일 시작: 0=월, 6=일)
  const startOffset = (firstDay.getDay() + 6) % 7

  const grid = []
  // 이전 달 날짜 채우기
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    grid.push(toDateKey(d))
  }
  // 이번 달 날짜
  for (let d = 1; d <= lastDay.getDate(); d++) {
    grid.push(toDateKey(new Date(year, month, d)))
  }
  // 다음 달 날짜로 42칸 채우기
  while (grid.length < 42) {
    const d = new Date(year, month + 1, grid.length - startOffset - lastDay.getDate() + 1)
    grid.push(toDateKey(d))
  }
  return grid
}

export function isToday(dateKey) {
  return dateKey === today()
}

export function isPast(dateKey) {
  return dateKey < today()
}
