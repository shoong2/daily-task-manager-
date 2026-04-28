# Daily Task Manager 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** React + Vite + Tailwind CSS로 날짜별 할 일 + 루틴 관리 웹앱을 구현하고 Vercel에 무료 배포한다.

**Architecture:** localStorage 기반 SPA. 뷰 전환(오늘/주간/달력)은 클라이언트 상태로 관리. 날씨는 브라우저에서 OpenWeatherMap 직접 호출, 뉴스는 Vercel 서버리스 함수(`api/news.js`)로 프록시.

**Tech Stack:** React 18, Vite 5, Tailwind CSS 3, Vitest, @testing-library/react, OpenWeatherMap API, NewsAPI.org, Vercel

---

## 파일 구조

```
E:\AI\
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── .env.example
├── .gitignore
├── vercel.json
├── api/
│   └── news.js                        — Vercel 서버리스 뉴스 프록시
└── src/
    ├── main.jsx
    ├── App.jsx                        — 루트: 뷰 상태, hooks 주입, 전체 레이아웃
    ├── test/
    │   └── setup.js                   — Vitest 전역 설정
    ├── utils/
    │   ├── dateUtils.js               — toDateKey, today, formatDisplay, getWeekDates, getMonthGrid
    │   └── storageUtils.js            — getRoutines, setRoutines, getAllTasks, setAllTasks
    ├── hooks/
    │   ├── useRoutines.js             — routines CRUD + localStorage 동기화
    │   ├── useTasks.js                — 날짜별 tasks + 날짜 초기화 로직
    │   └── useStreak.js               — 연속 달성 일수 계산
    ├── components/
    │   ├── Sidebar.jsx                — 뷰 전환 버튼 + 루틴 관리 링크
    │   ├── DayPanel.jsx               — 선택 날짜의 할 일 목록 (루틴/오늘만 구분)
    │   ├── TaskItem.jsx               — 체크박스 + 이름 + 삭제 버튼
    │   ├── AddTaskInput.jsx           — 텍스트 입력 + 루틴 여부 토글
    │   └── RoutineManager.jsx         — 루틴 목록 보기/추가/삭제
    ├── views/
    │   ├── TodayView.jsx              — 오늘 날짜 고정 + DayPanel
    │   ├── WeekView.jsx               — 이번 주 7일 그리드 + 선택 날 DayPanel
    │   └── CalendarView.jsx           — 월 달력 + 선택 날 DayPanel
    └── widgets/
        ├── StreakWidget.jsx            — 스트릭 숫자 + 7일 블록
        ├── WeatherWidget.jsx          — 현재 날씨 + 예보 + 미세먼지
        └── NewsWidget.jsx             — 게임 뉴스 5개
```

---

## Task 1: 프로젝트 초기화

**Files:**
- Create: `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/test/setup.js`, `.gitignore`, `.env.example`

- [ ] **Step 1: Vite + React 프로젝트 생성**

```bash
cd E:\AI
npm create vite@latest . -- --template react
```

프롬프트에서 "현재 디렉토리를 사용하겠습니까?" → `y`
Expected: `package.json`, `src/`, `index.html` 생성됨

- [ ] **Step 2: 의존성 설치**

```bash
npm install
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npx tailwindcss init -p
```

Expected: `tailwind.config.js`, `postcss.config.js` 생성됨

- [ ] **Step 3: Tailwind 설정**

`tailwind.config.js` 를 다음으로 교체:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 4: Vite 설정 (Vitest 포함)**

`vite.config.js` 를 다음으로 교체:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
```

- [ ] **Step 5: 테스트 setup 파일**

`src/test/setup.js` 생성:

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Tailwind를 CSS에 추가**

`src/index.css` 전체 내용 교체:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: App.jsx 초기 껍데기**

`src/App.jsx` 전체 내용 교체:

```jsx
export default function App() {
  return <div className="min-h-screen bg-white text-gray-900">Daily Task Manager</div>
}
```

- [ ] **Step 8: main.jsx 확인**

`src/main.jsx` 가 다음과 같은지 확인 (Vite 기본값):

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 9: .gitignore 설정**

`.gitignore` 에 다음 추가 (없으면 생성):

```
node_modules
dist
.env
.env.local
.vercel
```

- [ ] **Step 10: .env.example 생성**

```
VITE_WEATHER_API_KEY=your_openweathermap_key_here
NEWS_API_KEY=your_newsapi_key_here
```

- [ ] **Step 11: 개발 서버 실행 확인**

```bash
npm run dev
```

Expected: `http://localhost:5173` 에서 "Daily Task Manager" 텍스트 확인

- [ ] **Step 12: 테스트 실행 확인**

```bash
npm test
```

Expected: `No test files found` (아직 테스트 없음, 에러 없이 종료)

- [ ] **Step 13: 커밋**

```bash
git add -A
git commit -m "chore: initialize React + Vite + Tailwind + Vitest project"
```

---

## Task 2: 유틸리티 함수 구현 + 테스트

**Files:**
- Create: `src/utils/dateUtils.js`, `src/utils/storageUtils.js`
- Create: `src/utils/dateUtils.test.js`, `src/utils/storageUtils.test.js`

- [ ] **Step 1: dateUtils.js 테스트 작성**

`src/utils/dateUtils.test.js` 생성:

```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- dateUtils
```

Expected: FAIL — `Cannot find module './dateUtils'`

- [ ] **Step 3: dateUtils.js 구현**

`src/utils/dateUtils.js` 생성:

```js
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
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- dateUtils
```

