# 청약·취업 위젯 설계 (HousingWidget / JobsWidget)

**날짜:** 2026-06-22
**브랜치:** TBD (구현 시 생성)

## 목적

메인 대시보드 맨 아래 행에 청약(경기도 LH 임대)과 취업(잡아바·워크넷·키워드 검색) 정보를 보여주는 위젯 2개를 추가한다. 별도 라우트 없이 스크롤로 도달.

## 범위

**포함:**

- 경기도 LH 임대주택 공고 (공공임대 / 매입임대 / 행복주택)
- 잡아바 (경기데이터드림이 제공하는 경기도 공공 일자리 정보 — 일반 기업 포함)
- 워크넷 채용공고 (전국 일반)
- 워크넷 키워드 검색 (사용자 저장 키워드 N개로 호출 후 결과 합침)
- 위젯 내부 페이지네이션 (5건/페이지, `‹ 1/N ›` 형태)
- 카테고리 칩 (청약) / 탭 (취업)
- 새로고침 버튼

**제외:**

- 게임잡 등 비공식 크롤링 (약관·안정성 이슈)
- 잡알리오 (사용자 요청으로 제외)
- 별도 페이지 (`/jobs`, `/housing` 라우트 없음 — 메인 위젯만)
- 알림/즐겨찾기 같은 부가 기능 (YAGNI)

## 아키텍처

### 데이터 흐름

```
브라우저 위젯
  ↓ fetch
Vercel Serverless (api/housing.js, api/jobs.js)
  ↓ 외부 호출 + 정규화 + 30분 캐시
공공데이터포털 / 경기데이터드림 / 워크넷 OpenAPI
```

위젯은 자체 키를 절대 모르고, 모든 외부 호출은 서버리스에서만 수행 (기존 `news.js`·`search.js` 패턴 그대로).

### 외부 API · 인증키

| 출처 | 도메인 | 환경변수 | 용도 |
|---|---|---|---|
| 공공데이터포털 — LH 임대주택공고 | `apis.data.go.kr` | `DATA_GO_KR_KEY` | 청약 위젯 |
| 경기데이터드림 — 경기도 공공 일자리 (잡아바) | `openapi.gg.go.kr` | `GG_DATA_KEY` | 취업 위젯 "잡아바" 탭 |
| 워크넷 OpenAPI — 채용정보 | `apis.work.go.kr` | `WORKNET_API_KEY` | 취업 위젯 "워크넷" + "키워드" 탭 |

세 키 모두 `.env.local`과 Vercel 환경변수에 각각 설정. 키 누락 시 해당 위젯/탭만 명확한 에러 메시지를 표시하고 다른 부분은 정상 동작.

### 캐싱

서버리스 응답 헤더:

```
Cache-Control: s-maxage=1800, stale-while-revalidate=3600
```

청약·취업 공고는 분 단위로 바뀌지 않아 30분 캐시 + 1시간 SWR가 적절. 위젯의 새로고침 버튼(↻)은 단순히 `fetch` 재호출이며, 캐시 무효화는 하지 않음 (캐시 만료를 기다림).

## 새 파일

```
api/
  housing.js                  # GET /api/housing → 경기도 LH 임대 30건
  jobs.js                     # GET /api/jobs?source=jobaba|worknet&keyword=... → 통일된 응답
src/
  widgets/
    HousingWidget.jsx
    HousingWidget.test.jsx
    JobsWidget.jsx
    JobsWidget.test.jsx
    Pagination.jsx            # 공용: ‹ page/totalPages › 컴포넌트
    Pagination.test.jsx
  hooks/
    useJobKeywords.js         # localStorage CRUD
    useJobKeywords.test.js
```

`src/utils/storageUtils.js`에 `'job-keywords'` 스토리지 키 상수 추가.

## 서버리스 함수 명세

### `GET /api/housing`

- 외부 호출: 공공데이터포털 LH 임대주택공고 API에 `지역=경기도` 또는 동등 파라미터로 30건 요청
- 정규화: 응답을 다음 shape로 변환

```js
{
  items: [
    {
      id: string,            // 공고번호 또는 dedupe key
      title: string,         // 공고명
      type: '공공임대' | '매입임대' | '행복주택' | '기타',
      district: string,      // 시군구
      deadline: string,      // 'YYYY-MM-DD' (접수 마감)
      units: number | null,  // 모집 세대수
      url: string,           // 상세 페이지 링크
    },
    ...
  ],
  error: null | string,
}
```

