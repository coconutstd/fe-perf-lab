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
    ├── Phase3Page.tsx            # Phase 3 번들 최적화 실험
    ├── Phase4Page.tsx            # Phase 4 캐싱 최적화 실험
    ├── Phase5Before.tsx          # Phase 5 ❌ (1000행 전부 DOM 렌더)
    ├── Phase5After.tsx           # Phase 5 ✅ (useVirtualizer — ~25행만 DOM 렌더)
    ├── Phase6Before.tsx          # Phase 6 ❌ (inputValue state가 부모에 있음)
    └── Phase6After.tsx           # Phase 6 ✅ (SearchInput이 state 소유 + Enter-to-search)
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

## Phase 4 — 캐싱 최적화

### 핵심 질문
> "같은 데이터를 반복 요청할 때마다 네트워크를 타야 할까?"

### 시나리오 A — TanStack Query `staleTime`

모달을 열면 자산 상세 API를 호출한다. **닫고 5초 안에 같은 자산을 다시 열면?**

| | 구현 | 두 번째 열기 |
|---|---|---|
| ❌ Before | `useEffect` + `fetch` | 항상 500ms 로딩 |
| ✅ After | `useQuery({ staleTime: 5000 })` | 즉시 표시 (캐시 히트) |

**확인**: 콘솔에서 "API 누적 호출 수" 숫자 비교. Before는 열 때마다 증가, After는 5초 내 재열기 시 증가 안 함.

---

## Phase 5 — 가상화 (Virtual Scrolling)

### 핵심 질문
> "1000개 행을 DOM에 전부 그리면 뭐가 문제일까?"

브라우저는 DOM에 **존재하는 모든 요소**를 Layout/Paint 단계에서 처리한다. 화면에 보이는 건 15개뿐이어도 DOM에 1000개 `<tr>`이 있으면 그 비용을 전부 치른다.

**가상화(Virtualization)**: 스크롤 위치를 기준으로 **화면에 보이는 행 + 약간의 여유분**만 DOM에 렌더하고, 나머지는 절대 좌표로 공간만 잡아둔다.

### Before vs After

| | DOM 행 수 | 스크롤 시 |
|---|---|---|
| ❌ P5 Before | 1000개 항상 존재 | 전체 Layout 비용 |
| ✅ P5 After | ~15개 (overscan 포함 ~25개) | 보이는 것만 처리 |

### 구현 (`@tanstack/react-virtual`)

```tsx
const virtualizer = useVirtualizer({
  count: assets.length,        // 전체 항목 수
  getScrollElement: () => parentRef.current,
  estimateSize: () => 44,      // 행 높이(px) 추정값
  overscan: 5,                 // 화면 밖 위아래 5행 미리 렌더
});

// 전체 스크롤 공간 확보
<div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
  {virtualizer.getVirtualItems().map((row) => (
    <div style={{ position: "absolute", top: row.start, height: row.size }}>
      {/* 실제 데이터 렌더 */}
    </div>
  ))}
</div>
```

### 확인 방법 (Chrome DevTools)

1. **Elements 탭**: P5 Before → 스크롤 컨테이너 안 행 1000개 확인 / P5 After → ~25개만 존재 확인
2. **Performance 탭**: 스크롤 시 Before는 Layout 이벤트 빈번 / After는 현저히 감소
3. **화면 상단 DOM 카운터**: P5 After 탭에서 스크롤해도 "DOM에 렌더된 행" 숫자가 일정하게 유지되는 것 확인

---

## Phase 6 — State 위치 최적화

### 핵심 질문
> "Enter 눌러서 검색하는데 왜 타이핑할 때 인풋이 버벅일까?"

Enter-to-search 구조에서도 **인풋 value state가 어디에 있느냐**에 따라 타이핑 성능이 달라진다.

### 원인

```
[Before] 부모가 inputValue state 소유

타이핑 → setInputValue → 부모 리렌더
                        → 10,000개 행 reconciliation (데이터 안 바뀌어도)
                        → 인풋에 글자 반영
```

리스트 데이터(`filterQuery`)는 Enter 전까지 변하지 않는다. 그런데도 부모가 리렌더되면 자식인 리스트 전체가 reconciliation을 거친다 — Phase 1에서 봤던 것과 같은 원리.

### Before vs After

| | 타이핑 시 리렌더 범위 | Enter 시 |
|---|---|---|
| ❌ P6 Before | 부모 + 10,000행 reconciliation | 리스트 갱신 |
| ✅ P6 After | SearchInput 컴포넌트만 | 리스트 갱신 |

### 구현

```tsx
// ✅ SearchInput이 inputValue를 직접 소유
const SearchInput = memo(function SearchInput({ onSearch }) {
  const [value, setValue] = useState(""); // 타이핑 시 이 컴포넌트만 리렌더

  function handleKeyDown(e) {
    if (e.key === "Enter") onSearch(value); // Enter 시에만 부모에 전달
  }

  return <input value={value} onChange={e => setValue(e.target.value)} onKeyDown={handleKeyDown} />;
});

// 부모는 filterQuery만 관리 — 타이핑 시 리렌더 없음
function Page() {
  const [filterQuery, setFilterQuery] = useState("");
  const filtered = useMemo(() => assets.filter(...), [filterQuery]);

  return (
    <>
      <SearchInput onSearch={setFilterQuery} />
      <BigList items={filtered} /> {/* Enter 시에만 리렌더 */}
    </>
  );
}
```

### 확인 방법

1. **P6 Before** 탭 → 검색창에 빠르게 타이핑 → 헤더의 "페이지 렌더: N회"가 타이핑마다 증가, "입력 지연 Xms" 표시
2. **P6 After** 탭 → 같은 속도로 타이핑 → "페이지 렌더" 숫자 그대로, 입력 지연 1~2ms
3. Enter 또는 검색 버튼 → 양쪽 모두 그 시점에만 리스트 갱신

> 차이가 미미하면 DevTools → Performance 탭 → CPU: **4x slowdown** 적용 후 비교
