# 검색 기능 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 대시보드 상단에 검색창을 추가하고, 새 탭에서 Google/Naver 결과를 보여주되 사용자 피드백으로 광고·AI 글을 학습해 자동 필터링하는 커스텀 검색 페이지를 구축한다.

**Architecture:** Vercel serverless `/api/search.js`가 Google Custom Search API + Naver Search API를 동시 호출해 API 키를 보호한다. 클라이언트는 `filterEngine.js`(순수 함수)로 각 결과에 스팸 점수를 매기고, `useSearchFilter` 훅이 localStorage의 `search-filters` 키에 학습 규칙을 누적한다. `/search`와 `/filter-manager`는 react-router-dom으로 분리된 페이지로 새 탭에서 열린다.

**Tech Stack:** React 19, Vite 8, Tailwind CSS 3, react-router-dom 6, Vitest + @testing-library/react, Vercel Serverless Functions, Google Custom Search API, Naver Search API

---

## 파일 맵

| 상태 | 경로 | 역할 |
|---|---|---|
| 신규 | `api/search.js` | Google + Naver 동시 호출 serverless function |
| 신규 | `src/utils/filterEngine.js` | 스팸 점수 계산 순수 함수 |
| 신규 | `src/utils/filterEngine.test.js` | filterEngine 단위 테스트 |
| 신규 | `src/hooks/useSearchFilter.js` | 필터 규칙 CRUD + 학습 훅 |
| 신규 | `src/hooks/useSearchFilter.test.js` | useSearchFilter 단위 테스트 |
| 신규 | `src/components/SearchBar.jsx` | 대시보드 상단 검색창 |
| 신규 | `src/components/SearchBar.test.jsx` | SearchBar 컴포넌트 테스트 |
| 신규 | `src/views/SearchResultsPage.jsx` | `/search?q=...` 결과 페이지 |
| 신규 | `src/views/SearchResultsPage.test.jsx` | SearchResultsPage 테스트 |
| 신규 | `src/views/FilterManagerPage.jsx` | `/filter-manager` 관리 페이지 |
| 신규 | `src/views/FilterManagerPage.test.jsx` | FilterManagerPage 테스트 |
| 수정 | `src/utils/storageUtils.js` | `getSearchFilters` / `setSearchFilters` 추가 |
| 수정 | `src/utils/storageUtils.test.js` | search-filters 테스트 추가 |
| 수정 | `src/main.jsx` | BrowserRouter + Routes 추가 |
| 수정 | `src/App.jsx` | `<SearchBar />` 최상단 추가 |
| 수정 | `src/components/Sidebar.jsx` | 하단 "필터 관리" 링크 추가 |

---

## Task 1: react-router-dom 설치 + 라우팅 설정

**Files:**
- Modify: `package.json` (dependency 추가)
- Modify: `src/main.jsx`

- [ ] **Step 1: react-router-dom 설치**

```bash
npm install react-router-dom
```

Expected: `package.json`의 `dependencies`에 `"react-router-dom": "^6.x.x"` 추가됨

- [ ] **Step 2: main.jsx에 BrowserRouter + Routes 추가**

현재 `src/main.jsx`:
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

변경 후 `src/main.jsx`:
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import SearchResultsPage from './views/SearchResultsPage.jsx'
import FilterManagerPage from './views/FilterManagerPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/filter-manager" element={<FilterManagerPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 3: 임시 placeholder 파일 생성 (빌드 오류 방지)**

`src/views/SearchResultsPage.jsx`:
```jsx
export default function SearchResultsPage() {
  return <div>검색 결과 페이지 (구현 예정)</div>
}
```

`src/views/FilterManagerPage.jsx`:
```jsx
export default function FilterManagerPage() {
  return <div>필터 관리 페이지 (구현 예정)</div>
}
```

- [ ] **Step 4: 개발 서버 실행해서 "/" 경로가 기존과 동일하게 동작하는지 확인**

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속 → 기존 대시보드 그대로 표시 확인

- [ ] **Step 5: 커밋**

```bash
git add src/main.jsx src/views/SearchResultsPage.jsx src/views/FilterManagerPage.jsx package.json package-lock.json
git commit -m "feat: add react-router-dom and route skeleton"
```

---

## Task 2: storageUtils — search-filters 함수 추가