- 키 미설정: `{ items: [], error: 'API key missing' }` 반환, HTTP 200
- 외부 호출 실패: `{ items: [], error: <외부 에러 메시지> }` 반환, HTTP 200
- 타입 판별: 공고명 또는 응답 필드에서 키워드 매칭 ("행복주택", "매입임대", "공공임대"). 매칭 안 되면 `'기타'`.

### `GET /api/jobs`

쿼리:

- `source`: `jobaba` | `worknet` (필수)
- `keyword`: 워크넷 키워드 검색용 (옵션, source=worknet일 때만 사용)

정규화 응답:

```js
{
  items: [
    {
      id: string,            // 공고 ID 또는 dedupe key (URL)
      title: string,
      organization: string,  // 회사명/기관명
      employmentType: string,// '정규직' | '계약직' | '인턴' 등 가능하면 원본 그대로
      deadline: string,      // 'YYYY-MM-DD' 또는 'YYYY-MM-DD HH:mm' (가능한 한 정규화)
      url: string,
    },
    ...
  ],
  error: null | string,
}
```

소스별 동작:

- `source=jobaba`: 경기데이터드림 API에 30건 요청
- `source=worknet` & no keyword: 워크넷 채용정보 최근 30건
- `source=worknet` & keyword: 해당 키워드로 워크넷 검색 30건

## 컴포넌트 명세

### `HousingWidget`

**상태:**

```js
const [items, setItems] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)
const [category, setCategory] = useState('전체') // '전체' | '공공임대' | '매입임대' | '행복주택'
const [page, setPage] = useState(0)
```

**동작:**

- mount 시 `/api/housing` 1회 호출, `items`에 저장
- `useMemo`로 `filtered = category === '전체' ? items : items.filter(i => i.type === category)`
- `useMemo`로 `pageSize = 5`, `totalPages = Math.ceil(filtered.length / pageSize)`, `visible = filtered.slice(page * 5, page * 5 + 5)`
- 카테고리 변경 시 `page=0` 리셋
- 새로고침 버튼: `setLoading(true)` + 재호출

**렌더링:**

- 헤더: 타이틀 + 새로고침 아이콘
- 칩 4개: 전체 / 공공임대 / 매입임대 / 행복주택 (선택된 칩은 dark)
- 리스트: title, type/district/deadline/units 한 줄 요약
- 로딩: 기존 `NewsWidget` 스타일의 skeleton 3줄
- 에러: 메시지만 텍스트로
- 빈 결과 (필터 후 0건 포함): "공고가 없습니다"
- 푸터: `Pagination` 컴포넌트 (filtered.length > 5일 때만)

### `JobsWidget`

**상태:**

```js
const [tab, setTab] = useState('jobaba') // 'jobaba' | 'worknet' | 'keyword'
const [data, setData] = useState({ jobaba: null, worknet: null, keyword: null })
const [loading, setLoading] = useState({ jobaba: false, worknet: false, keyword: false })
const [error, setError] = useState({ jobaba: null, worknet: null, keyword: null })
const [page, setPage] = useState({ jobaba: 0, worknet: 0, keyword: 0 })
const { keywords, addKeyword, removeKeyword } = useJobKeywords()
```

**Lazy fetch:**

- 첫 mount: `tab='jobaba'`이므로 jobaba만 fetch
- 탭 클릭 시 `data[clickedTab] === null && !loading[clickedTab]` 이면 해당 탭 fetch
- 키워드 탭: 키워드 배열이 변경되면 (`useEffect([keywords])`) 재페치
- 새로고침 버튼: 현재 탭만 재페치 (`data[tab] = null` → fetch)

**키워드 탭 페치 로직:**

```js
const responses = await Promise.allSettled(
  keywords.map(kw => fetch(`/api/jobs?source=worknet&keyword=${encodeURIComponent(kw)}`).then(r => r.json()))
)
const merged = responses
  .filter(r => r.status === 'fulfilled' && r.value.items)
  .flatMap(r => r.value.items)
const deduped = Array.from(new Map(merged.map(item => [item.url, item])).values())
```

키워드 0개일 땐 페치 skip, "키워드를 추가하세요" 메시지 표시.

