# 청약·취업 위젯 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메인 대시보드 맨 아래에 경기도 LH 임대(`HousingWidget`)와 잡아바 채용(`JobsWidget`) 위젯 두 개를 추가한다. 각각 페이지네이션·필터(카테고리/탭)·새로고침을 갖춘다.

**Architecture:** Vercel serverless 함수 2개(`/api/housing`, `/api/jobs`)가 외부 OpenAPI를 호출·정규화·캐싱한다. 위젯은 자체 키를 모르고 정규화된 응답만 다룬다. 키워드 검색은 잡아바 응답을 서버리스에서 OR 매칭(`PBANC_CONT`/`ENTRPRS_NM`/`RECRUT_FIELD_NM`) 후 반환한다.

**Tech Stack:** React 19, Vite 8, Tailwind 3, Vitest, @testing-library/react, Vercel Serverless.

---

## File Structure

**Create:**

- `api/housing.js` — LH 임대주택 서버리스
- `api/jobs.js` — 잡아바 서버리스 (옵션 `?keyword=`)
- `src/widgets/Pagination.jsx` — 공용 페이지 네비
- `src/widgets/Pagination.test.jsx`
- `src/widgets/HousingWidget.jsx`
- `src/widgets/HousingWidget.test.jsx`
- `src/widgets/JobsWidget.jsx`
- `src/widgets/JobsWidget.test.jsx`
- `src/hooks/useJobKeywords.js`
- `src/hooks/useJobKeywords.test.js`

**Modify:**

- `src/utils/storageUtils.js` — `getJobKeywords` / `setJobKeywords` 추가
- `src/App.jsx` — 위젯 그리드 아래 새 행 추가

---

## Task 1: storage util + `useJobKeywords` 훅

**Files:**
- Modify: `src/utils/storageUtils.js`
- Create: `src/hooks/useJobKeywords.js`
- Test: `src/hooks/useJobKeywords.test.js`

- [ ] **Step 1: storage util 추가**

`src/utils/storageUtils.js` 파일 맨 아래에 다음 추가:

```js
export function getJobKeywords() {
  try {
    return JSON.parse(localStorage.getItem('job-keywords')) ?? []
  } catch {
    return []
  }
}

export function setJobKeywords(keywords) {
  try {
    localStorage.setItem('job-keywords', JSON.stringify(keywords))
  } catch {}
}
```

- [ ] **Step 2: 실패 테스트 작성** — `src/hooks/useJobKeywords.test.js`

```js
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
```

- [ ] **Step 3: 테스트 실행해서 실패 확인**

Run: `npm test -- src/hooks/useJobKeywords.test.js`
Expected: FAIL — `useJobKeywords` not found.

- [ ] **Step 4: 훅 구현** — `src/hooks/useJobKeywords.js`

```js
import { useState, useCallback } from 'react'
import { getJobKeywords, setJobKeywords } from '../utils/storageUtils'

export function useJobKeywords() {
  const [keywords, setKeywordsState] = useState(() => getJobKeywords())

  const addKeyword = useCallback((text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setKeywordsState(prev => {
      if (prev.includes(trimmed)) return prev
      const next = [...prev, trimmed]
      setJobKeywords(next)
      return next
    })
  }, [])

  const removeKeyword = useCallback((text) => {
    setKeywordsState(prev => {
      const next = prev.filter(k => k !== text)
      setJobKeywords(next)
      return next
    })
  }, [])

  return { keywords, addKeyword, removeKeyword }
}
```

- [ ] **Step 5: 테스트 실행해서 통과 확인**

Run: `npm test -- src/hooks/useJobKeywords.test.js`
Expected: PASS, 7 tests.

- [ ] **Step 6: 커밋**

```bash
git add src/utils/storageUtils.js src/hooks/useJobKeywords.js src/hooks/useJobKeywords.test.js
git commit -m "feat: add useJobKeywords hook for keyword storage"
```

---

## Task 2: `Pagination` 공용 컴포넌트

**Files:**
- Create: `src/widgets/Pagination.jsx`
- Test: `src/widgets/Pagination.test.jsx`

- [ ] **Step 1: 실패 테스트 작성** — `src/widgets/Pagination.test.jsx`

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Pagination from './Pagination'

describe('Pagination', () => {
  it('totalPages가 1 이하면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<Pagination page={0} totalPages={1} onChange={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('현재 페이지와 전체 페이지를 표시한다', () => {
    render(<Pagination page={2} totalPages={5} onChange={() => {}} />)
    expect(screen.getByText('3 / 5')).toBeInTheDocument()
  })

  it('다음 버튼 클릭 시 onChange(page+1)을 호출한다', async () => {
    const onChange = vi.fn()
    render(<Pagination page={0} totalPages={3} onChange={onChange} />)
    await userEvent.click(screen.getByLabelText('다음 페이지'))
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('이전 버튼 클릭 시 onChange(page-1)을 호출한다', async () => {
    const onChange = vi.fn()
    render(<Pagination page={2} totalPages={3} onChange={onChange} />)
    await userEvent.click(screen.getByLabelText('이전 페이지'))
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('첫 페이지에서 이전 버튼은 disabled이다', () => {
    render(<Pagination page={0} totalPages={3} onChange={() => {}} />)
    expect(screen.getByLabelText('이전 페이지')).toBeDisabled()
  })

  it('마지막 페이지에서 다음 버튼은 disabled이다', () => {
    render(<Pagination page={2} totalPages={3} onChange={() => {}} />)
    expect(screen.getByLabelText('다음 페이지')).toBeDisabled()
  })
})
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npm test -- src/widgets/Pagination.test.jsx`
Expected: FAIL — `Pagination` not found.

- [ ] **Step 3: 구현** — `src/widgets/Pagination.jsx`

```jsx
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const isFirst = page === 0
  const isLast = page === totalPages - 1

  return (
    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 mt-1.5">
      <button
        type="button"
        aria-label="이전 페이지"
        onClick={() => onChange(page - 1)}
        disabled={isFirst}
        className="w-6 h-6 border border-gray-200 rounded-md bg-white text-xs text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
      >
        ‹
      </button>
      <span className="text-xs text-gray-500 tabular-nums">{page + 1} / {totalPages}</span>
      <button
        type="button"
        aria-label="다음 페이지"
        onClick={() => onChange(page + 1)}
        disabled={isLast}
        className="w-6 h-6 border border-gray-200 rounded-md bg-white text-xs text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
      >
        ›
      </button>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 실행해서 통과 확인**

Run: `npm test -- src/widgets/Pagination.test.jsx`
Expected: PASS, 6 tests.

- [ ] **Step 5: 커밋**

```bash
git add src/widgets/Pagination.jsx src/widgets/Pagination.test.jsx
git commit -m "feat: add Pagination component"
```

---

## Task 3: `api/housing.js` — LH 임대 서버리스 함수

**Files:**
- Create: `api/housing.js`
- Test: `api/housing.test.js`

- [ ] **Step 1: 실패 테스트 작성** — `api/housing.test.js`

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import handler from './housing'

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) { this.statusCode = code; return this },
    json(data) { this.body = data; return this },
    setHeader(key, value) { this.headers[key] = value },
  }
  return res
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  process.env.DATA_GO_KR_KEY = 'test-key'
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.DATA_GO_KR_KEY
})

