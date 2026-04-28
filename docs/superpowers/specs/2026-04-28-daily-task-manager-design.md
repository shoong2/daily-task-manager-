# Daily Task Manager — Design Spec

**날짜**: 2026-04-28  
**상태**: 승인됨

---

## 개요

매일 해야 할 일을 날짜별로 관리하는 개인용 웹앱. 일반 할 일 직접 추가와 매일 자동 반복되는 루틴 설정을 지원한다. 날씨, 연속 달성 스트릭, 게임 뉴스 위젯을 함께 제공한다.

---

## 기술 스택

| 항목 | 선택 |
|------|------|
| 프레임워크 | React + Vite |
| 스타일 | Tailwind CSS |
| 데이터 저장 | localStorage |
| 날씨 API | OpenWeatherMap (무료, 1,000회/일) |
| 뉴스 API | NewsAPI.org + Vercel 서버리스 프록시 |
| 배포 | Vercel (무료) |
| 디자인 | 미니멀 / 클린 (흰 배경, 검은 포인트) |

---

## 컴포넌트 구조

```
App
├── Sidebar                  — 뷰 전환 (오늘 / 주간 / 달력) + 루틴 관리 링크
├── views/
│   ├── TodayView            — 오늘 날짜 고정, DayPanel 렌더
│   ├── WeekView             — 이번 주 7일 그리드 + 선택 날짜 DayPanel
│   └── CalendarView         — 월 달력 + 선택 날짜 DayPanel
├── DayPanel                 — 선택 날짜의 루틴/일반 할 일 목록
│   ├── TaskItem             — 체크박스, 이름, 삭제
│   └── AddTaskInput         — 텍스트 입력 + 루틴 여부 토글
├── RoutineManager           — 루틴 CRUD 화면
└── widgets/
    ├── StreakWidget          — 연속 달성 스트릭
    ├── WeatherWidget         — 날씨 + 미세먼지
    └── NewsWidget            — 게임 뉴스 피드
```

---

## 데이터 모델 (localStorage)

### `routines`
루틴 정의 목록. 앱 전역 설정.

```json
[
  { "id": "r1", "name": "운동하기" },
  { "id": "r2", "name": "독서 30분" }
]
```

### `tasks`
날짜별 할 일 목록. 날짜 키는 `YYYY-MM-DD` 형식.

```json
{
  "2026-04-28": [
    { "id": "r1", "name": "운동하기",  "done": true,  "type": "routine" },
    { "id": "r2", "name": "독서 30분", "done": false, "type": "routine" },
    { "id": "t1", "name": "병원 예약", "done": false, "type": "one-time" }
  ]
}
```

---

## 핵심 동작 규칙

### 날짜별 할 일 초기화
- 날짜를 열 때 해당 날짜 키가 `tasks`에 없으면 → `routines` 전체를 `done: false`로 복사해 생성
- 이미 존재하면 저장된 상태 그대로 로드
- 지난 날짜도 체크/해제 가능

### 루틴 추가
- `routines`에 추가 + 오늘 날짜 `tasks`에 즉시 반영 (`done: false`)
- 과거 날짜에는 소급 적용하지 않음

### 루틴 삭제
- `routines`에서만 제거
- 과거 날짜의 기록은 보존 (데이터 일관성 유지)

### 스트릭 계산
- localStorage `tasks`를 기반으로 오늘부터 역순으로 탐색
- 해당 날짜에 루틴 항목이 하나라도 `done: true`이면 연속으로 카운트
- 루틴이 없는 날은 스트릭 유지 (루틴 설정 전 날짜 보호)

---

## 외부 API

### 날씨 — OpenWeatherMap
- **엔드포인트**: Current Weather + Air Pollution API
- **호출 주체**: 브라우저 직접 (CORS 허용)
- **위치**: `navigator.geolocation` 자동 감지, 실패 시 서울(37.5665, 126.9780) 기본값
- **표시 정보**: 현재 온도, 날씨 상태, 오전/낮/저녁 예보, 미세먼지(PM2.5) 등급
- **API 키**: `.env` 파일 `VITE_WEATHER_API_KEY`에 보관

### 게임 뉴스 — NewsAPI.org
- **엔드포인트**: `/v2/everything?q=game+development+OR+video+games&language=en&sortBy=publishedAt`
- **호출 주체**: Vercel 서버리스 함수 `api/news.js` (CORS 우회 + API 키 서버 보관)
- **표시**: 최신 5개, 제목 + 출처 + 게시 시간
- **갱신**: 앱 로드 시마다 (브라우저 캐시 1시간)
- **API 키**: Vercel 환경변수 `NEWS_API_KEY`에 보관

---

## UI 레이아웃

### 상단: 메인 패널
```
┌─────────────────────────────────────────────────┐
│ Sidebar │  주간 그리드 (7일)  │  선택 날 할 일  │
│  오늘   │  4월 달력 + 완료율  │  루틴 / 오늘만  │
│  주간   │                    │  + 할 일 추가   │
│  달력   │                    │                 │
└─────────────────────────────────────────────────┘
```

### 하단: 위젯 3개 (가로 배치)
```
┌──────────────┬──────────────┬──────────────────────┐
│  연속 달성   │    날씨      │     게임 뉴스         │
│  🔥 7일 연속 │  ⛅ 18°     │  기사 제목 · 출처     │
│  ■■■■■■■    │  미세먼지 좋음│  기사 제목 · 출처     │
└──────────────┴──────────────┴──────────────────────┘
```

---

## 배포

- GitHub 레포 → Vercel 연결, `main` 브랜치 push 시 자동 배포
- 환경변수 Vercel 대시보드에서 설정:
  - `VITE_WEATHER_API_KEY` — OpenWeatherMap 키
  - `NEWS_API_KEY` — NewsAPI 키
- `api/news.js` Vercel 서버리스 함수로 뉴스 프록시

---

## 범위 밖 (이번 버전 미포함)

- 로그인 / 계정 기능
- 모바일 앱
- 다기기 동기화
- 알림 / 푸시
- 할 일 우선순위, 태그
