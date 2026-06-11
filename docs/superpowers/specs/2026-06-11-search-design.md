# 검색 기능 설계 스펙

**날짜:** 2026-06-11  
**상태:** 승인됨

## 개요

대시보드 상단에 검색창을 추가한다. 검색 시 새 탭에서 커스텀 검색 결과 페이지를 열고, Google과 Naver 결과를 동시에 보여준다. 사용자가 각 결과에 "광고" / "정상" 피드백을 남기면, 시스템이 도메인·키워드 패턴을 학습해 이후 검색에서 자동으로 광고성 결과를 걸러낸다. 학습된 필터 규칙은 전용 관리 페이지에서 투명하게 확인하고 편집할 수 있다.

---

## 아키텍처

```
[대시보드 상단 SearchBar]
        ↓ 검색어 입력 + Enter
window.open('/search?q=...', '_blank')
        ↓
[/search 페이지 — 새 탭]
        ↓
[Vercel Serverless: /api/search]
   ├── Google Custom Search API 호출
   └── Naver Search API 호출
        ↓
[SearchResultsPage — 결과 렌더링]
   ├── 필터 엔진 (localStorage 규칙 적용)
   ├── 각 결과에 "광고" / "정상" 버튼
   └── 점수 초과 결과는 자동 숨김 (펼치기 가능)
        ↓
[useSearchFilter 훅]
   └── localStorage "search-filters" 키에 규칙 저장/학습
        ↓
[/filter-manager 페이지 — 필터 관리]
   ├── 차단된 도메인 목록
   ├── 차단된 키워드 목록
   └── 각 규칙의 학습 횟수 표시 + 수동 추가/삭제
```

- API 키는 Vercel 환경변수로 보호 (기존 `/api/news.js` 패턴과 동일)
- 필터 데이터는 localStorage에 저장 (기존 아키텍처 패턴 유지)
- `react-router-dom` 추가로 `/search`, `/filter-manager` 라우트 처리

---

## 컴포넌트 & 파일 구조

### 신규 파일

```
src/
  components/
    SearchBar.jsx              # 대시보드 상단 검색창
  views/
    SearchResultsPage.jsx      # /search?q=... 새 탭 결과 페이지
    FilterManagerPage.jsx      # /filter-manager 필터 관리 페이지
  hooks/
    useSearchFilter.js         # 필터 규칙 CRUD + 점수 계산 + 학습
  utils/
    filterEngine.js            # 결과 하나에 스팸 점수 계산하는 순수 함수
api/
  search.js                    # Google + Naver 동시 호출 serverless function
```

### 기존 파일 변경

| 파일 | 변경 내용 |
|---|---|
| `App.jsx` | 상단 `<SearchBar />` 추가, 라우터 적용, `/search`·`/filter-manager` 라우트 추가 |
| `storageUtils.js` | `getSearchFilters()` / `setSearchFilters()` 추가 |
| `Sidebar.jsx` | 하단에 "필터 관리" 링크 추가 |

---

## 데이터 구조

### localStorage `search-filters` 키

```js
{
  domains: {
    "tistory.com": { count: 7, blocked: true, manual: false },
    "blog.naver.com": { count: 2, blocked: false, manual: false }
  },
  keywords: {
    "협찬": { count: 12, blocked: true, manual: false },
    "리뷰노트": { count: 5, blocked: true, manual: false },
    "제공받음": { count: 3, blocked: false, manual: false }
  },
  threshold: 3   // 이 횟수 이상이면 자동 차단
}
```

- `manual: true` 플래그가 있는 규칙은 임계값 무관하게 영구 차단
- `threshold` 기본값: 3

### 초기 기본 키워드 (첫 실행 시 삽입, 기존 데이터가 있으면 덮어쓰지 않음)

`"협찬"`, `"제공받음"`, `"리뷰노트"`, `"유료광고"`, `"소정의"`, `"내돈내산 아님"`

---

## 필터 학습 흐름

### "광고" 클릭 시

```
1. 해당 결과의 도메인 count +1
2. 제목에서 명사 추출 → 각 키워드 count +1
3. count >= threshold 인 항목은 blocked: true 로 전환
4. 결과 즉시 숨김
5. 다음 검색부터 해당 규칙 자동 적용
```