const sampleResponse = [{
  dsSch: [{ PG_SZ: '50', PAGE: '1', CNP_CD: '41' }],
  dsList: [
    {
      PAN_ID: '111',
      PAN_NM: '파주운정3 영구임대주택 모집',
      AIS_TP_CD_NM: '영구임대',
      UPP_AIS_TP_NM: '임대주택',
      CLSG_DT: '2026.07.06',
      PAN_SS: '공고중',
      DTL_URL: 'https://example.com/111',
    },
    {
      PAN_ID: '222',
      PAN_NM: '화성동탄2 토지 공급',
      AIS_TP_CD_NM: '토지',
      UPP_AIS_TP_NM: '토지',
      CLSG_DT: '2026.07.07',
      PAN_SS: '공고중',
      DTL_URL: 'https://example.com/222',
    },
    {
      PAN_ID: '333',
      PAN_NM: '수원 매입임대 모집',
      AIS_TP_CD_NM: '매입임대',
      UPP_AIS_TP_NM: '임대주택',
      CLSG_DT: '2026.07.10',
      PAN_SS: '공고중',
      DTL_URL: 'https://example.com/333',
    },
  ],
  resHeader: [{ RS_DTTM: '20260622073125', SS_CODE: 'Y' }],
}]

it('임대주택이 아닌 항목은 필터링한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => sampleResponse })
  const res = mockRes()
  await handler({ query: {} }, res)
  expect(res.body.items).toHaveLength(2)
  expect(res.body.items.find(i => i.id === '222')).toBeUndefined()
})

it('영구임대를 공공임대 type으로 매핑한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => sampleResponse })
  const res = mockRes()
  await handler({ query: {} }, res)
  const item = res.body.items.find(i => i.id === '111')
  expect(item.type).toBe('공공임대')
  expect(item.title).toBe('파주운정3 영구임대주택 모집')
  expect(item.deadline).toBe('2026-07-06')
  expect(item.url).toBe('https://example.com/111')
})

it('매입임대를 매입임대 type으로 매핑한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => sampleResponse })
  const res = mockRes()
  await handler({ query: {} }, res)
  expect(res.body.items.find(i => i.id === '333').type).toBe('매입임대')
})

it('키 미설정 시 명확한 에러 반환', async () => {
  delete process.env.DATA_GO_KR_KEY
  const res = mockRes()
  await handler({ query: {} }, res)
  expect(res.body.error).toBe('API key missing')
  expect(res.body.items).toEqual([])
})

it('SS_CODE !== Y면 에러로 처리한다', async () => {
  const bad = [{ ...sampleResponse[0], resHeader: [{ SS_CODE: 'N' }] }]
  fetch.mockResolvedValue({ ok: true, json: async () => bad })
  const res = mockRes()
  await handler({ query: {} }, res)
  expect(res.body.error).toContain('SS_CODE')
  expect(res.body.items).toEqual([])
})

it('fetch 실패 시 에러 반환', async () => {
  fetch.mockRejectedValue(new Error('network'))
  const res = mockRes()
  await handler({ query: {} }, res)
  expect(res.body.error).toBeTruthy()
  expect(res.body.items).toEqual([])
})

it('CNP_CD=41 파라미터로 호출한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => sampleResponse })
  const res = mockRes()
  await handler({ query: {} }, res)
  const url = fetch.mock.calls[0][0]
  expect(url).toContain('CNP_CD=41')
  expect(url).toContain('serviceKey=test-key')
})
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npm test -- api/housing.test.js`
Expected: FAIL — `./housing` not found.

- [ ] **Step 3: 핸들러 구현** — `api/housing.js`

```js
const ENDPOINT = 'https://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1'

function mapType(name) {
  if (!name) return '기타'
  if (name.includes('매입임대')) return '매입임대'
  if (name.includes('행복주택')) return '행복주택'
  if (name.includes('영구임대') || name.includes('국민임대') || name.includes('공공임대')) return '공공임대'
  return '기타'
}

function formatDeadline(dotted) {
  if (!dotted || typeof dotted !== 'string') return ''
  return dotted.replace(/\./g, '-')
}