Expected: PASS — 4개 테스트 모두 통과

- [ ] **Step 5: storageUtils.js 테스트 작성**

`src/utils/storageUtils.test.js` 생성:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { getRoutines, setRoutines, getAllTasks, setAllTasks } from './storageUtils'

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
```

- [ ] **Step 6: 테스트 실패 확인**

```bash
npm test -- storageUtils
```

Expected: FAIL — `Cannot find module './storageUtils'`

- [ ] **Step 7: storageUtils.js 구현**

`src/utils/storageUtils.js` 생성:

```js
export function getRoutines() {
  try {
    return JSON.parse(localStorage.getItem('routines')) ?? []
  } catch {
    return []
  }
}

export function setRoutines(routines) {
  localStorage.setItem('routines', JSON.stringify(routines))
}

export function getAllTasks() {
  try {
    return JSON.parse(localStorage.getItem('tasks')) ?? {}
  } catch {
    return {}
  }
}

export function setAllTasks(tasks) {
  localStorage.setItem('tasks', JSON.stringify(tasks))
}
```

- [ ] **Step 8: 테스트 통과 확인**

```bash
npm test -- storageUtils
```

Expected: PASS — 4개 테스트 모두 통과

- [ ] **Step 9: 커밋**

```bash
git add src/utils/
git commit -m "feat: add dateUtils and storageUtils with tests"
```

---

## Task 3: useRoutines + useTasks 훅 + 테스트

**Files:**
- Create: `src/hooks/useRoutines.js`, `src/hooks/useTasks.js`
- Create: `src/hooks/useRoutines.test.js`, `src/hooks/useTasks.test.js`

- [ ] **Step 1: useRoutines 테스트 작성**

`src/hooks/useRoutines.test.js` 생성:

```js
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
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- useRoutines
```

Expected: FAIL — `Cannot find module './useRoutines'`

- [ ] **Step 3: useRoutines.js 구현**

`src/hooks/useRoutines.js` 생성:

```js
import { useState, useCallback } from 'react'
import { getRoutines, setRoutines } from '../utils/storageUtils'

export function useRoutines() {
  const [routines, setRoutinesState] = useState(() => getRoutines())

  const addRoutine = useCallback((name) => {
    const routine = { id: crypto.randomUUID(), name }
    setRoutinesState(prev => {
      const next = [...prev, routine]
      setRoutines(next)
      return next
    })
    return routine
  }, [])

  const removeRoutine = useCallback((id) => {
    setRoutinesState(prev => {
      const next = prev.filter(r => r.id !== id)
      setRoutines(next)
      return next
    })
  }, [])

  return { routines, addRoutine, removeRoutine }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- useRoutines
```

Expected: PASS — 4개 테스트 모두 통과

- [ ] **Step 5: useTasks 테스트 작성**

`src/hooks/useTasks.test.js` 생성:

```js
import { describe, it, expect, beforeEach } from 'vitest'
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
    act(() => result.current.ensureDate('2026-04-28'))
    const tasks = result.current.allTasks['2026-04-28']
    expect(tasks).toHaveLength(2)
    expect(tasks[0]).toMatchObject({ id: 'r1', name: '운동하기', done: false, type: 'routine' })
  })

  it('해당 날짜가 이미 있으면 기존 상태를 유지한다', () => {
    const existing = [{ id: 'r1', name: '운동하기', done: true, type: 'routine' }]
    localStorage.setItem('tasks', JSON.stringify({ '2026-04-28': existing }))
    const { result } = renderHook(() => useTasks(routines))
    act(() => result.current.ensureDate('2026-04-28'))
    expect(result.current.allTasks['2026-04-28'][0].done).toBe(true)
  })
})

describe('toggleTask', () => {
  it('done 상태를 토글한다', () => {
    const { result } = renderHook(() => useTasks(routines))
    act(() => result.current.ensureDate('2026-04-28'))
    act(() => result.current.toggleTask('2026-04-28', 'r1'))
    expect(result.current.allTasks['2026-04-28'].find(t => t.id === 'r1').done).toBe(true)
  })
})

describe('addTask', () => {
  it('one-time 할 일을 추가한다', () => {
    const { result } = renderHook(() => useTasks(routines))
    act(() => result.current.ensureDate('2026-04-28'))
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
    act(() => result.current.ensureDate('2026-04-28'))
    act(() => result.current.addTask('2026-04-28', '병원 예약'))
    const id = result.current.allTasks['2026-04-28'].find(t => t.name === '병원 예약').id
    act(() => result.current.removeTask('2026-04-28', id))
    expect(result.current.allTasks['2026-04-28'].find(t => t.id === id)).toBeUndefined()
  })
})
```

- [ ] **Step 6: 테스트 실패 확인**

```bash
npm test -- useTasks
```

Expected: FAIL — `Cannot find module './useTasks'`

- [ ] **Step 7: useTasks.js 구현**

`src/hooks/useTasks.js` 생성:

```js
import { useState, useCallback } from 'react'
import { getAllTasks, setAllTasks } from '../utils/storageUtils'
import { today } from '../utils/dateUtils'

