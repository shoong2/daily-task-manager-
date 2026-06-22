# 청약·취업 위젯 설계 (HousingWidget / JobsWidget)

**날짜:** 2026-06-22
**브랜치:** TBD (구현 시 생성)

## 목적

메인 대시보드 맨 아래 행에 청약(경기도 LH 임대)과 취업(잡아바: 경기데이터드림) 정보를 보여주는 위젯 2개를 추가한다. 별도 라우트 없이 스크롤로 도달.

## 범위

**포함:**

- 경기도 LH 임대주택 공고 (공공임대 / 매입임대 / 행복주택)
- 잡아바 — 경기도 일자리 (전체 + 키워드 검색)
- 위젯 내부 페이지네이션 (5건/페이지, `‹ 1/N ›` 형태)
- 카테고리 칩 (청약) / 탭 (취업)
- 새로고침 버튼

**제외:**

- 워크넷 — 보유 키가 개인회원 등급이라 채용정보 OpenAPI 호출 불가 (`"개인회원은 사용할 수 없는 OPEN-API"`). 빼고 진행.
- 게임잡 등 비공식 크롤링 — 약관 위반·HTML 파편화·봇 차단·서버리스 부적합으로 본 spec에선 다루지 않음.
- 잡알리오 — 사용자 요청으로 제외.
- 별도 라우트 (`/jobs`, `/housing` 없음).
- 알림/즐겨찾기 같은 부가 기능 (YAGNI).

## 아키텍처

### 데이터 흐름

```
브라우저 위젯
  ↓ fetch
Vercel Serverless (api/housing.js, api/jobs.js)
  ↓ 외부 호출 + 정규화 + 30분 캐시
공공데이터포털(LH) / 경기데이터드림(잡아바)
```

위젯은 키를 절대 모르며, 모든 외부 호출은 서버리스에서만. 기존 `news.js`·`search.js` 패턴 그대로.

### 외부 API · 인증키

| 출처 | 도메인 | 환경변수 | 용도 |
|---|---|---|---|
| 공공데이터포털 — LH 임대주택공고 | `apis.data.go.kr` | `DATA_GO_KR_KEY` | 청약 위젯 |
| 경기데이터드림 — 잡아바 (경기 일자리) | `openapi.gg.go.kr` | `GG_DATA_KEY` | 취업 위젯 (전체 + 키워드 검색) |

두 키 모두 `.env.local`과 Vercel 환경변수에 설정. 키 누락 시 해당 위젯만 명확한 에러 메시지를 표시하고 다른 부분은 정상 동작.

### 캐싱

서버리스 응답 헤더:

```
Cache-Control: s-maxage=1800, stale-while-revalidate=3600
```

청약·취업 공고는 분 단위로 바뀌지 않아 30분 캐시 + 1시간 SWR가 적절. 새로고침 버튼은 단순 `fetch` 재호출이며 캐시 무효화는 하지 않음 (캐시 만료를 기다림).

## 새 파일

```
api/
  housing.js                  # GET /api/housing
  jobs.js                     # GET /api/jobs?keyword=...
src/
  widgets/
    HousingWidget.jsx
    HousingWidget.test.jsx
    JobsWidget.jsx
    JobsWidget.test.jsx
    Pagination.jsx            # 공용
    Pagination.test.jsx
  hooks/
    useJobKeywords.js
    useJobKeywords.test.js
```

`src/utils/storageUtils.js`에 `'job-keywords'` 스토리지 키 상수 추가.

## 서버리스 함수 명세

### `GET /api/housing`

- 외부 호출: `https://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1`
  - 파라미터: `serviceKey=$DATA_GO_KR_KEY&CNP_CD=41&PG_SZ=50&PAGE=1` (CNP_CD=41 = 경기도, 50건 over-fetch 후 필터)
- 필터링: 응답 `[0].dsList` 중 `UPP_AIS_TP_NM === '임대주택'`만 통과 (토지·분양주택 제외)
- 정규화:

```js
{
  items: [
    {
      id: string,            // PAN_ID
      title: string,         // PAN_NM (공고명 — 위치 포함됨)
      type: '공공임대' | '매입임대' | '행복주택' | '기타',
      deadline: string,      // 'YYYY-MM-DD' (CLSG_DT "2026.07.06" → "2026-07-06")
      status: string,        // PAN_SS ('공고중' 등)
      url: string,           // DTL_URL
    },
    ...
  ],
  error: null | string,
}
```

- 키 미설정: `{ items: [], error: 'API key missing' }` 반환, HTTP 200
- 외부 호출 실패: `{ items: [], error: <외부 에러 메시지> }` 반환, HTTP 200
- 유형 매핑 (AIS_TP_CD_NM 기준):
  - "영구임대" / "국민임대" / "공공임대" → `'공공임대'`
  - "매입임대" → `'매입임대'`
  - "행복주택" → `'행복주택'`
  - 그 외 (전세임대 등) → `'기타'` ("전체" 칩에서만 노출)
- 응답 경로: `json[0].dsList[]`. 응답 헤더 `json[0].resHeader[0].SS_CODE !== 'Y'`이면 에러로 처리.

### `GET /api/jobs`

쿼리:

- `keyword`: 옵션. 미지정 시 최신 채용공고, 지정 시 키워드 매칭 후 반환.

외부 호출: `https://openapi.gg.go.kr/GGJOBABARECRUSTM`

- 파라미터: `KEY=$GG_DATA_KEY&Type=json&pIndex=1&pSize=$FETCH_SIZE`
- `FETCH_SIZE`:
  - 키워드 없음 → `30`
  - 키워드 있음 → `200` (좁은 검색에서도 매칭 확보 위해 over-fetch)
