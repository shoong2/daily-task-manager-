# daily-task-manager

개인 대시보드 앱 — 할일 관리, 날씨, 게임 뉴스, 스트릭, 북마크.

## 스택

- **React 19** + **Vite 8**
- **react-router-dom 7** (`/`, `/search`, `/filter-manager` 라우팅)
- **Tailwind CSS 3** (유틸리티 클래스, 별도 CSS 파일 없음)
- **Vitest** + **@testing-library/react** (단위·훅 테스트)
- **Vercel** 배포 (GitHub `main` 푸시 → 자동 배포)

## 커맨드

```bash
npm run dev       # 개발 서버
npm run build     # 프로덕션 빌드
npm run test      # 테스트 실행
npm run preview   # 빌드 결과 로컬 프리뷰
```

## 환경 변수

`.env.local` 파일에 설정:

```
VITE_WEATHER_API_KEY=<OpenWeatherMap API 키>
VITE_NEWS_API_KEY=<NewsAPI 키>
NAVER_CLIENT_ID=<네이버 검색 API 클라이언트 ID>
NAVER_CLIENT_SECRET=<네이버 검색 API 시크릿>
```

날씨 위젯은 키가 없으면 에러 메시지를 표시하고 graceful하게 처리.  
뉴스(`/api/news`)와 검색(`/api/search`)은 Vercel serverless function 경유 (키 노출 방지).

## 프로젝트 구조

```
api/
  news.js                    # 게임 뉴스 프록시 (NewsAPI)
  search.js                  # 네이버 검색 프록시 (블로그+웹 병렬 호출)
src/
  main.jsx                   # BrowserRouter + Routes (/, /search, /filter-manager)
  App.jsx                    # 루트 — 레이아웃, 상태 조합
  components/
    Sidebar.jsx              # 좌측 네비 (오늘/주간/달력/루틴/필터 관리)
    DayPanel.jsx             # 날짜별 할일 패널 (루틴 + 오늘만)
    TaskItem.jsx             # 체크박스 + 삭제 버튼 단일 항목
    AddTaskInput.jsx         # 할일 추가 폼 (루틴 토글 포함)
    SomedayPanel.jsx         # 언젠가 할 일 패널 (완료 전까지 영구 유지)
    RoutineManager.jsx       # 루틴 추가/삭제 모달
    SearchBar.jsx            # 상단 검색창 (Enter → /search 새 탭)
  views/
    TodayView.jsx            # 오늘 날짜 DayPanel 래퍼
    WeekView.jsx             # 7일 주간 뷰
    CalendarView.jsx         # 월 달력 뷰
    SearchResultsPage.jsx    # /search?q= — 결과 + 광고/정상 피드백
    FilterManagerPage.jsx    # /filter-manager — 차단 도메인·키워드·threshold 관리
  widgets/
    StreakWidget.jsx          # 최근 7일 루틴 연속 달성 현황
    WeatherWidget.jsx        # 현재 날씨 + 시간대별 예보 + PM2.5
    NewsWidget.jsx           # 한국 게임 뉴스 (NewsAPI)
    BookmarksWidget.jsx      # 자주 방문하는 사이트 등록/이동
  hooks/
    useTasks.js              # 날짜별 할일 CRUD (localStorage)
    useRoutines.js           # 루틴 목록 CRUD (localStorage)
    useStreak.js             # 연속 달성일 계산
    useSomedayTasks.js       # 언젠가 할 일 CRUD (localStorage)
    useBookmarks.js          # 북마크 CRUD (localStorage)
    useSearchFilter.js       # 도메인·키워드 학습 + CRUD (markAsAd / markAsNormal)
  utils/
    dateUtils.js             # today(), toDateKey(), formatDisplay()
    storageUtils.js          # localStorage read/write (tasks/routines/someday/bookmarks/search-filters)
    filterEngine.js          # extractDomain, extractKeywords, scoreResult — 스팸 점수 순수 함수
```

## 아키텍처 패턴

### 상태 관리
전역 상태 라이브러리 없음. 모든 상태는 커스텀 훅에서 `useState` + `useCallback`으로 관리하고, 변경 시 즉시 `localStorage`에 동기 저장.

### 스토리지 키
| 키 | 내용 |
|---|---|
| `tasks` | `{ [dateKey]: Task[] }` — 날짜별 할일 |
| `routines` | `Routine[]` — 루틴 목록 |
| `someday-tasks` | `Task[]` — 언젠가 할 일 (날짜 없음, 영구 보관) |
| `bookmarks` | `Bookmark[]` — 사이트 북마크 |
| `search-filters` | `{ domains, keywords, threshold }` — 학습된 광고 차단 규칙 |

### 할일 타입
- `type: 'routine'` — 루틴에서 생성, 매일 자동 추가
- `type: 'one-time'` — 특정 날 하루만

### ID 생성
`crypto.randomUUID()` (브라우저 네이티브, 외부 라이브러리 없음)

### 검색 + 광고 학습 필터
`/api/search`가 네이버 블로그(`/blog.json`)와 웹(`/webkr.json`) 엔드포인트를 `Promise.allSettled`로 병렬 호출, URL 중복 제거 후 블로그 우선으로 합쳐서 반환. 결과 각 항목에 **광고/정상** 버튼이 있어 클릭하면 `useSearchFilter`가 localStorage에 누적 학습.

- `filterEngine.scoreResult`: 차단 도메인 +100, 차단 키워드 +40, 학습 중 키워드 +10. 점수 ≥ 60이면 숨김.
- `extractDomain`: 블로그 플랫폼은 **블로거 ID 단위**까지 추출 (`blog.naver.com/userId`, `brunch.co.kr/@writer`, `velog.io/@user`). 일반 도메인은 hostname만. → 한 블로거 차단이 같은 호스트의 다른 블로거에 번지지 않음.
- 자동 차단 threshold(기본 3): 같은 키/도메인이 광고로 N번 마킹되면 `blocked: true`. 수동 추가는 `manual: true`로 학습에 영향 안 받음.
- 디폴트 차단 키워드: `협찬`, `제공받음`, `리뷰노트`, `유료광고`, `소정의`, `내돈내산 아님`.

## 레이아웃

```
[Sidebar] | [메인 뷰 (flex-1)] | [SomedayPanel (w-72)]
          | [StreakWidget][WeatherWidget][NewsWidget (2fr)]
          | [BookmarksWidget (full width)]
```

- 메인 상단 카드: 현재 뷰(오늘/주간/달력) + 언젠가 할 일 패널이 flex row
- 하단 위젯 그리드: `grid-cols-[1fr_1fr_2fr]`
- 북마크 위젯: 그리드 아래 별도 행

## 배포

GitHub `main` 브랜치 푸시 시 Vercel이 자동 빌드·배포.  
수동 배포: `npx vercel --prod`

프로덕션 URL: https://ai-dashboard-nine-orcin.vercel.app