**Files:**
- Modify: `src/utils/storageUtils.js`
- Modify: `src/utils/storageUtils.test.js`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/utils/storageUtils.test.js` 파일 끝에 추가:
```js
import { getSearchFilters, setSearchFilters } from './storageUtils'

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
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
npm run test -- --reporter=verbose
```

Expected: `getSearchFilters is not a function` 오류로 FAIL

- [ ] **Step 3: storageUtils.js에 함수 추가**

`src/utils/storageUtils.js` 끝에 추가:
```js
export function getSearchFilters() {
  try {
    const raw = localStorage.getItem('search-filters')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setSearchFilters(filters) {
  try {
    localStorage.setItem('search-filters', JSON.stringify(filters))
  } catch {}
}
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

```bash
npm run test -- --reporter=verbose
```

Expected: 모든 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
git add src/utils/storageUtils.js src/utils/storageUtils.test.js
git commit -m "feat: add getSearchFilters/setSearchFilters to storageUtils"
```

---

## Task 3: filterEngine.js — 스팸 점수 계산 순수 함수

**Files:**
- Create: `src/utils/filterEngine.js`
- Create: `src/utils/filterEngine.test.js`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/utils/filterEngine.test.js` 생성:
```js
import { describe, it, expect } from 'vitest'
import { extractDomain, extractKeywords, scoreResult } from './filterEngine'

describe('extractDomain', () => {
  it('https URL에서 도메인을 추출한다', () => {
    expect(extractDomain('https://www.tistory.com/entry/123')).toBe('tistory.com')
  })

  it('www 없는 URL도 처리한다', () => {
    expect(extractDomain('https://blog.naver.com/post/1')).toBe('blog.naver.com')
  })

  it('잘못된 URL이면 원문 그대로 반환한다', () => {
    expect(extractDomain('not-a-url')).toBe('not-a-url')
  })
})

describe('extractKeywords', () => {
  it('공백으로 분리된 단어를 반환한다', () => {
    const kws = extractKeywords('협찬 받은 제품 리뷰')
    expect(kws).toContain('협찬')
    expect(kws).toContain('리뷰')
  })

  it('2글자 미만 단어는 제외한다', () => {
    const kws = extractKeywords('이 제품 좋아요')
    expect(kws).not.toContain('이')
  })

  it('괄호·특수문자는 구분자로 처리한다', () => {
    const kws = extractKeywords('[협찬]최신 게임 리뷰(2026)')
    expect(kws).toContain('협찬')
    expect(kws).toContain('리뷰')
  })
})

describe('scoreResult', () => {
  const baseFilters = { domains: {}, keywords: {}, threshold: 3 }

  it('아무 규칙도 없으면 점수 0, filtered false', () => {
    const result = scoreResult({ title: '일반 기사 제목', url: 'https://news.com/1' }, baseFilters)
    expect(result.score).toBe(0)
    expect(result.filtered).toBe(false)
  })

  it('차단된 도메인이면 +100, filtered true', () => {
    const filters = { ...baseFilters, domains: { 'spam.com': { count: 5, blocked: true, manual: false } } }
    const result = scoreResult({ title: '제목', url: 'https://spam.com/post' }, filters)
    expect(result.score).toBe(100)
    expect(result.filtered).toBe(true)
    expect(result.reasons).toContain('차단된 도메인: spam.com')
  })

  it('차단된 키워드가 제목에 있으면 +40', () => {
    const filters = { ...baseFilters, keywords: { '협찬': { count: 3, blocked: true, manual: false } } }
    const result = scoreResult({ title: '협찬 제품 사용 후기', url: 'https://normal.com/1' }, filters)
    expect(result.score).toBe(40)
    expect(result.filtered).toBe(false)
  })

  it('차단된 키워드 2개면 +80, filtered true', () => {
    const filters = {
      ...baseFilters,
      keywords: {
        '협찬': { count: 3, blocked: true, manual: false },
        '리뷰노트': { count: 3, blocked: true, manual: false },
      }
    }
    const result = scoreResult({ title: '협찬 리뷰노트 게시글', url: 'https://normal.com/1' }, filters)
    expect(result.score).toBe(80)
    expect(result.filtered).toBe(true)
  })

  it('학습 중인 키워드(blocked:false)가 있으면 +10', () => {
    const filters = { ...baseFilters, keywords: { '협찬': { count: 1, blocked: false, manual: false } } }
    const result = scoreResult({ title: '협찬 제품 후기', url: 'https://normal.com/1' }, filters)
    expect(result.score).toBe(10)
  })

  it('점수 60 이상이면 filtered true', () => {
    const filters = {
      ...baseFilters,
      keywords: {
        '협찬': { count: 3, blocked: true, manual: false },
        '리뷰': { count: 3, blocked: true, manual: false },
      }
    }
    const result = scoreResult({ title: '협찬 리뷰 후기', url: 'https://normal.com/1' }, filters)
    expect(result.filtered).toBe(true)
  })
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
npm run test -- --reporter=verbose
```

Expected: `Cannot find module './filterEngine'`로 FAIL

- [ ] **Step 3: filterEngine.js 구현**

`src/utils/filterEngine.js` 생성:
```js
const STOPWORDS = new Set([
  '이', '가', '은', '는', '을', '를', '의', '에', '도', '로', '와', '과',
  '한', '하는', '있는', '없는', '위한', '대한', '에서', '부터', '까지',
  '이다', '있다', '없다', '하다', '된다', '됩니다', '합니다', '입니다',
  '것은', '것을', '그리고', '그러나', '하지만', '또한', '그래서', '더',
  '및', '등', '후', '전', '중', '위', '아래',
])

export function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function extractKeywords(title) {
  return title
    .split(/[\s\[\]().,!?·|:;'"\/\\+\-=@#$%^&*~`<>{}]+/)
    .map(w => w.trim())
    .filter(w => w.length >= 2 && !STOPWORDS.has(w))
}