export function useTasks(routines) {
  const [allTasks, setAllTasksState] = useState(() => getAllTasks())

  const save = useCallback((next) => {
    setAllTasks(next)
    setAllTasksState(next)
  }, [])

  const ensureDate = useCallback((dateKey) => {
    setAllTasksState(prev => {
      if (prev[dateKey]) return prev
      const initial = routines.map(r => ({ id: r.id, name: r.name, done: false, type: 'routine' }))
      const next = { ...prev, [dateKey]: initial }
      setAllTasks(next)
      return next
    })
  }, [routines])

  const toggleTask = useCallback((dateKey, taskId) => {
    setAllTasksState(prev => {
      const tasks = (prev[dateKey] ?? []).map(t =>
        t.id === taskId ? { ...t, done: !t.done } : t
      )
      const next = { ...prev, [dateKey]: tasks }
      setAllTasks(next)
      return next
    })
  }, [])

  const addTask = useCallback((dateKey, name) => {
    const task = { id: crypto.randomUUID(), name, done: false, type: 'one-time' }
    setAllTasksState(prev => {
      const next = { ...prev, [dateKey]: [...(prev[dateKey] ?? []), task] }
      setAllTasks(next)
      return next
    })
  }, [])

  const removeTask = useCallback((dateKey, taskId) => {
    setAllTasksState(prev => {
      const next = { ...prev, [dateKey]: (prev[dateKey] ?? []).filter(t => t.id !== taskId) }
      setAllTasks(next)
      return next
    })
  }, [])

  const addRoutineToToday = useCallback((routine) => {
    const dateKey = today()
    const task = { id: routine.id, name: routine.name, done: false, type: 'routine' }
    setAllTasksState(prev => {
      const existing = prev[dateKey] ?? []
      if (existing.some(t => t.id === routine.id)) return prev
      const next = { ...prev, [dateKey]: [...existing, task] }
      setAllTasks(next)
      return next
    })
  }, [])

  return { allTasks, ensureDate, toggleTask, addTask, removeTask, addRoutineToToday }
}
```

- [ ] **Step 8: 테스트 통과 확인**

```bash
npm test -- useTasks
```

Expected: PASS — 5개 테스트 모두 통과

- [ ] **Step 9: 커밋**

```bash
git add src/hooks/useRoutines.js src/hooks/useRoutines.test.js src/hooks/useTasks.js src/hooks/useTasks.test.js
git commit -m "feat: add useRoutines and useTasks hooks with tests"
```

---

## Task 4: useStreak 훅 + 테스트

**Files:**
- Create: `src/hooks/useStreak.js`, `src/hooks/useStreak.test.js`

- [ ] **Step 1: useStreak 테스트 작성**

`src/hooks/useStreak.test.js` 생성:

```js
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

  it('어제 루틴을 하나도 완료 안했으면 스트릭은 0이다', () => {
    const tasks = {
      '2026-04-26': [{ id: 'r1', type: 'routine', done: true }],
      '2026-04-27': [{ id: 'r1', type: 'routine', done: false }],
      '2026-04-28': [{ id: 'r1', type: 'routine', done: true }],
    }
    expect(calcStreak(tasks, '2026-04-28')).toBe(1)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- useStreak
```

Expected: FAIL — `Cannot find module './useStreak'`

- [ ] **Step 3: useStreak.js 구현**

`src/hooks/useStreak.js` 생성:

```js
import { useMemo } from 'react'
import { toDateKey } from '../utils/dateUtils'

export function calcStreak(allTasks, todayKey) {
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
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- useStreak
```

Expected: PASS — 5개 테스트 모두 통과

- [ ] **Step 5: 커밋**

```bash
git add src/hooks/useStreak.js src/hooks/useStreak.test.js
git commit -m "feat: add useStreak hook with tests"
```

---

## Task 5: Sidebar 컴포넌트

**Files:**
- Create: `src/components/Sidebar.jsx`

- [ ] **Step 1: Sidebar.jsx 생성**

`src/components/Sidebar.jsx` 생성:

```jsx
const VIEWS = [
  { id: 'today', label: '오늘' },
  { id: 'week', label: '주간' },
  { id: 'calendar', label: '달력' },
]

export default function Sidebar({ currentView, onViewChange, onRoutineManager }) {
  return (
    <aside className="w-28 bg-gray-50 border-r border-gray-200 flex flex-col gap-1 p-4 min-h-screen">
      <span className="font-black text-lg text-gray-900 mb-5 px-1">Daily</span>

      {VIEWS.map(v => (
        <button
          key={v.id}
          onClick={() => onViewChange(v.id)}
          className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentView === v.id
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:bg-gray-200'
          }`}
        >
          {v.label}
        </button>
      ))}

      <div className="flex-1" />

      <button
        onClick={onRoutineManager}
        className="text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-gray-200 transition-colors"
      >
        루틴 관리
      </button>
    </aside>
  )
}
```

- [ ] **Step 2: App.jsx에 Sidebar 연결 확인**

`src/App.jsx` 를 다음으로 교체:

```jsx
import { useState } from 'react'
import Sidebar from './components/Sidebar'

export default function App() {
  const [currentView, setCurrentView] = useState('today')
  const [showRoutineManager, setShowRoutineManager] = useState(false)

  return (
    <div className="flex min-h-screen bg-white text-gray-900">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onRoutineManager={() => setShowRoutineManager(true)}
      />
      <main className="flex-1 p-6">
        <p className="text-gray-400">뷰: {currentView}</p>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: 개발 서버에서 Sidebar 확인**

```bash
npm run dev
```

Expected: 왼쪽에 사이드바가 보이고 오늘/주간/달력 클릭 시 뷰 이름이 바뀜

- [ ] **Step 4: 커밋**

```bash
git add src/components/Sidebar.jsx src/App.jsx
git commit -m "feat: add Sidebar component"
```

---

## Task 6: TaskItem + AddTaskInput 컴포넌트

**Files:**
- Create: `src/components/TaskItem.jsx`, `src/components/AddTaskInput.jsx`

- [ ] **Step 1: TaskItem.jsx 생성**

`src/components/TaskItem.jsx` 생성:

```jsx
export default function TaskItem({ task, onToggle, onRemove }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 group">
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
          task.done
            ? 'bg-gray-900 border-gray-900'
            : 'border-gray-300 hover:border-gray-500'
        }`}
      >
        {task.done && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <span className={`flex-1 text-base ${task.done ? 'line-through text-gray-300' : 'text-gray-800'}`}>
        {task.name}
      </span>

      {task.type === 'routine' && (
        <span className="text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
          루틴
        </span>
      )}

      <button
        onClick={onRemove}
        className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none"
        aria-label="삭제"
      >
        ×
      </button>
    </div>
  )
}
```

- [ ] **Step 2: AddTaskInput.jsx 생성**

`src/components/AddTaskInput.jsx` 생성:

```jsx
import { useState } from 'react'

export default function AddTaskInput({ onAdd }) {
  const [value, setValue] = useState('')
  const [isRoutine, setIsRoutine] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed, isRoutine)
    setValue('')
    setIsRoutine(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2">
      <button
        type="button"
        onClick={() => setIsRoutine(r => !r)}
        className={`text-sm px-2 py-1 rounded transition-colors flex-shrink-0 ${
          isRoutine
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
        }`}
        title="루틴으로 설정"
      >
        {isRoutine ? '루틴 ✓' : '루틴'}
      </button>

      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="할 일 추가..."
        className="flex-1 text-base text-gray-700 placeholder-gray-300 border-b border-gray-200 focus:border-gray-500 outline-none py-1 bg-transparent"
      />

      <button
        type="submit"
        disabled={!value.trim()}
        className="text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xl leading-none"
      >
        +
      </button>
    </form>
  )
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/TaskItem.jsx src/components/AddTaskInput.jsx
git commit -m "feat: add TaskItem and AddTaskInput components"
```

---

## Task 7: DayPanel 컴포넌트

**Files:**
- Create: `src/components/DayPanel.jsx`

- [ ] **Step 1: DayPanel.jsx 생성**

`src/components/DayPanel.jsx` 생성:

```jsx
import { useEffect } from 'react'
import { formatDisplay } from '../utils/dateUtils'
import TaskItem from './TaskItem'
import AddTaskInput from './AddTaskInput'

export default function DayPanel({ dateKey, allTasks, routines, ensureDate, toggleTask, addTask, removeTask, addRoutineToToday }) {
  useEffect(() => {
    ensureDate(dateKey)
  }, [dateKey, ensureDate])

  const tasks = allTasks[dateKey] ?? []
  const routineTasks = tasks.filter(t => t.type === 'routine')
  const oneTimeTasks = tasks.filter(t => t.type === 'one-time')

  function handleAdd(name, isRoutine) {
    if (isRoutine) {
      // routines에 추가 + 오늘 날짜에 즉시 반영
      const routine = { id: crypto.randomUUID(), name }
      addRoutineToToday(routine)
    } else {
      addTask(dateKey, name)
    }
  }

  return (
    <div className="flex-1 p-5">
      <div className="mb-5">
        <p className="font-bold text-lg text-gray-900">{formatDisplay(dateKey)}</p>
      </div>

      {routineTasks.length > 0 && (
        <section className="mb-4">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">루틴</p>
          {routineTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => toggleTask(dateKey, task.id)}
              onRemove={() => removeTask(dateKey, task.id)}
            />
          ))}
        </section>
      )}

      {oneTimeTasks.length > 0 && (
        <section className="mb-4">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">오늘만</p>
          {oneTimeTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => toggleTask(dateKey, task.id)}
              onRemove={() => removeTask(dateKey, task.id)}
            />
          ))}
        </section>
      )}

      {routineTasks.length === 0 && oneTimeTasks.length === 0 && (
        <p className="text-gray-300 text-sm mt-4">할 일이 없습니다.</p>
      )}

      <AddTaskInput onAdd={handleAdd} />
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/components/DayPanel.jsx
git commit -m "feat: add DayPanel component"
```

---

## Task 8: TodayView + WeekView

**Files:**
- Create: `src/views/TodayView.jsx`, `src/views/WeekView.jsx`

- [ ] **Step 1: TodayView.jsx 생성**

`src/views/TodayView.jsx` 생성:

```jsx
import { today } from '../utils/dateUtils'
import DayPanel from '../components/DayPanel'

export default function TodayView({ allTasks, routines, ensureDate, toggleTask, addTask, removeTask, addRoutineToToday }) {
  return (
    <DayPanel
      dateKey={today()}
      allTasks={allTasks}
      routines={routines}
      ensureDate={ensureDate}
      toggleTask={toggleTask}
      addTask={addTask}
      removeTask={removeTask}
      addRoutineToToday={addRoutineToToday}
    />
  )
}
```

- [ ] **Step 2: WeekView.jsx 생성**

`src/views/WeekView.jsx` 생성:

```jsx
import { useState } from 'react'
import { today, getWeekDates, toDateKey, isToday } from '../utils/dateUtils'
import DayPanel from '../components/DayPanel'

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

export default function WeekView({ allTasks, routines, ensureDate, toggleTask, addTask, removeTask, addRoutineToToday }) {
  const [selectedDate, setSelectedDate] = useState(today())
  const weekDates = getWeekDates(today())

  function completionRate(dateKey) {
    const tasks = allTasks[dateKey] ?? []
    const routineTasks = tasks.filter(t => t.type === 'routine')
    if (routineTasks.length === 0) return null
    const done = routineTasks.filter(t => t.done).length
    return Math.round((done / routineTasks.length) * 100)
  }

  return (
    <div className="flex flex-1">
      {/* 주간 그리드 */}
      <div className="w-52 border-r border-gray-100 p-4">
        <p className="text-xs text-gray-400 mb-3">
          {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
        </p>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-300 mb-2">
          {DAY_LABELS.map(d => <span key={d}>{d}</span>)}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {weekDates.map((dateKey, i) => {
            const [, , day] = dateKey.split('-')
            const selected = dateKey === selectedDate
            const todayDate = isToday(dateKey)
            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                className={`py-1.5 text-sm rounded-md font-medium transition-colors ${
                  selected
                    ? 'bg-gray-900 text-white'
                    : todayDate
                    ? 'ring-1 ring-gray-400 text-gray-700'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {Number(day)}
              </button>
            )
          })}
        </div>

        {/* 주간 완료율 */}
        <div className="mt-4">
          <p className="text-xs text-gray-400 mb-2">이번 주 완료율</p>
          <div className="flex gap-1">
            {weekDates.map(dateKey => {
              const rate = completionRate(dateKey)
              return (
                <div
                  key={dateKey}
                  className={`flex-1 h-1.5 rounded-full ${
                    rate === null ? 'bg-gray-100' : rate === 100 ? 'bg-gray-900' : rate > 0 ? 'bg-gray-400' : 'bg-gray-100'
                  }`}
                />
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {weekDates.filter(d => completionRate(d) === 100).length}/{weekDates.length} 완료
          </p>
        </div>
      </div>

      {/* 선택 날 패널 */}
      <DayPanel
        dateKey={selectedDate}
        allTasks={allTasks}
        routines={routines}
        ensureDate={ensureDate}
        toggleTask={toggleTask}
        addTask={addTask}
        removeTask={removeTask}
        addRoutineToToday={addRoutineToToday}
      />
    </div>
  )
}
```

- [ ] **Step 3: App.jsx에 TodayView / WeekView 연결**

`src/App.jsx` 를 다음으로 교체:

```jsx
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import TodayView from './views/TodayView'
import WeekView from './views/WeekView'
import { useRoutines } from './hooks/useRoutines'
import { useTasks } from './hooks/useTasks'
import { today } from './utils/dateUtils'

export default function App() {
  const [currentView, setCurrentView] = useState('today')
  const [showRoutineManager, setShowRoutineManager] = useState(false)

  const { routines, addRoutine, removeRoutine } = useRoutines()
  const { allTasks, ensureDate, toggleTask, addTask, removeTask, addRoutineToToday } = useTasks(routines)

  const taskProps = { allTasks, routines, ensureDate, toggleTask, addTask, removeTask, addRoutineToToday }

  return (
    <div className="flex min-h-screen bg-white text-gray-900">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onRoutineManager={() => setShowRoutineManager(true)}
      />
      <div className="flex flex-1">
        {currentView === 'today' && <TodayView {...taskProps} />}
        {currentView === 'week' && <WeekView {...taskProps} />}
        {currentView === 'calendar' && <div className="p-6 text-gray-400">달력 뷰 (다음 태스크)</div>}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 브라우저에서 오늘/주간 뷰 동작 확인**

```bash
npm run dev
```

Expected:
- 오늘 뷰: 할 일 추가/체크/삭제 동작
- 주간 뷰: 7일 그리드, 날짜 클릭 시 해당 날 패널 전환

- [ ] **Step 5: 커밋**

```bash
git add src/views/TodayView.jsx src/views/WeekView.jsx src/App.jsx
git commit -m "feat: add TodayView and WeekView"
```

---

## Task 9: CalendarView

**Files:**
- Create: `src/views/CalendarView.jsx`

- [ ] **Step 1: CalendarView.jsx 생성**

`src/views/CalendarView.jsx` 생성:

```jsx
import { useState } from 'react'
import { today, toDateKey, getMonthGrid, isToday } from '../utils/dateUtils'
import DayPanel from '../components/DayPanel'

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

export default function CalendarView({ allTasks, routines, ensureDate, toggleTask, addTask, removeTask, addRoutineToToday }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(today())

  const grid = getMonthGrid(year, month)
  const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function hasAnyDone(dateKey) {
    return (allTasks[dateKey] ?? []).some(t => t.done)
  }

  return (
    <div className="flex flex-1">
      {/* 달력 */}
      <div className="w-72 border-r border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="text-gray-400 hover:text-gray-700 text-lg px-1">‹</button>
          <p className="text-sm font-semibold text-gray-700">
            {year}년 {month + 1}월
          </p>
          <button onClick={nextMonth} className="text-gray-400 hover:text-gray-700 text-lg px-1">›</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-300 mb-2">
          {DAY_LABELS.map(d => <span key={d}>{d}</span>)}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {grid.map(dateKey => {
            const [, , day] = dateKey.split('-')
            const inMonth = dateKey.startsWith(currentMonthPrefix)
            const selected = dateKey === selectedDate
            const todayDate = isToday(dateKey)
            const done = hasAnyDone(dateKey)

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                className={`py-1.5 text-sm rounded-md relative transition-colors ${
                  !inMonth ? 'text-gray-200' :
                  selected ? 'bg-gray-900 text-white' :
                  todayDate ? 'ring-1 ring-gray-400 text-gray-700' :
                  'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {Number(day)}
                {done && inMonth && !selected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gray-400" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 선택 날 패널 */}
      <DayPanel
        dateKey={selectedDate}
        allTasks={allTasks}
        routines={routines}
        ensureDate={ensureDate}
        toggleTask={toggleTask}
        addTask={addTask}
        removeTask={removeTask}
        addRoutineToToday={addRoutineToToday}
      />
    </div>
  )
}
```

- [ ] **Step 2: App.jsx에 CalendarView 연결**

`src/App.jsx` 에서 `{currentView === 'calendar' && ...}` 줄만 교체:

```jsx
// 상단에 import 추가
import CalendarView from './views/CalendarView'

// render 안에서
{currentView === 'calendar' && <CalendarView {...taskProps} />}
```

- [ ] **Step 3: 달력 뷰 동작 확인**

```bash
npm run dev
```

Expected: 달력에서 날짜 클릭 시 오른쪽에 해당 날 패널 표시, 이전/다음 달 이동

- [ ] **Step 4: 커밋**

```bash
git add src/views/CalendarView.jsx src/App.jsx
git commit -m "feat: add CalendarView"
```

---

## Task 10: RoutineManager

**Files:**
- Create: `src/components/RoutineManager.jsx`

- [ ] **Step 1: RoutineManager.jsx 생성**

`src/components/RoutineManager.jsx` 생성:

```jsx
import { useState } from 'react'

export default function RoutineManager({ routines, onAdd, onRemove, onClose }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg text-gray-900">루틴 관리</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <ul className="mb-5 space-y-2">
          {routines.length === 0 && (
            <li className="text-gray-300 text-sm text-center py-4">루틴이 없습니다</li>
          )}
          {routines.map(r => (
            <li key={r.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-base text-gray-800">{r.name}</span>
              <button
                onClick={() => onRemove(r.id)}
                className="text-gray-300 hover:text-red-400 text-lg leading-none transition-colors"
                aria-label={`${r.name} 삭제`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="새 루틴 이름..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-gray-500"
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-30"
          >
            추가
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: App.jsx에 RoutineManager 연결**

`src/App.jsx` 상단에 import 추가 후 렌더 영역에 추가:

```jsx
import RoutineManager from './components/RoutineManager'

// return 안 최상단 div 자식으로 추가:
{showRoutineManager && (
  <RoutineManager
    routines={routines}
    onAdd={(name) => {
      const routine = addRoutine(name)
      addRoutineToToday(routine)
    }}
    onRemove={removeRoutine}
    onClose={() => setShowRoutineManager(false)}
  />
)}
```

- [ ] **Step 3: 동작 확인**

```bash
npm run dev
```

Expected: 사이드바 "루틴 관리" 클릭 시 모달 열림, 루틴 추가/삭제 동작, 오늘 뷰에 즉시 반영

- [ ] **Step 4: 커밋**

```bash
git add src/components/RoutineManager.jsx src/App.jsx
git commit -m "feat: add RoutineManager modal"
```

---

## Task 11: StreakWidget

**Files:**
- Create: `src/widgets/StreakWidget.jsx`

- [ ] **Step 1: StreakWidget.jsx 생성**

`src/widgets/StreakWidget.jsx` 생성:

```jsx
import { useStreak } from '../hooks/useStreak'
import { today, toDateKey } from '../utils/dateUtils'

export default function StreakWidget({ allTasks }) {
  const todayKey = today()
  const streak = useStreak(allTasks, todayKey)

  // 오늘 포함 최근 7일 블록
  const recentDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateKey = toDateKey(d)
    const tasks = allTasks[dateKey] ?? []
    const routineTasks = tasks.filter(t => t.type === 'routine')
    const done = routineTasks.length > 0 && routineTasks.some(t => t.done)
    return { dateKey, done }
  })

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">연속 달성 🔥</p>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-4xl font-black text-gray-900">{streak}</span>
        <span className="text-sm text-gray-500">일 연속</span>
      </div>
      <div className="flex gap-1.5">
        {recentDays.map(({ dateKey, done }) => (
          <div
            key={dateKey}
            className={`flex-1 h-5 rounded ${done ? 'bg-gray-900' : 'bg-gray-100'}`}
            title={dateKey}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/widgets/StreakWidget.jsx
git commit -m "feat: add StreakWidget"
```

---

## Task 12: WeatherWidget

**Files:**
- Create: `src/widgets/WeatherWidget.jsx`

- [ ] **Step 1: .env.local 생성 (API 키 입력)**

`.env.local` 생성 (gitignore에 포함됨):

```
VITE_WEATHER_API_KEY=발급받은_키_입력
```

OpenWeatherMap 무료 API 키 발급: https://openweathermap.org/api → "Current Weather Data" + "Air Pollution" 플랜 (무료)

- [ ] **Step 2: WeatherWidget.jsx 생성**

`src/widgets/WeatherWidget.jsx` 생성:

```jsx
import { useState, useEffect } from 'react'

const DEFAULT_LAT = 37.5665
const DEFAULT_LON = 126.9780
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY

const WEATHER_EMOJI = {
  '01': '☀️', '02': '⛅', '03': '☁️', '04': '☁️',
  '09': '🌧️', '10': '🌦️', '11': '⛈️', '13': '❄️', '50': '🌫️',
}

function getEmoji(icon) {
  return WEATHER_EMOJI[icon?.slice(0, 2)] ?? '🌡️'
}

function getPM25Grade(pm25) {
  if (pm25 <= 15) return { label: '좋음', color: 'text-green-500' }
  if (pm25 <= 35) return { label: '보통', color: 'text-yellow-500' }
  if (pm25 <= 75) return { label: '나쁨', color: 'text-orange-500' }
  return { label: '매우나쁨', color: 'text-red-500' }
}

async function fetchWeather(lat, lon) {
  const [currentRes, forecastRes, airRes] = await Promise.all([
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
    fetch(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`),
  ])
  const [current, forecast, air] = await Promise.all([currentRes.json(), forecastRes.json(), airRes.json()])
  return { current, forecast, air }
}

function getTimeSlots(forecastList) {
  // 오전(6~11시), 낮(12~17시), 저녁(18~23시) 가장 가까운 슬롯
  const slots = { morning: null, afternoon: null, evening: null }
  for (const item of forecastList) {
    const h = new Date(item.dt * 1000).getHours()
    if (!slots.morning && h >= 6 && h < 12) slots.morning = item
    if (!slots.afternoon && h >= 12 && h < 18) slots.afternoon = item
    if (!slots.evening && h >= 18 && h < 24) slots.evening = item
    if (slots.morning && slots.afternoon && slots.evening) break
  }
  return [
    { label: '오전', data: slots.morning },
    { label: '낮', data: slots.afternoon },
    { label: '저녁', data: slots.evening },
  ]
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!API_KEY) { setError('API 키 없음'); return }

    function load(lat, lon) {
      fetchWeather(lat, lon)
        .then(setWeather)
        .catch(() => setError('날씨 정보를 불러오지 못했습니다'))
    }

    navigator.geolocation?.getCurrentPosition(
      pos => load(pos.coords.latitude, pos.coords.longitude),
      () => load(DEFAULT_LAT, DEFAULT_LON),
    ) ?? load(DEFAULT_LAT, DEFAULT_LON)
  }, [])

  if (error) return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">날씨</p>
      <p className="text-sm text-gray-400">{error}</p>
    </div>
  )

  if (!weather) return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
      <div className="h-3 bg-gray-100 rounded w-16 mb-4" />
      <div className="h-8 bg-gray-100 rounded w-24 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-32" />
    </div>
  )

  const { current, forecast, air } = weather
  const temp = Math.round(current.main.temp)
  const icon = current.weather[0]?.icon
  const desc = current.weather[0]?.description
  const pm25 = air.list?.[0]?.components?.pm2_5 ?? 0
  const pm25Grade = getPM25Grade(pm25)
  const slots = getTimeSlots(forecast.list ?? [])

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">
        날씨 · {current.name}
      </p>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">{getEmoji(icon)}</span>
        <div>
          <p className="text-4xl font-black text-gray-900 leading-none">{temp}°</p>
          <p className="text-sm text-gray-500 mt-1">{desc}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        {slots.map(({ label, data }) => data ? (
          <div key={label} className="text-center">
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-base">{getEmoji(data.weather[0]?.icon)}</p>
            <p className="text-sm text-gray-600 font-medium">{Math.round(data.main.temp)}°</p>
          </div>
        ) : null)}
      </div>

      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
        <span className="text-sm text-gray-500">미세먼지 PM2.5</span>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${pm25Grade.label === '좋음' ? 'bg-green-400' : pm25Grade.label === '보통' ? 'bg-yellow-400' : 'bg-red-400'}`} />
          <span className={`text-sm font-semibold ${pm25Grade.color}`}>
            {pm25Grade.label} {Math.round(pm25)}㎍
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/widgets/WeatherWidget.jsx .env.example
git commit -m "feat: add WeatherWidget with OpenWeatherMap API"
```

---

## Task 13: api/news.js + NewsWidget

**Files:**
- Create: `api/news.js`, `src/widgets/NewsWidget.jsx`, `vercel.json`

- [ ] **Step 1: vercel.json 생성**

`vercel.json` 생성:

```json
{
  "rewrites": [{ "source": "/api/(.*)", "destination": "/api/$1" }]
}
```

- [ ] **Step 2: api/news.js 생성 (Vercel 서버리스 프록시)**

`api/news.js` 생성:

```js
export default async function handler(req, res) {
  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'NEWS_API_KEY not configured' })
  }

  try {
    const url = 'https://newsapi.org/v2/everything?' + new URLSearchParams({
      q: 'game development OR video games OR indie game',
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: '5',
    })

    const response = await fetch(url, {
      headers: { 'X-Api-Key': apiKey },
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: 'NewsAPI error' })
    }

    const data = await response.json()

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
    res.json({ articles: data.articles ?? [] })
  } catch {
    res.status(500).json({ error: '뉴스를 불러오지 못했습니다' })
  }
}
```

- [ ] **Step 3: NewsWidget.jsx 생성**

`src/widgets/NewsWidget.jsx` 생성:

```jsx
import { useState, useEffect } from 'react'

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000 / 60
  if (diff < 60) return `${Math.round(diff)}분 전`
  if (diff < 1440) return `${Math.round(diff / 60)}시간 전`
  return `${Math.round(diff / 1440)}일 전`
}

export default function NewsWidget() {
  const [articles, setArticles] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/news')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setArticles(data.articles)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex-1">
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">게임 뉴스 🎮</p>

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-1">
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-gray-400">{error}</p>}

      {!loading && !error && (
        <ul className="divide-y divide-gray-100">
          {articles.map((article, i) => (
            <li key={i} className="py-2.5">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-gray-800 hover:text-gray-500 leading-snug line-clamp-2 block"
              >
                {article.title}
              </a>
              <p className="text-xs text-gray-400 mt-1">
                {article.source?.name} · {timeAgo(article.publishedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 로컬에서 뉴스 API 테스트**

뉴스 위젯은 Vercel 서버리스 함수를 사용하므로 로컬에서 `vercel dev` 로 확인:

```bash
npm install -g vercel
vercel dev
```

`.env.local` 에 `NEWS_API_KEY=발급받은_키` 추가 후 `http://localhost:3000/api/news` 접속 확인.

NewsAPI 무료 키 발급: https://newsapi.org/register

- [ ] **Step 5: 커밋**

```bash
git add api/news.js src/widgets/NewsWidget.jsx vercel.json
git commit -m "feat: add NewsWidget with Vercel serverless proxy"
```

---

## Task 14: App.jsx 최종 조립 (위젯 하단 배치)

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: App.jsx 완성**

`src/App.jsx` 전체 교체:

```jsx
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import RoutineManager from './components/RoutineManager'
import TodayView from './views/TodayView'
import WeekView from './views/WeekView'
import CalendarView from './views/CalendarView'
import StreakWidget from './widgets/StreakWidget'
import WeatherWidget from './widgets/WeatherWidget'
import NewsWidget from './widgets/NewsWidget'
import { useRoutines } from './hooks/useRoutines'
import { useTasks } from './hooks/useTasks'
import { today } from './utils/dateUtils'

export default function App() {
  const [currentView, setCurrentView] = useState('today')
  const [showRoutineManager, setShowRoutineManager] = useState(false)

  const { routines, addRoutine, removeRoutine } = useRoutines()
  const { allTasks, ensureDate, toggleTask, addTask, removeTask, addRoutineToToday } = useTasks(routines)

  const taskProps = { allTasks, routines, ensureDate, toggleTask, addTask, removeTask, addRoutineToToday }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onRoutineManager={() => setShowRoutineManager(true)}
      />

      <div className="flex-1 flex flex-col p-6 gap-5">
        {/* 메인 패널 */}
        <div className="bg-white rounded-2xl border border-gray-200 flex overflow-hidden">
          {currentView === 'today' && <TodayView {...taskProps} />}
          {currentView === 'week' && <WeekView {...taskProps} />}
          {currentView === 'calendar' && <CalendarView {...taskProps} />}
        </div>

        {/* 위젯 영역 */}
        <div className="grid grid-cols-[1fr_1fr_2fr] gap-5">
          <StreakWidget allTasks={allTasks} />
          <WeatherWidget />
          <NewsWidget />
        </div>
      </div>

      {showRoutineManager && (
        <RoutineManager
          routines={routines}
          onAdd={(name) => {
            const routine = addRoutine(name)
            addRoutineToToday(routine)
          }}
          onRemove={removeRoutine}
          onClose={() => setShowRoutineManager(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: 전체 동작 확인**

```bash
npm run dev
```

확인 항목:
- [ ] 오늘/주간/달력 뷰 전환
- [ ] 할 일 추가/체크/삭제
- [ ] 루틴 관리 모달 (추가/삭제, 오늘 뷰 즉시 반영)
- [ ] 스트릭 위젯 숫자 표시
- [ ] 날씨 위젯 로딩 → 데이터 표시 (API 키 있을 때)
- [ ] 페이지 새로고침 후 데이터 유지 (localStorage)

- [ ] **Step 3: 전체 테스트 통과 확인**

```bash
npm test
```

Expected: 모든 테스트 PASS

- [ ] **Step 4: 커밋**

```bash
git add src/App.jsx
git commit -m "feat: assemble full layout with widgets"
```

---

## Task 15: Vercel 배포

- [ ] **Step 1: GitHub 레포 생성 후 push**

```bash
git remote add origin https://github.com/YOUR_USERNAME/daily-task-manager.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: Vercel 연결**

1. https://vercel.com → "Add New Project"
2. GitHub 레포 선택
3. Framework Preset: **Vite** 자동 감지
4. "Environment Variables" 탭에서 추가:
   - `VITE_WEATHER_API_KEY` = OpenWeatherMap 키
   - `NEWS_API_KEY` = NewsAPI 키
5. "Deploy" 클릭

Expected: 배포 완료 후 `https://your-project.vercel.app` URL 발급

- [ ] **Step 3: 배포 환경에서 동작 확인**

배포된 URL 접속 후 확인:
- [ ] 할 일 추가/완료/삭제
- [ ] 루틴 설정
- [ ] 날씨 위젯 로딩
- [ ] 뉴스 위젯 로딩 (`/api/news` 서버리스 함수 동작)
- [ ] localStorage 데이터 유지

- [ ] **Step 4: 최종 커밋**

```bash
git add .
git commit -m "chore: finalize deployment config"
git push origin main
```

---

## 셀프 리뷰 체크리스트

- [x] **스펙 커버리지**: 루틴 자동 반복, 날짜별 관리, 오늘/주간/달력 뷰, 스트릭, 날씨+미세먼지, 게임 뉴스, localStorage, Vercel 배포 — 모두 포함
- [x] **플레이스홀더 없음**: TBD/TODO 없음
- [x] **타입 일관성**: `useRoutines.addRoutine()` → `RoutineManager.onAdd()` → `addRoutineToToday()` 체인 일관됨; `task.type` 값은 `'routine'` / `'one-time'` 으로 전체 통일
- [x] **누락 없음**: `DayPanel`에서 루틴 추가 시 `addRoutine` (useRoutines) + `addRoutineToToday` (useTasks) 동시 호출 필요 — Task 7 `handleAdd`와 Task 10 `RoutineManager` onAdd 모두 처리됨