export default async function handler(req, res) {
  const apiKey = process.env.DATA_GO_KR_KEY
  if (!apiKey) {
    return res.status(200).json({ items: [], error: 'API key missing' })
  }

  try {
    const url = ENDPOINT + '?' + new URLSearchParams({
      serviceKey: apiKey,
      CNP_CD: '41',
      PG_SZ: '50',
      PAGE: '1',
    })

    const response = await fetch(url)
    if (!response.ok) {
      return res.status(200).json({ items: [], error: `LH API ${response.status}` })
    }

    const data = await response.json()
    const root = Array.isArray(data) ? data[0] : null
    if (!root) {
      return res.status(200).json({ items: [], error: 'unexpected response shape' })
    }

    const ssCode = root.resHeader?.[0]?.SS_CODE
    if (ssCode !== 'Y') {
      return res.status(200).json({ items: [], error: `LH SS_CODE=${ssCode}` })
    }

    const items = (root.dsList ?? [])
      .filter(row => row.UPP_AIS_TP_NM === '임대주택')
      .map(row => ({
        id: row.PAN_ID,
        title: row.PAN_NM,
        type: mapType(row.AIS_TP_CD_NM),
        deadline: formatDeadline(row.CLSG_DT),
        status: row.PAN_SS,
        url: row.DTL_URL,
      }))

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')
    res.status(200).json({ items, error: null })
  } catch (e) {
    res.status(200).json({ items: [], error: e?.message ?? 'unknown error' })
  }
}
```

- [ ] **Step 4: 테스트 실행해서 통과 확인**

Run: `npm test -- api/housing.test.js`
Expected: PASS, 7 tests.

- [ ] **Step 5: 커밋**

```bash
git add api/housing.js api/housing.test.js
git commit -m "feat: add /api/housing endpoint for Gyeonggi LH leases"
```

---

## Task 4: `HousingWidget` — 청약 위젯

**Files:**
- Create: `src/widgets/HousingWidget.jsx`
- Test: `src/widgets/HousingWidget.test.jsx`

- [ ] **Step 1: 실패 테스트 작성** — `src/widgets/HousingWidget.test.jsx`

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HousingWidget from './HousingWidget'

const sample = {
  items: [
    { id: '1', title: '파주 영구임대 모집', type: '공공임대', deadline: '2026-07-06', status: '공고중', url: 'https://a/1' },
    { id: '2', title: '수원 매입임대 모집', type: '매입임대', deadline: '2026-07-10', status: '공고중', url: 'https://a/2' },
    { id: '3', title: '화성 행복주택 1', type: '행복주택', deadline: '2026-07-12', status: '공고중', url: 'https://a/3' },
    { id: '4', title: '화성 행복주택 2', type: '행복주택', deadline: '2026-07-15', status: '공고중', url: 'https://a/4' },
    { id: '5', title: '화성 행복주택 3', type: '행복주택', deadline: '2026-07-18', status: '공고중', url: 'https://a/5' },
    { id: '6', title: '화성 행복주택 4', type: '행복주택', deadline: '2026-07-20', status: '공고중', url: 'https://a/6' },
  ],
  error: null,
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

it('로딩 중이면 skeleton을 표시한다', () => {
  fetch.mockReturnValue(new Promise(() => {}))
  const { container } = render(<HousingWidget />)
  expect(container.querySelector('.animate-pulse')).toBeTruthy()
})

it('데이터를 받아 리스트를 그린다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => sample })
  render(<HousingWidget />)
  await waitFor(() => expect(screen.getByText('파주 영구임대 모집')).toBeInTheDocument())
})

it('각 항목은 type · 접수 ~deadline 부제목을 가진다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => sample })
  render(<HousingWidget />)
  await waitFor(() => expect(screen.getByText(/공공임대.*2026-07-06/)).toBeInTheDocument())
})

it('카테고리 칩 클릭 시 해당 type만 표시한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => sample })
  render(<HousingWidget />)
  await waitFor(() => screen.getByText('파주 영구임대 모집'))
  await userEvent.click(screen.getByRole('button', { name: '매입임대' }))
  expect(screen.queryByText('파주 영구임대 모집')).not.toBeInTheDocument()
  expect(screen.getByText('수원 매입임대 모집')).toBeInTheDocument()
})

it('카테고리 변경 시 page가 0으로 리셋된다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => sample })
  render(<HousingWidget />)
  await waitFor(() => screen.getByText('파주 영구임대 모집'))
  // 전체에서 6건 → 2페이지. 다음 페이지로 이동
  await userEvent.click(screen.getByLabelText('다음 페이지'))
  expect(screen.getByText('2 / 2')).toBeInTheDocument()
  // 행복주택 클릭 → 4건 (1페이지) → page=0 reset → Pagination null
  await userEvent.click(screen.getByRole('button', { name: '행복주택' }))
  expect(screen.queryByText('2 / 2')).not.toBeInTheDocument()
})

it('5건 초과면 페이지네이션이 보인다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => sample })
  render(<HousingWidget />)
  await waitFor(() => expect(screen.getByText('1 / 2')).toBeInTheDocument())
})

it('에러 발생 시 메시지를 표시한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ items: [], error: '서버 오류' }) })
  render(<HousingWidget />)
  await waitFor(() => expect(screen.getByText(/불러올 수 없습니다/)).toBeInTheDocument())
})

it('빈 결과면 안내 메시지를 표시한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ items: [], error: null }) })
  render(<HousingWidget />)
  await waitFor(() => expect(screen.getByText('공고가 없습니다')).toBeInTheDocument())
})
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npm test -- src/widgets/HousingWidget.test.jsx`
Expected: FAIL — `HousingWidget` not found.

- [ ] **Step 3: 구현** — `src/widgets/HousingWidget.jsx`

```jsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import Pagination from './Pagination'

const CATEGORIES = ['전체', '공공임대', '매입임대', '행복주택']
const PAGE_SIZE = 5

export default function HousingWidget() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [category, setCategory] = useState('전체')
  const [page, setPage] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch('/api/housing')
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
          setItems([])
        } else {
          setItems(data.items ?? [])
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    return category === '전체' ? items : items.filter(i => i.type === category)
  }, [items, category])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleCategoryChange = (c) => {
    setCategory(c)
    setPage(0)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest text-gray-400">경기도 임대주택 🏠</p>
        <button
          type="button"
          aria-label="새로고침"
          onClick={load}
          className="text-xs text-gray-300 hover:text-gray-500"
        >↻</button>
      </div>

      <div className="flex gap-1.5 mb-3.5 flex-wrap">
        {CATEGORIES.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => handleCategoryChange(c)}
            className={`px-2.5 py-1 text-xs rounded-full ${
              c === category ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >{c}</button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse flex-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-1">
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-gray-400 flex-1">데이터를 불러올 수 없습니다 ({error})</p>
      )}

      {!loading && !error && visible.length === 0 && (
        <p className="text-sm text-gray-400 flex-1">공고가 없습니다</p>
      )}

      {!loading && !error && visible.length > 0 && (
        <ul className="border-t border-gray-100 flex-1">
          {visible.map(item => (
            <li key={item.id} className="py-2.5 border-b border-gray-100 last:border-b-0">
              <a href={item.url} target="_blank" rel="noopener noreferrer"
                className="text-sm font-medium text-gray-800 hover:text-gray-500 leading-snug block">
                {item.title}
              </a>
              <p className="text-xs text-gray-400 mt-0.5">
                {item.type} · 접수 ~{item.deadline}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  )
}
```

- [ ] **Step 4: 테스트 실행해서 통과 확인**

Run: `npm test -- src/widgets/HousingWidget.test.jsx`
Expected: PASS, 8 tests.

- [ ] **Step 5: 커밋**

```bash
git add src/widgets/HousingWidget.jsx src/widgets/HousingWidget.test.jsx
git commit -m "feat: add HousingWidget with category filter and pagination"
```

---

## Task 5: `api/jobs.js` — 잡아바 서버리스 함수

**Files:**
- Create: `api/jobs.js`
- Test: `api/jobs.test.js`

- [ ] **Step 1: 실패 테스트 작성** — `api/jobs.test.js`

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import handler from './jobs'

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) { this.statusCode = code; return this },
    json(data) { this.body = data; return this },
    setHeader(key, value) { this.headers[key] = value },
  }
  return res
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  process.env.GG_DATA_KEY = 'test-key'
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.GG_DATA_KEY
})

const sampleRow = (override = {}) => ({
  ENTRPRS_NM: '회사A',
  PBANC_CONT: '백엔드 개발자 모집',
  PBANC_FORM_DIV: '정규직',
  WORK_REGION_CONT: '용인시',
  RECRUT_FIELD_NM: 'IT개발',
  RCPT_END_DE: '20260630',
  URL: 'https://jobaba.example/1',
  ...override,
})

const wrapResponse = (rows) => ({
  GGJOBABARECRUSTM: [
    { head: [{ list_total_count: rows.length }, { RESULT: { CODE: 'INFO-000', MESSAGE: 'OK' } }] },
    { row: rows },
  ],
})

it('User-Agent 헤더를 포함해 호출한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => wrapResponse([sampleRow()]) })
  const res = mockRes()
  await handler({ query: {} }, res)
  const opts = fetch.mock.calls[0][1]
  expect(opts.headers['User-Agent']).toMatch(/Mozilla/)
})

it('필드를 정규화해서 반환한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => wrapResponse([sampleRow()]) })
  const res = mockRes()
  await handler({ query: {} }, res)
  const item = res.body.items[0]
  expect(item.title).toBe('백엔드 개발자 모집')
  expect(item.organization).toBe('회사A')
  expect(item.employmentType).toBe('정규직')
  expect(item.region).toBe('용인시')
  expect(item.deadline).toBe('2026-06-30')
  expect(item.url).toBe('https://jobaba.example/1')
})

it('키워드 없을 때 pSize=30로 호출한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => wrapResponse([sampleRow()]) })
  const res = mockRes()
  await handler({ query: {} }, res)
  expect(fetch.mock.calls[0][0]).toContain('pSize=30')
})

it('키워드 있을 때 pSize=200로 호출한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => wrapResponse([sampleRow()]) })
  const res = mockRes()
  await handler({ query: { keyword: 'React' } }, res)
  expect(fetch.mock.calls[0][0]).toContain('pSize=200')
})

it('키워드 매칭은 PBANC_CONT를 검사한다', async () => {
  const rows = [
    sampleRow({ URL: 'a', PBANC_CONT: 'React 개발자' }),
    sampleRow({ URL: 'b', PBANC_CONT: '회계 담당자', RECRUT_FIELD_NM: '회계' }),
  ]
  fetch.mockResolvedValue({ ok: true, json: async () => wrapResponse(rows) })
  const res = mockRes()
  await handler({ query: { keyword: 'React' } }, res)
  expect(res.body.items).toHaveLength(1)
  expect(res.body.items[0].url).toBe('a')
})

it('키워드 매칭은 ENTRPRS_NM도 검사한다', async () => {
  const rows = [
    sampleRow({ URL: 'a', ENTRPRS_NM: 'Unity Korea', PBANC_CONT: '직원 모집' }),
    sampleRow({ URL: 'b', ENTRPRS_NM: '한국에듀', PBANC_CONT: '직원 모집' }),
  ]
  fetch.mockResolvedValue({ ok: true, json: async () => wrapResponse(rows) })
  const res = mockRes()
  await handler({ query: { keyword: 'Unity' } }, res)
  expect(res.body.items).toHaveLength(1)
  expect(res.body.items[0].url).toBe('a')
})

it('키워드 매칭은 RECRUT_FIELD_NM도 검사한다', async () => {
  const rows = [
    sampleRow({ URL: 'a', RECRUT_FIELD_NM: 'IT개발' }),
    sampleRow({ URL: 'b', RECRUT_FIELD_NM: '판매' }),
  ]
  fetch.mockResolvedValue({ ok: true, json: async () => wrapResponse(rows) })
  const res = mockRes()
  await handler({ query: { keyword: 'IT' } }, res)
  expect(res.body.items.map(i => i.url)).toEqual(['a'])
})

it('키워드 매칭은 대소문자를 무시한다', async () => {
  const rows = [sampleRow({ URL: 'a', PBANC_CONT: 'react developer' })]
  fetch.mockResolvedValue({ ok: true, json: async () => wrapResponse(rows) })
  const res = mockRes()
  await handler({ query: { keyword: 'React' } }, res)
  expect(res.body.items).toHaveLength(1)
})

it('매칭 결과는 최대 30건', async () => {
  const rows = Array.from({ length: 50 }, (_, i) => sampleRow({ URL: `u${i}`, PBANC_CONT: 'React 매칭' }))
  fetch.mockResolvedValue({ ok: true, json: async () => wrapResponse(rows) })
  const res = mockRes()
  await handler({ query: { keyword: 'React' } }, res)
  expect(res.body.items).toHaveLength(30)
})

it('키 미설정 시 명확한 에러 반환', async () => {
  delete process.env.GG_DATA_KEY
  const res = mockRes()
  await handler({ query: {} }, res)
  expect(res.body.error).toBe('API key missing')
  expect(res.body.items).toEqual([])
})

it('RESULT.CODE !== INFO-000 이면 에러로 처리한다', async () => {
  const bad = {
    GGJOBABARECRUSTM: [
      { head: [{ list_total_count: 0 }, { RESULT: { CODE: 'ERROR-300', MESSAGE: '인증오류' } }] },
    ],
  }
  fetch.mockResolvedValue({ ok: true, json: async () => bad })
  const res = mockRes()
  await handler({ query: {} }, res)
  expect(res.body.error).toContain('ERROR-300')
  expect(res.body.items).toEqual([])
})

it('fetch 실패 시 에러 반환', async () => {
  fetch.mockRejectedValue(new Error('network'))
  const res = mockRes()
  await handler({ query: {} }, res)
  expect(res.body.error).toBeTruthy()
  expect(res.body.items).toEqual([])
})
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npm test -- api/jobs.test.js`
Expected: FAIL — `./jobs` not found.

- [ ] **Step 3: 핸들러 구현** — `api/jobs.js`

```js
const ENDPOINT = 'https://openapi.gg.go.kr/GGJOBABARECRUSTM'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
const MAX_RESULTS = 30

function formatDeadline(raw) {
  if (!raw || typeof raw !== 'string' || raw.length !== 8) return raw ?? ''
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
}

function matchesKeyword(row, keyword) {
  const needle = keyword.toLowerCase()
  const fields = [row.PBANC_CONT, row.ENTRPRS_NM, row.RECRUT_FIELD_NM]
  return fields.some(f => typeof f === 'string' && f.toLowerCase().includes(needle))
}

function normalize(row) {
  return {
    id: row.URL,
    title: row.PBANC_CONT,
    organization: row.ENTRPRS_NM,
    employmentType: row.PBANC_FORM_DIV,
    region: row.WORK_REGION_CONT ?? null,
    deadline: formatDeadline(row.RCPT_END_DE),
    url: row.URL,
  }
}

export default async function handler(req, res) {
  const apiKey = process.env.GG_DATA_KEY
  if (!apiKey) {
    return res.status(200).json({ items: [], error: 'API key missing' })
  }

  const keyword = req.query?.keyword?.trim()
  const pSize = keyword ? '200' : '30'

  try {
    const url = ENDPOINT + '?' + new URLSearchParams({
      KEY: apiKey,
      Type: 'json',
      pIndex: '1',
      pSize,
    })

    const response = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!response.ok) {
      return res.status(200).json({ items: [], error: `Jobaba API ${response.status}` })
    }

    const data = await response.json()
    const root = data?.GGJOBABARECRUSTM
    if (!Array.isArray(root)) {
      return res.status(200).json({ items: [], error: 'unexpected response shape' })
    }

    const code = root[0]?.head?.find(h => h.RESULT)?.RESULT?.CODE
    if (code && code !== 'INFO-000') {
      const message = root[0].head.find(h => h.RESULT)?.RESULT?.MESSAGE ?? code
      return res.status(200).json({ items: [], error: `${code}: ${message}` })
    }

    const rows = root[1]?.row ?? []
    const matched = keyword ? rows.filter(r => matchesKeyword(r, keyword)) : rows
    const items = matched.slice(0, MAX_RESULTS).map(normalize)

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')
    res.status(200).json({ items, error: null })
  } catch (e) {
    res.status(200).json({ items: [], error: e?.message ?? 'unknown error' })
  }
}
```

- [ ] **Step 4: 테스트 실행해서 통과 확인**

Run: `npm test -- api/jobs.test.js`
Expected: PASS, 12 tests.

- [ ] **Step 5: 커밋**

```bash
git add api/jobs.js api/jobs.test.js
git commit -m "feat: add /api/jobs endpoint for Jobaba (Gyeonggi jobs)"
```

---

## Task 6: `JobsWidget` — 전체 탭

**Files:**
- Create: `src/widgets/JobsWidget.jsx`
- Test: `src/widgets/JobsWidget.test.jsx`

- [ ] **Step 1: 실패 테스트 작성** — `src/widgets/JobsWidget.test.jsx`

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JobsWidget from './JobsWidget'

const allSample = {
  items: [
    { id: 'a1', title: '백엔드 개발자', organization: '회사A', employmentType: '정규직', region: '용인시', deadline: '2026-07-01', url: 'https://a/1' },
    { id: 'a2', title: '프론트엔드 개발자', organization: '회사B', employmentType: '계약직', region: '수원시', deadline: '2026-07-05', url: 'https://a/2' },
  ],
  error: null,
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

it('초기 마운트 시 /api/jobs를 호출한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => allSample })
  render(<JobsWidget />)
  await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/jobs'))
})

it('전체 탭이 기본으로 활성화된다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => allSample })
  render(<JobsWidget />)
  await waitFor(() => screen.getByText('백엔드 개발자'))
  const tab = screen.getByRole('button', { name: '전체' })
  expect(tab).toHaveAttribute('aria-selected', 'true')
})

it('항목은 회사·지역·고용형태·마감일을 표시한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => allSample })
  render(<JobsWidget />)
  await waitFor(() => expect(screen.getByText(/회사A.*용인시.*정규직.*2026-07-01/)).toBeInTheDocument())
})

it('에러 응답 시 메시지를 표시한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ items: [], error: '서버 오류' }) })
  render(<JobsWidget />)
  await waitFor(() => expect(screen.getByText(/불러올 수 없습니다/)).toBeInTheDocument())
})