export function scoreResult(result, filters) {
  const { domains, keywords } = filters
  const domain = extractDomain(result.url)
  let score = 0
  const reasons = []

  const domainRule = domains[domain]
  if (domainRule?.blocked) {
    score += 100
    reasons.push(`차단된 도메인: ${domain}`)
  }

  const titleKeywords = extractKeywords(result.title)
  for (const kw of titleKeywords) {
    const kwRule = keywords[kw]
    if (kwRule?.blocked) {
      score += 40
      reasons.push(`차단된 키워드: ${kw}`)
    } else if (kwRule) {
      score += 10
    }
  }

  return { score, filtered: score >= 60, reasons }
}
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

```bash
npm run test -- --reporter=verbose
```

Expected: 모든 filterEngine 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
git add src/utils/filterEngine.js src/utils/filterEngine.test.js
git commit -m "feat: add filterEngine with spam score calculation"
```

---

## Task 4: useSearchFilter 훅

**Files:**
- Create: `src/hooks/useSearchFilter.js`
- Create: `src/hooks/useSearchFilter.test.js`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/hooks/useSearchFilter.test.js` 생성:
```js
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
})

describe('markAsNormal', () => {
  it('도메인 count가 1 감소하고 0 미만이 되지 않는다', () => {
    const { result } = renderHook(() => useSearchFilter())
    act(() => result.current.markAsAd({ title: '글', url: 'https://site.com/1' }))
    act(() => result.current.markAsNormal({ title: '글', url: 'https://site.com/2' }))
    act(() => result.current.markAsNormal({ title: '글', url: 'https://site.com/3' }))
    expect(result.current.filters.domains['site.com'].count).toBe(0)
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
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
npm run test -- --reporter=verbose
```

Expected: `Cannot find module './useSearchFilter'`로 FAIL

- [ ] **Step 3: useSearchFilter.js 구현**

`src/hooks/useSearchFilter.js` 생성:
```js
import { useState, useCallback } from 'react'
import { getSearchFilters, setSearchFilters } from '../utils/storageUtils'
import { scoreResult, extractKeywords, extractDomain } from '../utils/filterEngine'

const DEFAULT_THRESHOLD = 3
const DEFAULT_KEYWORDS = ['협찬', '제공받음', '리뷰노트', '유료광고', '소정의', '내돈내산 아님']

function initFilters() {
  const saved = getSearchFilters()
  if (saved) return saved
  const keywords = {}
  for (const kw of DEFAULT_KEYWORDS) {
    keywords[kw] = { count: DEFAULT_THRESHOLD, blocked: true, manual: true }
  }
  const initial = { domains: {}, keywords, threshold: DEFAULT_THRESHOLD }
  setSearchFilters(initial)
  return initial
}

export function useSearchFilter() {
  const [filters, setFiltersState] = useState(initFilters)

  const markAsAd = useCallback((result) => {
    setFiltersState(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      const domain = extractDomain(result.url)

      if (!next.domains[domain]) next.domains[domain] = { count: 0, blocked: false, manual: false }
      next.domains[domain].count = Math.min(next.domains[domain].count + 1, 999)
      if (!next.domains[domain].manual) {
        next.domains[domain].blocked = next.domains[domain].count >= next.threshold
      }

      const kws = extractKeywords(result.title)
      for (const kw of kws) {
        if (!next.keywords[kw]) next.keywords[kw] = { count: 0, blocked: false, manual: false }
        next.keywords[kw].count = Math.min(next.keywords[kw].count + 1, 999)
        if (!next.keywords[kw].manual) {
          next.keywords[kw].blocked = next.keywords[kw].count >= next.threshold
        }
      }

      setSearchFilters(next)
      return next
    })
  }, [])

  const markAsNormal = useCallback((result) => {
    setFiltersState(prev => {
      const next = JSON.parse(JSON.stringify(prev))
      const domain = extractDomain(result.url)

      if (next.domains[domain] && !next.domains[domain].manual) {
        next.domains[domain].count = Math.max(0, next.domains[domain].count - 1)
        next.domains[domain].blocked = next.domains[domain].count >= next.threshold
      }

      const kws = extractKeywords(result.title)
      for (const kw of kws) {
        if (next.keywords[kw] && !next.keywords[kw].manual) {
          next.keywords[kw].count = Math.max(0, next.keywords[kw].count - 1)
          next.keywords[kw].blocked = next.keywords[kw].count >= next.threshold
        }
      }

      setSearchFilters(next)
      return next
    })
  }, [])

  const addDomain = useCallback((domain) => {
    setFiltersState(prev => {
      const next = { ...prev, domains: { ...prev.domains, [domain]: { count: prev.threshold, blocked: true, manual: true } } }
      setSearchFilters(next)
      return next
    })
  }, [])

  const removeDomain = useCallback((domain) => {
    setFiltersState(prev => {
      const domains = { ...prev.domains }
      delete domains[domain]
      const next = { ...prev, domains }
      setSearchFilters(next)
      return next
    })
  }, [])

  const addKeyword = useCallback((keyword) => {
    setFiltersState(prev => {
      const next = { ...prev, keywords: { ...prev.keywords, [keyword]: { count: prev.threshold, blocked: true, manual: true } } }
      setSearchFilters(next)
      return next
    })
  }, [])

  const removeKeyword = useCallback((keyword) => {
    setFiltersState(prev => {
      const keywords = { ...prev.keywords }
      delete keywords[keyword]
      const next = { ...prev, keywords }
      setSearchFilters(next)
      return next
    })
  }, [])

  const updateThreshold = useCallback((threshold) => {
    setFiltersState(prev => {
      const next = { ...prev, threshold }
      setSearchFilters(next)
      return next
    })
  }, [])

  const score = useCallback((result) => {
    return scoreResult(result, filters)
  }, [filters])

  return { filters, markAsAd, markAsNormal, addDomain, removeDomain, addKeyword, removeKeyword, updateThreshold, score }
}
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

```bash
npm run test -- --reporter=verbose
```

Expected: 모든 useSearchFilter 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
git add src/hooks/useSearchFilter.js src/hooks/useSearchFilter.test.js
git commit -m "feat: add useSearchFilter hook with pattern learning"
```

