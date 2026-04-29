# daily-task-manager

개인 대시보드 앱 — 할일 관리, 날씨, 게임 뉴스, 스트릭, 북마크.

## 스택

- **React 19** + **Vite 8**
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
```

날씨 위젯은 키가 없으면 에러 메시지를 표시하고 graceful하게 처리.  
뉴스는 `/api/news` Vercel serverless function을 통해 호출 (키 노출 방지).

## 프로젝트 구조

```
src/
  App.jsx                    # 루트 — 레이아웃, 상태 조합
  components/
    Sidebar.jsx              # 좌측 네비 (오늘/주간/달력/루틴 관리)
    DayPanel.jsx             # 날짜별 할일 패널 (루틴 + 오늘만)
    TaskItem.jsx             # 체크박스 + 삭제 버튼 단일 항목
    AddTaskInput.jsx         # 할일 추가 폼 (루틴 토글 포함)
    SomedayPanel.jsx         # 언젠가 할 일 패널 (완료 전까지 영구 유지)
    RoutineManager.jsx       # 루틴 추가/삭제 모달
  views/
    TodayView.jsx            # 오늘 날짜 DayPanel 래퍼
    WeekView.jsx             # 7일 주간 뷰
    CalendarView.jsx         # 월 달력 뷰
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
  utils/
    dateUtils.js             # today(), toDateKey(), formatDisplay()
    storageUtils.js          # localStorage read/write (tasks, routines, someday-tasks, bookmarks)
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

### 할일 타입
- `type: 'routine'` — 루틴에서 생성, 매일 자동 추가
- `type: 'one-time'` — 특정 날 하루만

### ID 생성
`crypto.randomUUID()` (브라우저 네이티브, 외부 라이브러리 없음)

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