it('빈 결과면 안내 메시지를 표시한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ items: [], error: null }) })
  render(<JobsWidget />)
  await waitFor(() => expect(screen.getByText('공고가 없습니다')).toBeInTheDocument())
})
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npm test -- src/widgets/JobsWidget.test.jsx`
Expected: FAIL — `JobsWidget` not found.

- [ ] **Step 3: 최소 구현 (전체 탭만)** — `src/widgets/JobsWidget.jsx`

```jsx
import { useEffect, useState, useCallback } from 'react'
import Pagination from './Pagination'

const PAGE_SIZE = 5

function JobItem({ item }) {
  return (
    <li className="py-2.5 border-b border-gray-100 last:border-b-0">
      <a href={item.url} target="_blank" rel="noopener noreferrer"
        className="text-sm font-medium text-gray-800 hover:text-gray-500 leading-snug block">
        {item.title}
      </a>
      <p className="text-xs text-gray-400 mt-0.5">
        {[item.organization, item.region, item.employmentType, `~${item.deadline}`]
          .filter(Boolean).join(' · ')}
      </p>
    </li>
  )
}

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse flex-1">
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-1">
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  )
}

export default function JobsWidget() {
  const [tab, setTab] = useState('all')
  const [data, setData] = useState({ all: null, keyword: null })
  const [loading, setLoading] = useState({ all: false, keyword: false })
  const [error, setError] = useState({ all: null, keyword: null })
  const [page, setPage] = useState({ all: 0, keyword: 0 })

  const fetchAll = useCallback(async () => {
    setLoading(s => ({ ...s, all: true }))
    setError(s => ({ ...s, all: null }))
    try {
      const r = await fetch('/api/jobs')
      const d = await r.json()
      if (d.error) {
        setError(s => ({ ...s, all: d.error }))
        setData(s => ({ ...s, all: [] }))
      } else {
        setData(s => ({ ...s, all: d.items ?? [] }))
      }
    } catch (e) {
      setError(s => ({ ...s, all: e.message }))
      setData(s => ({ ...s, all: [] }))
    } finally {
      setLoading(s => ({ ...s, all: false }))
    }
  }, [])

  useEffect(() => {
    if (tab === 'all' && data.all === null && !loading.all) fetchAll()
  }, [tab, data.all, loading.all, fetchAll])

  const items = data[tab] ?? []
  const currentPage = page[tab]
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const visible = items.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  const handlePage = (p) => setPage(s => ({ ...s, [tab]: p }))
  const handleRefresh = () => {
    setData(s => ({ ...s, [tab]: null }))
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest text-gray-400">채용공고 💼</p>
        <button
          type="button"
          aria-label="새로고침"
          onClick={handleRefresh}
          className="text-xs text-gray-300 hover:text-gray-500"
        >↻</button>
      </div>

      <div className="flex gap-3.5 border-b border-gray-200 mb-2.5">
        {[{ id: 'all', label: '전체' }].map(t => (
          <button
            key={t.id}
            type="button"
            role="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`text-xs pb-2 -mb-px ${
              tab === t.id ? 'font-semibold text-gray-800 border-b-2 border-gray-800' : 'text-gray-400'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {loading[tab] && <Skeleton />}

      {!loading[tab] && error[tab] && (
        <p className="text-sm text-gray-400 flex-1">데이터를 불러올 수 없습니다 ({error[tab]})</p>
      )}

      {!loading[tab] && !error[tab] && visible.length === 0 && (
        <p className="text-sm text-gray-400 flex-1">공고가 없습니다</p>
      )}

      {!loading[tab] && !error[tab] && visible.length > 0 && (
        <ul className="flex-1">
          {visible.map(item => <JobItem key={item.id} item={item} />)}
        </ul>
      )}

      <Pagination page={currentPage} totalPages={totalPages} onChange={handlePage} />
    </div>
  )
}
```

- [ ] **Step 4: 테스트 실행해서 통과 확인**

Run: `npm test -- src/widgets/JobsWidget.test.jsx`
Expected: PASS, 5 tests.

- [ ] **Step 5: 커밋**

```bash
git add src/widgets/JobsWidget.jsx src/widgets/JobsWidget.test.jsx
git commit -m "feat: add JobsWidget with 전체 tab"
```

---

## Task 7: `JobsWidget` — 키워드 검색 탭 추가

**Files:**
- Modify: `src/widgets/JobsWidget.jsx`
- Modify: `src/widgets/JobsWidget.test.jsx`

- [ ] **Step 1: 키워드 탭 테스트 추가** — `src/widgets/JobsWidget.test.jsx` 파일 끝에 다음 추가

```jsx
const keywordSampleA = {
  items: [
    { id: 'r1', title: 'React 백엔드', organization: 'A', employmentType: '정규직', region: '수원시', deadline: '2026-07-01', url: 'https://x/r1' },
  ],
  error: null,
}
const keywordSampleB = {
  items: [
    { id: 'u1', title: 'Unity 클라이언트', organization: 'B', employmentType: '정규직', region: '성남시', deadline: '2026-07-05', url: 'https://x/u1' },
    { id: 'r1', title: 'React 백엔드', organization: 'A', employmentType: '정규직', region: '수원시', deadline: '2026-07-01', url: 'https://x/r1' },
  ],
  error: null,
}

it('키워드 탭 클릭만으로는 fetch 안 함 (키워드 0개)', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => allSample })
  render(<JobsWidget />)
  await waitFor(() => screen.getByText('백엔드 개발자'))
  fetch.mockClear()
  await userEvent.click(screen.getByRole('button', { name: '키워드 검색' }))
  expect(fetch).not.toHaveBeenCalled()
})