---

## Task 5: /api/search.js — Vercel Serverless Function

**Files:**
- Create: `api/search.js`

테스트 없음 — 실제 API 키가 있어야 검증 가능. 수동 테스트 지침 포함.

- [ ] **Step 1: api/search.js 생성**

```js
export default async function handler(req, res) {
  const q = req.query?.q?.trim()
  if (!q) return res.status(400).json({ error: '검색어가 없어요' })

  const [googleResult, naverResult] = await Promise.allSettled([
    fetchGoogle(q),
    fetchNaver(q),
  ])

  res.setHeader('Cache-Control', 'no-store')
  res.json({
    google: googleResult.status === 'fulfilled'
      ? { results: googleResult.value, error: null }
      : { results: null, error: '구글 결과를 불러오지 못했어요' },
    naver: naverResult.status === 'fulfilled'
      ? { results: naverResult.value, error: null }
      : { results: null, error: '네이버 결과를 불러오지 못했어요' },
  })
}

async function fetchGoogle(q) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID
  if (!apiKey || !engineId) throw new Error('Google API not configured')

  const url = 'https://www.googleapis.com/customsearch/v1?' + new URLSearchParams({
    key: apiKey,
    cx: engineId,
    q,
    num: '10',
  })
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Google API ${res.status}`)
  const data = await res.json()
  return (data.items ?? []).map(item => ({
    title: item.title,
    url: item.link,
    snippet: item.snippet ?? '',
  }))
}

async function fetchNaver(q) {
  const clientId = process.env.NAVER_CLIENT_ID
  const clientSecret = process.env.NAVER_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Naver API not configured')

  const url = 'https://openapi.naver.com/v1/search/webkr.json?' + new URLSearchParams({
    query: q,
    display: '10',
  })
  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
    },
  })
  if (!res.ok) throw new Error(`Naver API ${res.status}`)
  const data = await res.json()
  return (data.items ?? []).map(item => ({
    title: item.title.replace(/<[^>]+>/g, ''),
    url: item.link,
    snippet: item.description.replace(/<[^>]+>/g, ''),
  }))
}
```

- [ ] **Step 2: .env.local에 환경 변수 추가**

`.env.local` 파일에 아래 항목 추가 (API 키 발급 후 채워넣기):
```
GOOGLE_SEARCH_API_KEY=여기에_구글_API_키
GOOGLE_SEARCH_ENGINE_ID=여기에_커스텀_검색엔진_ID
NAVER_CLIENT_ID=여기에_네이버_클라이언트_ID
NAVER_CLIENT_SECRET=여기에_네이버_클라이언트_시크릿
```

> Google Custom Search API 키 발급: https://developers.google.com/custom-search/v1/introduction  
> Google Custom Search Engine(cx) 생성: https://programmablesearch.google.com/  
> Naver Search API 키 발급: https://developers.naver.com/apps

- [ ] **Step 3: 커밋**

```bash
git add api/search.js
git commit -m "feat: add /api/search serverless function for Google + Naver"
```

---

## Task 6: SearchBar 컴포넌트 + App.jsx 통합

**Files:**
- Create: `src/components/SearchBar.jsx`
- Create: `src/components/SearchBar.test.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/components/SearchBar.test.jsx` 생성:
```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchBar from './SearchBar'

beforeEach(() => {
  vi.stubGlobal('open', vi.fn())
})

