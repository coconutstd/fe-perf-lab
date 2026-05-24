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
│   └── types.ts                  # Asset 인터페이스
├── shared/lib/
│   └── mockGenerator.ts          # 1000개 자산 초기 데이터 생성기
├── store/
│   └── assetStore.ts             # Zustand — 스트리밍 시뮬레이터 + 실험 파라미터
├── components/
│   ├── before/AssetRow.tsx       # ❌ memo 없음
│   ├── after/AssetRow.tsx        # ✅ React.memo 적용
│   └── StreamingControls.tsx     # 주기 / 비율 / 참조 무결성 컨트롤
└── pages/
    ├── DashboardBefore.tsx       # ❌ useCallback / useMemo 없음
    └── DashboardAfter.tsx        # ✅ 3종 최적화 적용
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

## Phase 2 — Reflow / Repaint 최적화 (예정)

**목표**: 가격 변동 애니메이션을 `width` 대신 `transform: scaleX()` / `opacity`로 교체해 GPU Composite 단계만 활용

**확인 도구**: Chrome DevTools → Rendering → Paint flashing / Layout Shift Regions

---

## Phase 3 — 번들 최적화 (일부 구현)

현재 구현:
- `React.lazy` + `Suspense`: 탭 클릭 시점에 청크 로드 (App.tsx)

예정:
- `rollup-plugin-visualizer`로 번들 크기 시각화
- Tree Shaking 전후 비교
- 이미지 WebP 최적화 (Unsplash 쿼리스트링 `?w=40&q=80` 제거/적용)

**현재 확인 방법**:
DevTools Network 탭 → "Before" 또는 "After" 탭 처음 클릭 시 별도 청크 `.js` 파일 요청 확인

---

## Phase 4 — 캐싱 최적화 (예정)

| 캐싱 레벨 | 기술 | 시나리오 |
|---|---|---|
| 서버 데이터 | TanStack Query (`staleTime`) | 자산 상세 모달 재호출 시 네트워크 요청 생략 |
| 정적 리소스 | HTTP Cache-Control 헤더 | `(disk cache)` / `(memory cache)` 확인 |
| 클라이언트 연산 | `useMemo` | 1000개 자산 정렬/필터링 연산 시간 비교 |