it('키워드 0개이면 안내 메시지를 표시한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => allSample })
  render(<JobsWidget />)
  await waitFor(() => screen.getByText('백엔드 개발자'))
  await userEvent.click(screen.getByRole('button', { name: '키워드 검색' }))
  expect(screen.getByText(/키워드를 추가/)).toBeInTheDocument()
})

it('키워드 추가 시 해당 키워드로 /api/jobs 호출', async () => {
  fetch.mockResolvedValueOnce({ ok: true, json: async () => allSample })
  render(<JobsWidget />)
  await waitFor(() => screen.getByText('백엔드 개발자'))
  await userEvent.click(screen.getByRole('button', { name: '키워드 검색' }))
  fetch.mockResolvedValueOnce({ ok: true, json: async () => keywordSampleA })
  const input = screen.getByPlaceholderText('키워드 추가')
  await userEvent.type(input, 'React{Enter}')
  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith('/api/jobs?keyword=React')
  })
})

it('여러 키워드 결과를 합쳐 URL 기준으로 dedupe한다', async () => {
  // 첫 마운트: 전체 탭 fetch
  fetch.mockResolvedValueOnce({ ok: true, json: async () => allSample })
  render(<JobsWidget />)
  await waitFor(() => screen.getByText('백엔드 개발자'))
  await userEvent.click(screen.getByRole('button', { name: '키워드 검색' }))

  // 키워드 1개 추가 (React) — fetch A
  fetch.mockResolvedValueOnce({ ok: true, json: async () => keywordSampleA })
  await userEvent.type(screen.getByPlaceholderText('키워드 추가'), 'React{Enter}')
  await waitFor(() => screen.getByText('React 백엔드'))

  // 키워드 2개째 추가 (Unity) — React + Unity 둘 다 다시 fetch
  fetch.mockResolvedValueOnce({ ok: true, json: async () => keywordSampleA })
  fetch.mockResolvedValueOnce({ ok: true, json: async () => keywordSampleB })
  await userEvent.type(screen.getByPlaceholderText('키워드 추가'), 'Unity{Enter}')
  await waitFor(() => screen.getByText('Unity 클라이언트'))
  // React 백엔드는 두 응답에 모두 있지만 1번만 보임
  expect(screen.getAllByText('React 백엔드')).toHaveLength(1)
})