**렌더링:**

- 헤더: 타이틀 + 새로고침 아이콘
- 탭 3개: 잡아바 / 워크넷 / 키워드 검색
- 리스트: `data[tab]`의 5건 슬라이스
- 키워드 탭만: 리스트 위에 키워드 칩 영역 (`× 삭제` + `+ 추가` 버튼)
- 푸터: `Pagination` (해당 탭 totalPages > 1일 때만)

### `Pagination` (공용)

**Props:** `page`, `totalPages`, `onChange(newPage)`

**렌더링:** `‹ {page+1}/{totalPages} ›` — page=0이면 ‹ disabled, page=totalPages-1이면 › disabled.

`totalPages <= 1`이면 컴포넌트 자체가 `null` 반환.

## 훅 명세

### `useJobKeywords`

`useBookmarks` 패턴 그대로.

```js
const STORAGE_KEY = 'job-keywords'

export function useJobKeywords() {
  const [keywords, setKeywords] = useState(() => readStorage(STORAGE_KEY) || [])

  const addKeyword = useCallback((text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setKeywords(prev => {
      if (prev.includes(trimmed)) return prev // 중복 방지
      const next = [...prev, trimmed]
      writeStorage(STORAGE_KEY, next)
      return next
    })
  }, [])

  const removeKeyword = useCallback((text) => {
    setKeywords(prev => {
      const next = prev.filter(k => k !== text)
      writeStorage(STORAGE_KEY, next)
      return next
    })
  }, [])

  return { keywords, addKeyword, removeKeyword }
}
```

ID는 키워드 문자열 자체 (중복 방지 + 단순성).

## 레이아웃 통합

`App.jsx`의 위젯 그리드 아래 새 행 추가:

```jsx
{/* 기존 */}
<div className="grid grid-cols-[1fr_1fr_2fr] gap-4">
  <StreakWidget />
  <WeatherWidget />
  <NewsWidget />
</div>
<BookmarksWidget />

{/* 추가 */}
<div className="grid grid-cols-2 gap-4">
  <HousingWidget />
  <JobsWidget />
</div>
```

## 에러 처리

| 상황 | 동작 |
|---|---|
| 환경변수 미설정 | 서버리스가 `error: 'API key missing'` 반환 → 위젯이 "API 키가 설정되지 않았습니다" 표시 |
| 외부 API 실패 | 서버리스가 `error: <message>` 반환 → 위젯이 "데이터를 불러올 수 없습니다" + ↻ 활성 |
| 빈 결과 | "공고가 없습니다" |
| 키워드 0개 | "키워드 검색 탭" 에서 "키워드를 추가하세요" 안내 + 칩 UI만 |
| 단일 키워드 실패 | `Promise.allSettled`로 다른 키워드 결과는 그대로 보여줌 |

## 테스트 전략

| 대상 | 검증 |
|---|---|
| `useJobKeywords` | 추가/삭제/중복 방지/localStorage 동기화 |
| `Pagination` | page 변경 콜백, 양 끝에서 disabled, totalPages<=1이면 null |
| `HousingWidget` | 로딩 skeleton → fetch mock → 리스트 표시 / 카테고리 칩 클릭 시 필터링 + page=0 리셋 / 페이지 변경 시 다른 5건 표시 / 에러 표시 |
| `JobsWidget` | 첫 mount는 jobaba만 fetch, 탭 클릭 시 해당 탭만 fetch / 키워드 추가→재페치 / 빈 키워드 메시지 |
| `api/housing.js` | 외부 fetch mock, 정규화 로직, 키 미설정 분기, 에러 분기 |
| `api/jobs.js` | source별 분기, keyword 파라미터, 정규화 |

모든 외부 fetch는 vitest `vi.spyOn(global, 'fetch')` 또는 동등 패턴으로 mock. 기존 `news.js` 테스트 패턴이 있으면 따름.

## 미해결 / 후속

- 실제 LH·경기데이터드림·워크넷 API 응답 schema는 키 발급 후 샘플로 확인 필요. 정규화 매핑은 그때 확정.
- 워크넷 키워드 N개 동시 호출 시 rate limit 우려 — 일일 한도 확인 후 필요시 디바운스 또는 직렬 호출로 변경.
- 게임잡 RSS 가능 여부는 별도로 확인 가능하지만 본 spec 범위 외.
