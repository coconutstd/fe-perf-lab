import { useAssetStore } from "../store/assetStore";

// Tree Shaking 예시용 — 실제로 두 가지 방식을 보여줌
// ❌ Bad: 라이브러리 전체를 가져옴 (번들에 전부 포함)
// import _ from 'lodash'
// const sorted = _.sortBy(assets, 'price')

// ✅ Good: 필요한 함수만 가져옴 (나머지는 빌드 시 제거됨)
// import { sortBy } from 'lodash-es'
// const sorted = sortBy(assets, 'price')

const CODE_BAD = `// ❌ 전체 import — lodash 전체(~70KB)가 번들에 포함
import _ from 'lodash'
const sorted = _.sortBy(assets, 'price')`;

const CODE_GOOD = `// ✅ 선택 import — sortBy 함수만 번들에 포함
import { sortBy } from 'lodash-es'
const sorted = sortBy(assets, 'price')`;

const CODE_LAZY = `// App.tsx — 탭 클릭 전까지 청크를 다운로드하지 않음
const Phase2Before = lazy(() => import("./pages/Phase2Before"))
const Phase2After  = lazy(() => import("./pages/Phase2After"))

<Suspense fallback={<div>로딩 중...</div>}>
  {tab === "p2-before" && <Phase2Before />}
</Suspense>`;

export default function Phase3Page() {
  const { imageOptimized, setImageOptimized, assets } = useAssetStore();
  const sample = assets.slice(0, 6);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <span className="badge" style={{ background: "#1a2a3a", color: "#90caf9" }}>
          📦 Phase 3 — 번들 최적화
        </span>
      </div>

      <div className="p3-wrap">

        {/* 1. 코드 스플리팅 */}
        <section className="p3-section">
          <h3 className="p3-title">① 코드 스플리팅 (React.lazy + Suspense)</h3>
          <p className="p3-desc">
            이미 적용됨. 각 Phase 탭을 처음 클릭할 때 Network 탭에서 별도 청크 파일이 로드되는 것을 확인.
          </p>
          <pre className="p3-code">{CODE_LAZY}</pre>
          <p className="p3-tip">
            💡 DevTools → Network → JS 필터 → 탭 클릭 시 <code>Phase2Before-[hash].js</code> 같은 파일이 뜨면 정상
          </p>
        </section>

        {/* 2. 번들 분석 */}
        <section className="p3-section">
          <h3 className="p3-title">② 번들 크기 분석 (rollup-plugin-visualizer)</h3>
          <p className="p3-desc">
            빌드 후 <code>dist/stats.html</code> 을 열면 각 청크가 얼마나 큰지 트리맵으로 확인 가능.
          </p>
          <div className="p3-cmd">
            <code>npm run build</code>
            <span>→ dist/stats.html 자동 생성</span>
          </div>
          <p className="p3-tip">
            💡 청크가 너무 크면 추가 lazy 분리 대상. react-dom이 가장 크고, 앱 코드는 작아야 정상.
          </p>
        </section>

        {/* 3. Tree Shaking */}
        <section className="p3-section">
          <h3 className="p3-title">③ Tree Shaking</h3>
          <p className="p3-desc">
            빌드 시 실제로 쓰이는 코드만 번들에 포함. CommonJS(<code>require</code>) 방식은 안 되고,
            ES Module(<code>import</code>) 방식이어야 작동.
          </p>
          <div className="p3-compare">
            <div className="p3-code-block bad">
              <span className="p3-label bad">❌ Before (~70KB 추가)</span>
              <pre className="p3-code">{CODE_BAD}</pre>
            </div>
            <div className="p3-code-block good">
              <span className="p3-label good">✅ After (함수 1개만)</span>
              <pre className="p3-code">{CODE_GOOD}</pre>
            </div>
          </div>
          <p className="p3-tip">
            💡 stats.html에서 확인: lodash 전체 import 시 청크 크기가 급격히 커지는 것을 볼 수 있음
          </p>
        </section>

        {/* 4. 이미지 최적화 */}
        <section className="p3-section">
          <h3 className="p3-title">④ 이미지 최적화 (WebP + 리사이즈)</h3>
          <p className="p3-desc">
            같은 이미지를 고해상도(800px, JPEG)와 최적화(40px, WebP)로 비교.
            Network 탭에서 이미지 항목 크기 차이를 확인.
          </p>

          <div className="p3-img-toggle">
            <button
              className={`p3-toggle-btn ${!imageOptimized ? "active-bad" : ""}`}
              onClick={() => setImageOptimized(false)}
            >
              ❌ 비최적화 (w=800, JPEG)
            </button>
            <button
              className={`p3-toggle-btn ${imageOptimized ? "active-good" : ""}`}
              onClick={() => setImageOptimized(true)}
            >
              ✅ 최적화 (w=40, WebP)
            </button>
          </div>

          <div className="p3-img-grid">
            {sample.map((asset) => (
              <div key={asset.id} className="p3-img-card">
                <img
                  src={asset.imageUrl}
                  width={40}
                  height={40}
                  alt={asset.symbol}
                  style={{ borderRadius: 4, objectFit: "cover" }}
                />
                <span className="p3-img-label">{asset.symbol}</span>
              </div>
            ))}
          </div>
          <p className="p3-tip">
            💡 DevTools → Network → Img 필터 → Size 컬럼 비교.
            비최적화: 이미지 1장 ~100–200KB / 최적화: ~1–3KB
          </p>
        </section>

      </div>
    </div>
  );
}