- **⚠️ `User-Agent: Mozilla/5.0 ...` 헤더 필수.** 미설정 시 "보안 정책에 의해 차단" HTML 반환.

키워드 필터링 (서버리스 측):

- 잡아바 API에 keyword 파라미터 없어 서버에서 필터.
- 매칭 필드: `PBANC_CONT`(공고제목), `ENTRPRS_NM`(회사명), `RECRUT_FIELD_NM`(직군명)
- 매칭 규칙: 대소문자 무시, 한 키워드라도 위 3개 필드 중 하나에 포함되면 통과
- 매칭 후 최대 30건만 반환

정규화 응답:

```js
{
  items: [
    {
      id: string,            // URL (dedupe key)
      title: string,         // PBANC_CONT
      organization: string,  // ENTRPRS_NM
      employmentType: string,// PBANC_FORM_DIV ('정규직' 등)
      region: string | null, // WORK_REGION_CONT ('용인시' 등)
      deadline: string,      // RCPT_END_DE "20260628" → "2026-06-28"
      url: string,           // URL
    },
    ...
  ],
  error: null | string,
}
```

응답 경로: `json.GGJOBABARECRUSTM[1].row[]`. 응답 헤더 `json.GGJOBABARECRUSTM[0].head` 의 `RESULT.CODE !== 'INFO-000'`이면 에러로 처리.

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
- 리스트: title 한 줄 + `type · 접수 ~deadline` 부제목
- 로딩: 기존 `NewsWidget` 스타일의 skeleton 3줄
- 에러: 메시지만 텍스트로
- 빈 결과 (필터 후 0건 포함): "공고가 없습니다"
- 푸터: `Pagination` (filtered.length > 5일 때만)

### `JobsWidget`

**상태:**

```js
const [tab, setTab] = useState('all')                    // 'all' | 'keyword'
const [data, setData] = useState({ all: null, keyword: null })
const [loading, setLoading] = useState({ all: false, keyword: false })
const [error, setError] = useState({ all: null, keyword: null })
const [page, setPage] = useState({ all: 0, keyword: 0 })
const { keywords, addKeyword, removeKeyword } = useJobKeywords()
```

**Lazy fetch:**

- 첫 mount: `tab='all'`이므로 all만 fetch (`GET /api/jobs`)
- 탭 클릭 시 `data[clickedTab] === null && !loading[clickedTab]`이면 해당 탭 fetch
- 키워드 탭 페치: `keywords`가 변경되면(`useEffect([keywords])`) 재페치
- 새로고침 버튼: 현재 탭만 재페치 (`data[tab] = null` → 다음 effect에서 fetch)

**키워드 탭 페치 로직:**

```js
if (keywords.length === 0) return // 페치 skip
const responses = await Promise.allSettled(
  keywords.map(kw => fetch(`/api/jobs?keyword=${encodeURIComponent(kw)}`).then(r => r.json()))
)
const merged = responses
  .filter(r => r.status === 'fulfilled' && r.value.items)
  .flatMap(r => r.value.items)
const deduped = Array.from(new Map(merged.map(item => [item.url, item])).values())
```

키워드 0개일 땐 "키워드를 추가하세요" 메시지 + 칩 UI만 표시.

**렌더링:**

- 헤더: 타이틀 + 새로고침 아이콘
- 탭 2개: `전체 / 키워드 검색`
- 리스트: `data[tab]`의 5건 슬라이스 (각 항목: title / `organization · region · employmentType · ~deadline`)
- 키워드 탭만: 리스트 위에 키워드 칩 영역 (`× 삭제` + `+ 추가` 인풋)
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
| 키워드 0개 | "키워드 검색" 탭에서 안내 + 칩 UI만 |
| 단일 키워드 실패 | `Promise.allSettled`로 다른 키워드 결과는 그대로 노출 |
| 잡아바 봇 차단 (UA 미설정) | 서버리스 측 버그 — 테스트로 회귀 방지 |

## 테스트 전략

| 대상 | 검증 |
|---|---|
| `useJobKeywords` | 추가/삭제/중복 방지/localStorage 동기화 |
| `Pagination` | page 변경 콜백, 양 끝에서 disabled, totalPages<=1이면 null |
| `HousingWidget` | 로딩 skeleton → fetch mock → 리스트 표시 / 카테고리 칩 클릭 시 필터링 + page=0 리셋 / 페이지 변경 시 다른 5건 표시 / 에러 표시 |
| `JobsWidget` | 첫 mount는 all만 fetch / 탭 클릭 시 keyword 탭 lazy fetch / 키워드 추가→재페치 / 빈 키워드 메시지 |
| `api/housing.js` | 외부 fetch mock, `UPP_AIS_TP_NM` 필터, 유형 매핑, 키 미설정 분기, 에러 분기, SS_CODE!==Y 에러 |
| `api/jobs.js` | UA 헤더 포함 확인, keyword 없을 때 30건 / 키워드 매칭 로직 (대소문자·다중 필드) / 정규화 |

모든 외부 fetch는 vitest `vi.spyOn(global, 'fetch')` 또는 동등 패턴으로 mock. 기존 `news.js` 테스트 패턴이 있으면 따름.

## 미해결 / 후속

- **사람인 통합 (Future):** 사용자가 사람인 OpenAPI 활용신청 중. 발급 후 `api/jobs.js`에 source 분기 추가 (현 spec은 잡아바만이지만 source 확장 여지 있게 작성).
- **키워드 검색 over-fetch 사이즈:** 200건이 부족한 경우(매우 좁은 키워드) 매칭 0건 가능. 운영 후 필요시 페이지 순회로 확장.
- **게임잡 RSS 가능 여부:** 별도 확인 가능하나 본 spec 범위 외.