it('키워드 칩 × 클릭 시 키워드를 제거한다', async () => {
  fetch.mockResolvedValueOnce({ ok: true, json: async () => allSample })
  render(<JobsWidget />)
  await waitFor(() => screen.getByText('백엔드 개발자'))
  await userEvent.click(screen.getByRole('button', { name: '키워드 검색' }))
  fetch.mockResolvedValueOnce({ ok: true, json: async () => keywordSampleA })
  await userEvent.type(screen.getByPlaceholderText('키워드 추가'), 'React{Enter}')
  await waitFor(() => screen.getByText('React'))
  await userEvent.click(screen.getByLabelText('React 키워드 삭제'))
  expect(screen.queryByText('React 백엔드')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `npm test -- src/widgets/JobsWidget.test.jsx`
Expected: FAIL — 키워드 검색 탭이 없거나 인풋이 없음.

- [ ] **Step 3: 키워드 탭 구현 추가** — `src/widgets/JobsWidget.jsx` 전체 교체

```jsx
import { useEffect, useState, useCallback, useRef } from 'react'
import Pagination from './Pagination'
import { useJobKeywords } from '../hooks/useJobKeywords'

const PAGE_SIZE = 5

function JobItem({ item }) {
  return (
    <li className="py-2.5 border-b border-gray-100 last:border-b-0">
      <a href={item.url} target="_blank" rel="noopener noreferrer"
        className="text-sm font-medium text-gray-800 hover:text-gray-500 leading-snug block">
        {item.title}
      </a>
      <p className="text-xs text-gray-400 mt-0.5">
        {[item.organization, item.region, item.employmentType, `~${item.deadline}`]
          .filter(Boolean).join(' · ')}
      </p>
    </li>
  )
}

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse flex-1">
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-1">
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  )
}

function KeywordChips({ keywords, onRemove, onAdd }) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  const submit = () => {
    if (!draft.trim()) return
    onAdd(draft)
    setDraft('')
  }

  return (
    <div className="flex gap-1.5 flex-wrap items-center mb-3">
      {keywords.map(k => (
        <span key={k} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full">
          {k}
          <button
            type="button"
            aria-label={`${k} 키워드 삭제`}
            onClick={() => onRemove(k)}
            className="opacity-60 hover:opacity-100"
          >×</button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
        placeholder="키워드 추가"
        className="px-2.5 py-1 text-xs border border-dashed border-gray-300 rounded-full bg-white text-gray-600 outline-none focus:border-gray-500 min-w-[80px]"
      />
    </div>
  )
}

const TABS = [
  { id: 'all', label: '전체' },
  { id: 'keyword', label: '키워드 검색' },
]

export default function JobsWidget() {
  const [tab, setTab] = useState('all')
  const [data, setData] = useState({ all: null, keyword: null })
  const [loading, setLoading] = useState({ all: false, keyword: false })
  const [error, setError] = useState({ all: null, keyword: null })
  const [page, setPage] = useState({ all: 0, keyword: 0 })
  const { keywords, addKeyword, removeKeyword } = useJobKeywords()

  const fetchAll = useCallback(async () => {
    setLoading(s => ({ ...s, all: true }))
    setError(s => ({ ...s, all: null }))
    try {
      const r = await fetch('/api/jobs')
      const d = await r.json()
      if (d.error) {
        setError(s => ({ ...s, all: d.error }))
        setData(s => ({ ...s, all: [] }))
      } else {
        setData(s => ({ ...s, all: d.items ?? [] }))
      }
    } catch (e) {
      setError(s => ({ ...s, all: e.message }))
      setData(s => ({ ...s, all: [] }))
    } finally {
      setLoading(s => ({ ...s, all: false }))
    }
  }, [])

  const fetchKeyword = useCallback(async (kws) => {
    if (kws.length === 0) {
      setData(s => ({ ...s, keyword: [] }))
      return
    }
    setLoading(s => ({ ...s, keyword: true }))
    setError(s => ({ ...s, keyword: null }))
    try {
      const responses = await Promise.allSettled(
        kws.map(kw => fetch(`/api/jobs?keyword=${encodeURIComponent(kw)}`).then(r => r.json()))
      )
      const merged = responses
        .filter(r => r.status === 'fulfilled' && r.value.items)
        .flatMap(r => r.value.items)
      const deduped = Array.from(new Map(merged.map(i => [i.url, i])).values())
      setData(s => ({ ...s, keyword: deduped }))
      setPage(s => ({ ...s, keyword: 0 }))
    } catch (e) {
      setError(s => ({ ...s, keyword: e.message }))
      setData(s => ({ ...s, keyword: [] }))
    } finally {
      setLoading(s => ({ ...s, keyword: false }))
    }
  }, [])

  useEffect(() => {
    if (tab === 'all' && data.all === null && !loading.all) fetchAll()
  }, [tab, data.all, loading.all, fetchAll])

  useEffect(() => {
    if (tab === 'keyword') fetchKeyword(keywords)
  }, [tab, keywords, fetchKeyword])

  const items = data[tab] ?? []
  const currentPage = page[tab]
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const visible = items.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  const handlePage = (p) => setPage(s => ({ ...s, [tab]: p }))
  const handleRefresh = () => {
    if (tab === 'all') setData(s => ({ ...s, all: null }))
    else fetchKeyword(keywords)
  }

  const noKeywords = tab === 'keyword' && keywords.length === 0

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest text-gray-400">채용공고 💼</p>
        <button
          type="button"
          aria-label="새로고침"
          onClick={handleRefresh}
          className="text-xs text-gray-300 hover:text-gray-500"
        >↻</button>
      </div>

      <div className="flex gap-3.5 border-b border-gray-200 mb-2.5">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            role="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`text-xs pb-2 -mb-px ${
              tab === t.id ? 'font-semibold text-gray-800 border-b-2 border-gray-800' : 'text-gray-400'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'keyword' && (
        <KeywordChips keywords={keywords} onRemove={removeKeyword} onAdd={addKeyword} />
      )}

      {loading[tab] && <Skeleton />}

      {!loading[tab] && error[tab] && (
        <p className="text-sm text-gray-400 flex-1">데이터를 불러올 수 없습니다 ({error[tab]})</p>
      )}

      {!loading[tab] && !error[tab] && noKeywords && (
        <p className="text-sm text-gray-400 flex-1">키워드를 추가하세요</p>
      )}

      {!loading[tab] && !error[tab] && !noKeywords && visible.length === 0 && (
        <p className="text-sm text-gray-400 flex-1">공고가 없습니다</p>
      )}

      {!loading[tab] && !error[tab] && !noKeywords && visible.length > 0 && (
        <ul className="flex-1">
          {visible.map(item => <JobItem key={item.id} item={item} />)}
        </ul>
      )}

      <Pagination page={currentPage} totalPages={totalPages} onChange={handlePage} />
    </div>
  )
}
```

- [ ] **Step 4: 테스트 실행해서 통과 확인**

Run: `npm test -- src/widgets/JobsWidget.test.jsx`
Expected: PASS, 10 tests (5 기존 + 5 새 키워드 탭).

- [ ] **Step 5: 커밋**

```bash
git add src/widgets/JobsWidget.jsx src/widgets/JobsWidget.test.jsx
git commit -m "feat: add keyword search tab to JobsWidget"
```

---

## Task 8: `App.jsx`에 새 위젯 행 추가 + 수동 검증

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: 위젯 임포트와 행 추가** — `src/App.jsx` 두 군데 수정

기존 import 블록 (10–13 라인 근처)에 두 줄 추가:

```jsx
import NewsWidget from './widgets/NewsWidget'
import BookmarksWidget from './widgets/BookmarksWidget'
import HousingWidget from './widgets/HousingWidget'
import JobsWidget from './widgets/JobsWidget'
```

기존 `<BookmarksWidget ... />` 바로 아래에 새 행 추가:

```jsx
<BookmarksWidget
  bookmarks={bookmarks}
  onAdd={addBookmark}
  onRemove={removeBookmark}
/>

<div className="grid grid-cols-2 gap-5">
  <HousingWidget />
  <JobsWidget />
</div>
```

- [ ] **Step 2: 전체 테스트 실행**

Run: `npm test`
Expected: 모든 테스트 PASS (신규 + 기존 회귀 없음).

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 성공 (린트 에러나 import 에러 없음).

- [ ] **Step 4: 개발 서버에서 수동 검증**

Run: `npm run dev`
브라우저에서 `http://localhost:5173` 열고 맨 아래로 스크롤. 다음 확인:
- 좌측 청약 카드: 5건 표시, 카테고리 칩 클릭 시 필터, ‹ 1/N › 페이지 이동, ↻ 새로고침
- 우측 채용 카드: "전체" 탭 5건 표시, "키워드 검색" 탭으로 전환 시 칩 영역 + 안내 메시지, 키워드 추가 시 결과 표시
- 콘솔에 에러 없음 (특히 `.env.local`에 키 셋팅된 상태에서)

- [ ] **Step 5: 커밋**

```bash
git add src/App.jsx
git commit -m "feat: wire HousingWidget and JobsWidget into App layout"
```

---

## Self-Review

**Spec coverage:**

- 청약 위젯 (LH 임대, 카테고리 필터) → Task 3+4 ✓
- 잡아바 채용 (전체 + 키워드) → Task 5+6+7 ✓
- 페이지네이션 → Task 2 ✓
- 키워드 칩 (인라인 +/× UI) → Task 7 ✓
- localStorage 키워드 저장 → Task 1 ✓
- 새로고침 버튼 → Task 4(↻), 7(↻) ✓
- 에러/빈/로딩 상태 → Task 4·6·7 모두 케이스 포함 ✓
- 잡아바 User-Agent 필수 → Task 5 테스트로 회귀 보호 ✓
- 캐싱 헤더 (s-maxage=1800) → Task 3·5 구현에 포함 ✓
- 키 미설정 시 명확한 에러 → Task 3·5 테스트 포함 ✓
- 레이아웃: 메인 맨 아래 새 행 → Task 8 ✓

**Placeholder scan:** 없음. 모든 코드는 완전한 형태.

**Type 일관성:**

- HousingItem: `{ id, title, type, deadline, status, url }` — Task 3·4 동일 ✓
- JobItem: `{ id, title, organization, employmentType, region, deadline, url }` — Task 5·6·7 동일 ✓
- Pagination props: `{ page, totalPages, onChange }` — Task 2·4·6·7 동일 ✓

## 미해결 / 후속

- 사람인 OpenAPI 발급 후 별도 task로 추가 — `api/jobs.js`에 `source=` 분기 도입 가능.
- 잡아바가 응답 매우 큰 경우(50,000+건) over-fetch(200건) 정확도가 낮을 수 있음. 운영 후 페이지 순회 전략 재검토.