describe('SearchBar', () => {
  it('검색 입력창과 버튼이 렌더된다', () => {
    render(<SearchBar />)
    expect(screen.getByPlaceholderText('검색...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '검색' })).toBeInTheDocument()
  })

  it('검색어 입력 후 Enter 키로 새 탭이 열린다', async () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText('검색...')
    await userEvent.type(input, '리액트 튜토리얼{Enter}')
    expect(window.open).toHaveBeenCalledWith(
      '/search?q=%EB%A6%AC%EC%95%A1%ED%8A%B8%20%ED%8A%9C%ED%86%A0%EB%A6%AC%EC%96%BC',
      '_blank'
    )
  })

  it('검색 버튼 클릭으로 새 탭이 열린다', async () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText('검색...')
    await userEvent.type(input, '게임 뉴스')
    await userEvent.click(screen.getByRole('button', { name: '검색' }))
    expect(window.open).toHaveBeenCalledWith(
      '/search?q=%EA%B2%8C%EC%9E%84%20%EB%89%B4%EC%8A%A4',
      '_blank'
    )
  })

  it('빈 검색어로는 새 탭이 열리지 않는다', async () => {
    render(<SearchBar />)
    await userEvent.click(screen.getByRole('button', { name: '검색' }))
    expect(window.open).not.toHaveBeenCalled()
  })

  it('공백만 있는 검색어로는 새 탭이 열리지 않는다', async () => {
    render(<SearchBar />)
    const input = screen.getByPlaceholderText('검색...')
    await userEvent.type(input, '   {Enter}')
    expect(window.open).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
npm run test -- --reporter=verbose
```

Expected: `Cannot find module './SearchBar'`로 FAIL

- [ ] **Step 3: SearchBar.jsx 구현**

`src/components/SearchBar.jsx` 생성:
```jsx
import { useState } from 'react'

export default function SearchBar() {
  const [query, setQuery] = useState('')

  function handleSearch() {
    const q = query.trim()
    if (!q) return
    window.open(`/search?q=${encodeURIComponent(q)}`, '_blank')
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white">
      <span className="text-gray-400 text-sm">🔍</span>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSearch()}
        placeholder="검색..."
        className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
      />
      <button
        onClick={handleSearch}
        className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
      >
        검색
      </button>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

```bash
npm run test -- --reporter=verbose
```

Expected: 모든 SearchBar 테스트 PASS

- [ ] **Step 5: App.jsx에 SearchBar 추가**

`src/App.jsx`의 `return` 블록에서 최상단 `<div className="flex min-h-screen ...">` 바로 다음, `<Sidebar>` 이전에 전체 너비 SearchBar를 배치한다.

현재:
```jsx
return (
  <div className="flex min-h-screen bg-gray-50 text-gray-900">
    <Sidebar
```

변경 후:
```jsx
import SearchBar from './components/SearchBar'

// return 블록:
return (
  <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
    <SearchBar />
    <div className="flex flex-1">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onRoutineManager={() => setShowRoutineManager(true)}
      />

      <div className="flex-1 flex flex-col p-6 gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 flex overflow-hidden">
          <div className="flex-1 flex overflow-hidden min-w-0">
            {currentView === 'today' && <TodayView {...taskProps} />}
            {currentView === 'week' && <WeekView {...taskProps} />}
            {currentView === 'calendar' && <CalendarView {...taskProps} />}
          </div>
          <SomedayPanel
            tasks={somedayTasks}
            onAdd={addSomedayTask}
            onToggle={toggleSomedayTask}
            onRemove={removeSomedayTask}
          />
        </div>

        <div className="grid grid-cols-[1fr_1fr_2fr] gap-5">
          <StreakWidget allTasks={allTasks} />
          <WeatherWidget />
          <NewsWidget />
        </div>

        <BookmarksWidget
          bookmarks={bookmarks}
          onAdd={addBookmark}
          onRemove={removeBookmark}
        />
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
```

- [ ] **Step 6: 개발 서버에서 SearchBar 확인**

```bash
npm run dev
```

브라우저에서 검색창이 최상단에 표시되고 검색어 입력 후 Enter/버튼 클릭 시 새 탭이 열리는지 확인

- [ ] **Step 7: 커밋**

```bash
git add src/components/SearchBar.jsx src/components/SearchBar.test.jsx src/App.jsx
git commit -m "feat: add SearchBar component and wire into App"
```

---

## Task 7: SearchResultsPage

**Files:**
- Modify: `src/views/SearchResultsPage.jsx` (Task 1에서 만든 placeholder 교체)
- Create: `src/views/SearchResultsPage.test.jsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/views/SearchResultsPage.test.jsx` 생성:
```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SearchResultsPage from './SearchResultsPage'

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal('open', vi.fn())
  vi.stubGlobal('fetch', vi.fn())
})

function renderWithQuery(q) {
  return render(
    <MemoryRouter initialEntries={[`/search?q=${encodeURIComponent(q)}`]}>
      <Routes>
        <Route path="/search" element={<SearchResultsPage />} />
      </Routes>
    </MemoryRouter>
  )
}

const mockResponse = {
  google: {
    results: [
      { title: '리액트 공식 문서', url: 'https://react.dev', snippet: '리액트 공식 사이트' },
    ],
    error: null,
  },
  naver: {
    results: [
      { title: '네이버 리액트 블로그', url: 'https://d2.naver.com/1', snippet: '네이버 기술 블로그' },
    ],
    error: null,
  },
}

it('로딩 상태를 표시한다', () => {
  fetch.mockReturnValue(new Promise(() => {}))
  renderWithQuery('리액트')
  expect(screen.getByText('검색 중...')).toBeInTheDocument()
})

it('Google과 Naver 결과를 각각 표시한다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => mockResponse })
  renderWithQuery('리액트')
  await waitFor(() => {
    expect(screen.getByText('리액트 공식 문서')).toBeInTheDocument()
    expect(screen.getByText('네이버 리액트 블로그')).toBeInTheDocument()
  })
})

it('Google 열과 Naver 열 헤더가 표시된다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => mockResponse })
  renderWithQuery('리액트')
  await waitFor(() => {
    expect(screen.getByText('Google')).toBeInTheDocument()
    expect(screen.getByText('Naver')).toBeInTheDocument()
  })
})

it('각 결과에 광고/정상 버튼이 있다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => mockResponse })
  renderWithQuery('리액트')
  await waitFor(() => {
    expect(screen.getAllByRole('button', { name: '광고' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: '정상' })).toHaveLength(2)
  })
})

it('광고 버튼 클릭 시 해당 결과가 숨겨진다', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => mockResponse })
  renderWithQuery('리액트')
  await waitFor(() => screen.getByText('리액트 공식 문서'))
  await userEvent.click(screen.getAllByRole('button', { name: '광고' })[0])
  expect(screen.queryByText('리액트 공식 문서')).not.toBeInTheDocument()
})

it('fetch 실패 시 에러 메시지를 표시한다', async () => {
  fetch.mockRejectedValue(new Error('network error'))
  renderWithQuery('리액트')
  await waitFor(() => {
    expect(screen.getByText('검색 결과를 불러오지 못했어요')).toBeInTheDocument()
  })
})

it('필터에 걸린 결과는 숨겨진 결과 섹션에 표시된다', async () => {
  localStorage.setItem('search-filters', JSON.stringify({
    domains: { 'spam.com': { count: 5, blocked: true, manual: true } },
    keywords: {},
    threshold: 3,
  }))
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      google: { results: [{ title: '스팸 사이트 글', url: 'https://spam.com/1', snippet: '설명' }], error: null },
      naver: { results: [], error: null },
    }),
  })
  renderWithQuery('테스트')
  await waitFor(() => {
    expect(screen.getByText(/숨겨진 결과/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
npm run test -- --reporter=verbose
```

Expected: 다수 테스트 FAIL (SearchResultsPage가 placeholder이므로)

- [ ] **Step 3: SearchResultsPage.jsx 구현**

`src/views/SearchResultsPage.jsx` 전체 교체:
```jsx
import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useSearchFilter } from '../hooks/useSearchFilter'

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [inputValue, setInputValue] = useState(query)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [googleData, setGoogleData] = useState(null)
  const [naverData, setNaverData] = useState(null)
  const [hiddenByUser, setHiddenByUser] = useState(new Set())
  const [showFiltered, setShowFiltered] = useState(false)

  const { score, markAsAd, markAsNormal } = useSearchFilter()

  useEffect(() => {
    if (!query) return
    setInputValue(query)
    setLoading(true)
    setFetchError(null)
    setHiddenByUser(new Set())
    setGoogleData(null)
    setNaverData(null)

    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => {
        setGoogleData(data.google)
        setNaverData(data.naver)
      })
      .catch(() => setFetchError('검색 결과를 불러오지 못했어요'))
      .finally(() => setLoading(false))
  }, [query])

  function handleSearch() {
    const q = inputValue.trim()
    if (!q) return
    setSearchParams({ q })
  }

  function handleAd(result) {
    markAsAd(result)
    setHiddenByUser(prev => new Set([...prev, result.url]))
  }

  function handleNormal(result) {
    markAsNormal(result)
  }

  function renderResult(result) {
    const { filtered, reasons } = score(result)
    if (hiddenByUser.has(result.url) || filtered) return null
    return (
      <div key={result.url} className="py-3 border-b border-gray-100 last:border-0">
        <a href={result.url} target="_blank" rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm font-medium block mb-0.5 truncate">
          {result.title}
        </a>
        <p className="text-xs text-gray-400 truncate mb-1">{result.url}</p>
        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{result.snippet}</p>
        <div className="flex gap-2">
          <button onClick={() => handleAd(result)}
            className="text-xs px-2 py-0.5 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
            광고
          </button>
          <button onClick={() => handleNormal(result)}
            className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
            정상
          </button>
        </div>
      </div>
    )
  }

  function getFilteredResults(results) {
    if (!results) return []
    return results.filter(r => {
      const { filtered } = score(r)
      return filtered || hiddenByUser.has(r.url)
    })
  }

  const googleResults = googleData?.results ?? []
  const naverResults = naverData?.results ?? []
  const allFiltered = [
    ...getFilteredResults(googleResults).map(r => ({ ...r, source: 'Google' })),
    ...getFilteredResults(naverResults).map(r => ({ ...r, source: 'Naver' })),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <span className="text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="검색..."
          className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
        <button onClick={handleSearch}
          className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
          검색
        </button>
        <Link to="/filter-manager" target="_blank"
          className="text-xs text-gray-400 hover:text-gray-700 whitespace-nowrap">
          필터 관리 →
        </Link>
      </div>

      <div className="px-6 py-4">
        {loading && (
          <p className="text-center text-gray-400 text-sm py-16">검색 중...</p>
        )}

        {fetchError && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-sm mb-3">{fetchError}</p>
            <button onClick={() => setSearchParams({ q: query })}
              className="text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100">
              다시 시도
            </button>
          </div>
        )}

        {!loading && !fetchError && (googleData || naverData) && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                Google
                {googleData?.error && (
                  <span className="text-xs text-red-400 font-normal">{googleData.error}</span>
                )}
              </h2>
              {googleResults.length === 0 && !googleData?.error && (
                <p className="text-xs text-gray-400">결과가 없어요</p>
              )}
              {googleResults.map(renderResult)}
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                Naver
                {naverData?.error && (
                  <span className="text-xs text-red-400 font-normal">{naverData.error}</span>
                )}
              </h2>
              {naverResults.length === 0 && !naverData?.error && (
                <p className="text-xs text-gray-400">결과가 없어요</p>
              )}
              {naverResults.map(renderResult)}
            </div>
          </div>
        )}

        {allFiltered.length > 0 && (
          <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowFiltered(f => !f)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <span>숨겨진 결과 {allFiltered.length}개 (필터에 걸림)</span>
              <span>{showFiltered ? '▲' : '▾'}</span>
            </button>
            {showFiltered && (
              <div className="px-4 py-2">
                {allFiltered.map(result => {
                  const { reasons } = score(result)
                  return (
                    <div key={result.url} className="py-2 border-b border-gray-100 last:border-0 opacity-60">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {result.source}
                        </span>
                        <a href={result.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline truncate">
                          {result.title}
                        </a>
                      </div>
                      <p className="text-xs text-red-400">{reasons.join(', ')}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

```bash
npm run test -- --reporter=verbose
```

Expected: 모든 SearchResultsPage 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
git add src/views/SearchResultsPage.jsx src/views/SearchResultsPage.test.jsx
git commit -m "feat: implement SearchResultsPage with filter feedback"
```

---

## Task 8: FilterManagerPage + Sidebar 링크

**Files:**
- Modify: `src/views/FilterManagerPage.jsx` (placeholder 교체)
- Create: `src/views/FilterManagerPage.test.jsx`
- Modify: `src/components/Sidebar.jsx`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/views/FilterManagerPage.test.jsx` 생성:
```jsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import FilterManagerPage from './FilterManagerPage'

beforeEach(() => localStorage.clear())

function renderPage() {
  return render(
    <MemoryRouter>
      <FilterManagerPage />
    </MemoryRouter>
  )
}

it('필터 관리 제목이 표시된다', () => {
  renderPage()
  expect(screen.getByText('필터 관리')).toBeInTheDocument()
})

it('차단된 도메인 섹션이 표시된다', () => {
  renderPage()
  expect(screen.getByText('차단된 도메인')).toBeInTheDocument()
})

it('차단된 키워드 섹션에 기본 키워드가 표시된다', () => {
  renderPage()
  expect(screen.getByText('협찬')).toBeInTheDocument()
})

it('도메인 직접 추가가 동작한다', async () => {
  renderPage()
  const input = screen.getAllByPlaceholderText('직접 추가...')[0]
  await userEvent.type(input, 'badsite.com{Enter}')
  expect(screen.getByText('badsite.com')).toBeInTheDocument()
})

it('키워드 직접 추가가 동작한다', async () => {
  renderPage()
  const inputs = screen.getAllByPlaceholderText('직접 추가...')
  await userEvent.type(inputs[1], '광고글{Enter}')
  expect(screen.getByText('광고글')).toBeInTheDocument()
})

it('도메인 삭제 버튼이 동작한다', async () => {
  renderPage()
  const input = screen.getAllByPlaceholderText('직접 추가...')[0]
  await userEvent.type(input, 'deleteme.com{Enter}')
  expect(screen.getByText('deleteme.com')).toBeInTheDocument()
  const deleteButtons = screen.getAllByRole('button', { name: '삭제' })
  await userEvent.click(deleteButtons[0])
  expect(screen.queryByText('deleteme.com')).not.toBeInTheDocument()
})

it('임계값 변경이 반영된다', async () => {
  renderPage()
  const thresholdInput = screen.getByDisplayValue('3')
  await userEvent.clear(thresholdInput)
  await userEvent.type(thresholdInput, '5')
  expect(thresholdInput.value).toBe('5')
})
```

- [ ] **Step 2: 테스트 실행 — FAIL 확인**

```bash
npm run test -- --reporter=verbose
```

Expected: 다수 테스트 FAIL

- [ ] **Step 3: FilterManagerPage.jsx 구현**

`src/views/FilterManagerPage.jsx` 전체 교체:
```jsx
import { useState } from 'react'
import { useSearchFilter } from '../hooks/useSearchFilter'

function AddInput({ onAdd, placeholder = '직접 추가...' }) {
  const [value, setValue] = useState('')
  function handleAdd() {
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
  }
  return (
    <div className="flex gap-2 mt-2">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
        placeholder={placeholder}
        className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
      />
      <button
        onClick={handleAdd}
        className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
      >
        추가
      </button>
    </div>
  )
}

export default function FilterManagerPage() {
  const { filters, addDomain, removeDomain, addKeyword, removeKeyword, updateThreshold } = useSearchFilter()
  const [thresholdInput, setThresholdInput] = useState(String(filters.threshold))

  const blockedDomains = Object.entries(filters.domains).filter(([, v]) => v.blocked)
  const blockedKeywords = Object.entries(filters.keywords).filter(([, v]) => v.blocked)

  function handleThresholdChange(e) {
    const val = e.target.value
    setThresholdInput(val)
    const n = parseInt(val, 10)
    if (!isNaN(n) && n >= 1) updateThreshold(n)
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 max-w-2xl mx-auto">
      <h1 className="text-lg font-bold text-gray-900 mb-6">필터 관리</h1>

      <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">
          차단된 도메인
          <span className="text-gray-400 font-normal ml-1">({blockedDomains.length}개)</span>
        </h2>
        <p className="text-xs text-gray-400 mb-3">해당 도메인의 모든 결과를 숨깁니다</p>

        {blockedDomains.length === 0 && (
          <p className="text-xs text-gray-400 py-2">차단된 도메인이 없어요</p>
        )}
        {blockedDomains.map(([domain, rule]) => (
          <div key={domain} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-700">{domain}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{rule.count}회</span>
              {rule.manual && <span className="text-xs text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded">수동</span>}
              <button
                onClick={() => removeDomain(domain)}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
        <AddInput onAdd={addDomain} placeholder="직접 추가..." />
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">
          차단된 키워드
          <span className="text-gray-400 font-normal ml-1">({blockedKeywords.length}개)</span>
        </h2>
        <p className="text-xs text-gray-400 mb-3">제목에 키워드가 포함된 결과는 점수에 반영됩니다</p>

        {blockedKeywords.length === 0 && (
          <p className="text-xs text-gray-400 py-2">차단된 키워드가 없어요</p>
        )}
        {blockedKeywords.map(([keyword, rule]) => (
          <div key={keyword} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-700">{keyword}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{rule.count}회</span>
              {rule.manual && <span className="text-xs text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded">수동</span>}
              <button
                onClick={() => removeKeyword(keyword)}
                className="text-xs text-red-400 hover:text-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
        <AddInput onAdd={addKeyword} placeholder="직접 추가..." />
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">자동 차단 임계값</h2>
        <p className="text-xs text-gray-400 mb-3">같은 도메인/키워드에 "광고"를 이 횟수 이상 클릭하면 자동 차단합니다</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="20"
            value={thresholdInput}
            onChange={handleThresholdChange}
            className="w-20 text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          <span className="text-sm text-gray-500">회</span>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 실행 — PASS 확인**

```bash
npm run test -- --reporter=verbose
```

Expected: 모든 FilterManagerPage 테스트 PASS

- [ ] **Step 5: Sidebar에 "필터 관리" 링크 추가**

`src/components/Sidebar.jsx`의 기존 "루틴 관리" 버튼 아래에 링크 추가:

현재:
```jsx
import { Link } from 'react-router-dom'

// ...existing imports...

      <button
        onClick={onRoutineManager}
        className="text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-gray-200 transition-colors"
      >
        루틴 관리
      </button>
```

변경 후 (`react-router-dom`의 `Link` 추가):
```jsx
import { Link } from 'react-router-dom'

// Sidebar 함수 return 내부, 루틴 관리 버튼 아래에 추가:
      <button
        onClick={onRoutineManager}
        className="text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-gray-200 transition-colors"
      >
        루틴 관리
      </button>
      <Link
        to="/filter-manager"
        target="_blank"
        className="block px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-gray-200 transition-colors"
      >
        필터 관리
      </Link>
```

- [ ] **Step 6: 전체 테스트 실행 — 전체 PASS 확인**

```bash
npm run test -- --reporter=verbose
```

Expected: 전체 테스트 PASS, 실패 없음

- [ ] **Step 7: 커밋**

```bash
git add src/views/FilterManagerPage.jsx src/views/FilterManagerPage.test.jsx src/components/Sidebar.jsx
git commit -m "feat: implement FilterManagerPage and add sidebar filter link"
```

---

## 완료 후 수동 검증 체크리스트

- [ ] `.env.local`에 Google/Naver API 키 입력 완료
- [ ] 개발 서버에서 검색창 → 검색어 입력 → 새 탭 열림 확인
- [ ] 새 탭에서 Google/Naver 결과 2컬럼 표시 확인
- [ ] 결과에서 "광고" 클릭 → 즉시 숨김 확인
- [ ] 동일 도메인 3회 "광고" 클릭 → 다음 검색에서 자동 필터링 확인
- [ ] 사이드바 "필터 관리" 클릭 → 새 탭에서 규칙 목록 표시 확인
- [ ] 필터 관리 페이지에서 도메인/키워드 수동 추가·삭제 동작 확인
- [ ] `npm run build` 빌드 오류 없음 확인
