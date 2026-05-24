# fe-perf-lab

실시간 대용량 자산 트레이딩 대시보드 도메인을 통해 React 성능 최적화를 **Before → Profile → After** 방식으로 직접 체감하는 실험 프로젝트.

> 참고 문서: [fe-8.md](https://github.com/maeil-mail/maeil-mail-contents/blob/main/frontend/contents/fe-8.md) · [fe-19.md](https://github.com/maeil-mail/maeil-mail-contents/blob/main/frontend/contents/fe-19.md)

---

## 실행

```bash
npm install
npm run dev   # http://localhost:5173
```

---

## 프로젝트 구조

```
src/
├── entities/asset/
│   └── types.ts                  # Asset 인터페이스 (updatedAt 포함)
├── shared/lib/
│   └── mockGenerator.ts          # 1000개 자산 생성 + 이미지 URL 분기
├── store/
│   └── assetStore.ts             # Zustand — 스트리밍 시뮬레이터 + 실험 파라미터
├── components/
│   ├── before/AssetRow.tsx       # ❌ Phase 1 Before (memo 없음)
│   ├── after/AssetRow.tsx        # ✅ Phase 1 After (React.memo)
│   ├── p2before/AssetRow.tsx     # ❌ Phase 2 Before (width + background-color)
│   ├── p2after/AssetRow.tsx      # ✅ Phase 2 After (transform + opacity)
│   └── StreamingControls.tsx     # 주기 / 비율 / 참조 무결성 / 이미지 컨트롤
└── pages/
    ├── DashboardBefore.tsx       # Phase 1 ❌
    ├── DashboardAfter.tsx        # Phase 1 ✅
    ├── Phase2Before.tsx          # Phase 2 ❌
    ├── Phase2After.tsx           # Phase 2 ✅
    └── Phase3Page.tsx            # Phase 3 번들 최적화 실험
```

---

## 스트리밍 시뮬레이터 파라미터

| 파라미터 | 설명 | 실험 목적 |
|---|---|---|
| **업데이트 주기** | 50ms = 초당 20회 상태 변경 | 주기를 줄일수록 Before/After 차이가 극명해짐 |
| **업데이트 비율** | 1% = 1000개 중 약 10개만 실제 변경 | 나머지 990개는 값이 그대로인데도 리렌더되는지 확인 |
| **참조 무결성 깨기** | 값이 같아도 `{ ...asset }` 으로 새 객체 반환 | `React.memo` shallow compare 실패 원인 체험 |

---

## Phase 1 — 렌더링 최적화 (`React.memo` / `useCallback` / `useMemo`)

### 핵심 질문
> "0.1초마다 10개 행만 바뀌는데, 왜 200개가 전부 리렌더될까?"

### Before (비최적화)
- `memo` 없음 → 부모가 리렌더되면 자식 200개 전체 리렌더
- `onSelect`가 렌더마다 새 함수 생성 → 설령 memo가 있어도 props가 바뀐 것으로 판단
- `filteredAssets`, `totalVolume`이 렌더마다 재계산

### After (최적화)
- `React.memo(AssetRow)` → props가 바뀐 행만 리렌더
- `useCallback(onSelect)` → 함수 레퍼런스 안정, memo 효과 보존
- `useMemo(filteredAssets, totalVolume)` → 의존값이 실제로 바뀔 때만 재계산

### 확인 방법 (React DevTools Profiler)

**준비**
1. Chrome 확장 **React Developer Tools** 설치
2. DevTools → Profiler 탭
3. ⚙️ → "Record why each component rendered" 체크

**실험 A: Before vs After**
1. Before 탭 선택 → Profiler ⏺ 녹화 시작
2. 스트리밍 시작 → 3~5초 후 중단 → Profiler ⏹ 중지
3. 불꽃 그래프에서 `AssetRow` 200개가 전부 리렌더된 것 확인
4. After 탭으로 전환해 동일 반복 → 변경된 행 몇 개만 리렌더 확인

> 각 컴포넌트에 마우스 올리면 "The parent component rendered" / "Props changed" 이유 표시

**실험 B: memo가 있어도 실패하는 경우**
1. After 탭 유지 → "참조 무결성 깨기" 체크 ON
2. 동일하게 Profiler 측정
3. memo가 있어도 200개 전체 리렌더되는 것 확인

```
Before          : memo ❌ → 전체 리렌더 (이유: 부모 리렌더)
After           : memo ✅ → 변경 행만 리렌더
After + broken  : memo ✅ + 새 객체 참조 → 전체 리렌더 (이유: shallow compare 실패)
```

**콘솔로 수치 확인하기**

`after/AssetRow.tsx`에 임시로 추가:
```ts
const AssetRow = memo(function AssetRow({ asset, onSelect }: Props) {
  console.count(`render:${asset.id}`); // 추가
  ...
```
Before는 스트리밍 1틱마다 200개 카운트가 올라가고, After는 실제 변경 항목만 올라간다.

---

## Phase 2 — Reflow / Repaint 최적화

### 핵심 질문
> "애니메이션 CSS 속성을 잘못 고르면 왜 브라우저가 버벅거릴까?"

브라우저가 화면을 그리는 단계: **Layout → Paint → Composite**
- `width`, `height`, `margin` 변경 → Layout부터 전부 다시 수행 (비쌈)
- `background-color` 변경 → Paint부터 다시 수행
- `transform`, `opacity` 변경 → **Composite만 수행** (GPU 처리, 가장 저렴)

### Before vs After

| | CSS 속성 | 트리거 단계 |
|---|---|---|
| ❌ 모멘텀 바 | `width` + `transition: width` | Layout → Paint → Composite |
| ✅ 모멘텀 바 | `transform: scaleX()` + `will-change: transform` | **Composite only** |
| ❌ 행 하이라이트 | `background-color` transition (tr 배경) | Paint → Composite |
| ✅ 행 하이라이트 | `opacity` transition (별도 레이어) + `will-change: opacity` | **Composite only** |

### 확인 방법 (Chrome DevTools Rendering)

1. DevTools → 오른쪽 상단 `⋮` → More tools → **Rendering**
2. **Paint flashing** ON (Repaint 영역이 초록색으로 표시됨)
3. 스트리밍 시작 → **P2 Before** 탭: 모멘텀 바마다 초록 영역이 깜빡임
4. **P2 After** 탭으로 전환: 깜빡임 없음 (GPU 처리, 브라우저 Paint 없음)

---

## Phase 3 — 번들 최적화

### 핵심 질문
> "앱이 커질수록 첫 로딩이 느려지는데, 어떻게 줄일까?"

### ① 코드 스플리팅 (React.lazy + Suspense)

```tsx
// 탭을 클릭하는 시점에 해당 청크만 다운로드
const Phase2Before = lazy(() => import("./pages/Phase2Before"))

<Suspense fallback={<div>로딩 중...</div>}>
  {tab === "p2-before" && <Phase2Before />}
</Suspense>
```

**확인**: DevTools → Network → JS 필터 → Phase 탭 처음 클릭 시 `Phase2Before-[hash].js` 파일 요청 확인

**빌드 결과 (실제 청크 크기)**:
```
DashboardBefore-xxx.js    1.60 kB   ← 탭 클릭 전까지 다운로드 안 됨
DashboardAfter-xxx.js     1.68 kB
Phase2Before-xxx.js       2.33 kB
Phase2After-xxx.js        2.85 kB
Phase3Page-xxx.js         3.60 kB
index-xxx.js            200.17 kB   ← react-dom 포함 메인 번들
```

### ② 번들 크기 분석 (rollup-plugin-visualizer)

```bash
npm run build   # dist/stats.html 자동 생성
open dist/stats.html
```

트리맵으로 어떤 패키지가 번들을 얼마나 차지하는지 시각적으로 확인 가능.
청크가 비정상적으로 크면 추가 lazy 분리 대상.

### ③ Tree Shaking

빌드 시 실제로 사용된 코드만 번들에 포함. **ES Module 방식**이어야 작동함.

```ts
// ❌ Before — 전체 라이브러리 번들에 포함 (lodash ~70KB)
import _ from 'lodash'
const sorted = _.sortBy(assets, 'price')

// ✅ After — sortBy 함수만 포함
import { sortBy } from 'lodash-es'
const sorted = sortBy(assets, 'price')
```

stats.html에서 lodash 전체 import 시 청크 크기가 급격히 커지는 것을 확인 가능.

### ④ 이미지 최적화 (WebP + 리사이즈)

Phase 3 탭의 토글로 직접 비교 가능.

| | URL 쿼리스트링 | 이미지 1장 크기 |
|---|---|---|
| ❌ Before | `?fit=crop&w=800&q=100` (JPEG 원본) | ~100–200 KB |
| ✅ After | `?auto=format&fm=webp&w=40&h=40&q=60` | ~1–3 KB |

**확인**: DevTools → Network → Img 필터 → Size 컬럼 비교

---

## Phase 4 — 캐싱 최적화 (예정)

| 캐싱 레벨 | 기술 | 시나리오 |
|---|---|---|
| 서버 데이터 | TanStack Query (`staleTime`) | 자산 상세 모달 재호출 시 네트워크 요청 생략 |
| 정적 리소스 | HTTP Cache-Control 헤더 | `(disk cache)` / `(memory cache)` 확인 |
| 클라이언트 연산 | `useMemo` | 1000개 자산 정렬/필터링 연산 시간 비교 |