### "정상" 클릭 시

```
1. 해당 도메인 count -1 (0 미만으로 내려가지 않음)
2. 관련 키워드 count -1 (0 미만으로 내려가지 않음)
3. count < threshold 인 항목은 blocked: false 로 전환
```

---

## 스팸 점수 계산 (filterEngine.js)

각 검색 결과에 대해 점수를 계산하는 순수 함수.

| 조건 | 점수 |
|---|---|
| 차단된 도메인 (`blocked: true`) | +100 |
| 차단된 키워드가 제목에 포함 (`blocked: true`) | 개당 +40 |
| 학습 중인 키워드가 제목에 포함 (`blocked: false`) | 개당 +10 |

- **점수 >= 60** → 자동 숨김 (접힌 섹션으로 표시, 이유 함께 노출)
- **점수 < 60** → 정상 표시

---

## UI

### 대시보드 상단 SearchBar

- 검색어 입력 + Enter 또는 검색 버튼 클릭 → `window.open('/search?q=검색어', '_blank')`
- 빈 검색어 입력 시 새 탭 열지 않음
- 검색어 앞뒤 공백 trim 처리

### `/search?q=검색어` — 검색 결과 페이지

```
┌─────────────────────────────────────────┐
│  🔍 [검색어............] [검색]  필터관리→ │  ← 상단 고정
├─────────────────────────────────────────┤
│  Google 결과          │  Naver 결과       │
│  ─────────────────   │  ──────────────  │
│  ■ 제목               │  ■ 제목           │
│    url.com · 요약     │    url.com · 요약 │
│    [광고] [정상]       │    [광고] [정상]  │
│                       │                  │
├─────────────────────────────────────────┤
│  ▾ 숨겨진 결과 3개 (필터에 걸림)           │  ← 접힌 상태
└─────────────────────────────────────────┘
```

- 결과 제목 클릭 → 원문 페이지 새 탭으로 이동
- `[광고]` 클릭 → 즉시 숨김 + 패턴 학습
- `[정상]` 클릭 → count 감소 (잘못 학습된 규칙 보정)
- 자동 숨김 결과는 하단 접힌 섹션에서 이유와 함께 표시

### `/filter-manager` — 필터 관리 페이지

```
┌──────────────────────────────────┐
│  필터 관리                        │
│  ─────────────────────────────   │
│  차단된 도메인    (7개)            │
│  tistory.com  [7회]  [삭제]       │
│  xxx.co.kr    [4회]  [삭제]       │
│  + 직접 추가...                   │
│                                   │
│  차단된 키워드    (5개)            │
│  협찬          [12회] [삭제]       │
│  리뷰노트       [5회]  [삭제]       │
│  + 직접 추가...                   │
│                                   │
│  자동 차단 임계값: [3] 회          │
└──────────────────────────────────┘
```

- 도메인·키워드 직접 추가 시 `manual: true` 플래그로 저장
- 임계값 수정 가능 (기본값: 3)

---

## 에러 처리

| 상황 | 처리 |
|---|---|
| Google API만 실패 | Naver 결과만 표시 + "Google 결과를 불러오지 못했어요" 안내 |
| Naver API만 실패 | Google 결과만 표시 + "Naver 결과를 불러오지 못했어요" 안내 |
| 둘 다 실패 | "검색 결과를 불러오지 못했어요" + 재시도 버튼 |
| 결과 없음 | "결과가 없어요" 표시 |
| 필터로 전부 걸러짐 | "모든 결과가 필터에 걸렸어요 — 숨겨진 결과 보기" 안내 |

---

## 환경 변수 추가

```
VITE_GOOGLE_SEARCH_API_KEY=<Google Custom Search API 키>
VITE_GOOGLE_SEARCH_ENGINE_ID=<Custom Search Engine ID>
NAVER_CLIENT_ID=<Naver 검색 API Client ID>
NAVER_CLIENT_SECRET=<Naver 검색 API Client Secret>
```

- Google·Naver 키는 `/api/search.js` serverless function에서만 사용 (클라이언트 노출 없음)
