import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAssetStore } from "../store/assetStore";
import { fetchAssetDetail, getApiCallCount } from "../shared/lib/fakeApi";
import type { Asset } from "../entities/asset/types";

// ─────────────────────────────────────────
// [시나리오 A] TanStack Query 캐싱
// ─────────────────────────────────────────

function AssetDetailModal({
  asset,
  useCache,
  onClose,
}: {
  asset: Asset;
  useCache: boolean;
  onClose: () => void;
}) {
  // ✅ After: staleTime 5초 — 5초 안에 같은 id 재호출 시 네트워크 요청 생략
  const cached = useQuery({
    queryKey: ["assetDetail", asset.id],
    queryFn: () => fetchAssetDetail(asset.id),
    staleTime: 1000 * 5,
    enabled: useCache,
  });

  // ❌ Before: 열 때마다 fetch
  const [uncached, setUncached] = useState<Awaited<ReturnType<typeof fetchAssetDetail>> | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (useCache) return;
    setLoading(true);
    setUncached(null);
    fetchAssetDetail(asset.id).then((d) => {
      setUncached(d);
      setLoading(false);
    });
  }, [asset.id, useCache]);

  const data = useCache ? cached.data : uncached;
  const isLoading = useCache ? cached.isLoading : loading;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{asset.symbol} 상세 정보</span>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        {isLoading ? (
          <div className="modal-loading">⏳ 데이터 로딩 중... (500ms 지연)</div>
        ) : data ? (
          <div className="modal-body">
            <div className="modal-row"><span>시가총액</span><b>{data.marketCap}</b></div>
            <div className="modal-row"><span>PER</span><b>{data.peRatio}</b></div>
            <div className="modal-row"><span>설명</span><span>{data.description}</span></div>
            <div className="modal-section">최신 뉴스</div>
            {data.news.map((n, i) => (
              <div key={i} className="modal-news">{n.date} — {n.title}</div>
            ))}
            <div className="modal-hint">
              콘솔에서 API 누적 호출 수 확인 | 현재: {getApiCallCount()}회
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ScenarioA() {
  const assets = useAssetStore((s) => s.assets);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [useCache, setUseCache] = useState(true);

  return (
    <div className="p4-scenario">
      <div className="p4-scenario-header">
        <h4 className="p4-scenario-title">시나리오 A — TanStack Query 캐싱</h4>
        <div className="p4-toggle-group">
          <button
            className={`p3-toggle-btn ${!useCache ? "active-bad" : ""}`}
            onClick={() => setUseCache(false)}
          >❌ 매번 fetch</button>
          <button
            className={`p3-toggle-btn ${useCache ? "active-good" : ""}`}
            onClick={() => setUseCache(true)}
          >✅ TanStack Query (staleTime: 5s)</button>
        </div>
      </div>
      <p className="p4-desc">
        행을 클릭 → 모달 닫기 → 5초 안에 같은 행 다시 클릭.<br />
        <b>After</b>는 두 번째 클릭 시 로딩 없이 즉시 표시됨. 콘솔에서 API 호출 횟수 확인.
      </p>
      <div className="table-wrap" style={{ maxHeight: 300 }}>
        <table>
          <thead><tr><th>심볼</th><th>가격</th><th>등락률</th></tr></thead>
          <tbody>
            {assets.slice(0, 30).map((asset) => (
              <tr
                key={asset.id}
                className="asset-row"
                onClick={() => setSelected(asset)}
              >
                <td className="td-symbol"><div className="td-symbol-inner">{asset.symbol}</div></td>
                <td className="td-price">${asset.price.toLocaleString()}</td>
                <td className={`td-change ${asset.changeRate >= 0 ? "positive" : "negative"}`}>
                  {asset.changeRate >= 0 ? "+" : ""}{asset.changeRate.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <AssetDetailModal
          asset={selected}
          useCache={useCache}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// [시나리오 B] useMemo 연산 캐싱
// ─────────────────────────────────────────

type SortKey = "price" | "volume" | "changeRate";

// 핵심: sort와 무관한 상태(ticker)가 바뀌어도 sort가 다시 실행되는가?
function SortListBefore({ assets, sortKey }: { assets: ReturnType<typeof useAssetStore>["assets"] extends never ? never : any[]; sortKey: SortKey }) {
  const sortCountRef = useRef(0);

  // ❌ 렌더마다 무조건 실행 — ticker가 바뀌어도, assets이 안 바뀌어도 실행
  sortCountRef.current++;
  console.log(`[❌ Before] sort 실행 #${sortCountRef.current}`);
  const sorted = [...assets].sort((a, b) => b[sortKey] - a[sortKey]);

  return { sorted, sortCount: sortCountRef.current };
}

function SortListAfter({ assets, sortKey }: { assets: any[]; sortKey: SortKey }) {
  const sortCountRef = useRef(0);

  // ✅ assets 또는 sortKey가 실제로 바뀔 때만 실행
  const sorted = useMemo(() => {
    sortCountRef.current++;
    console.log(`[✅ After] sort 실행 #${sortCountRef.current}`);
    return [...assets].sort((a, b) => b[sortKey] - a[sortKey]);
  }, [assets, sortKey]);

  return { sorted, sortCount: sortCountRef.current };
}

function ScenarioB() {
  const assets = useAssetStore((s) => s.assets);
  const [sortKey, setSortKey] = useState<SortKey>("price");
  // sort와 전혀 관계없는 상태 — 클릭할 때마다 이 컴포넌트가 리렌더됨
  const [ticker, setTicker] = useState(0);

  const before = SortListBefore({ assets, sortKey });
  const after  = SortListAfter({ assets, sortKey });

  return (
    <div className="p4-scenario">
      <div className="p4-scenario-header">
        <h4 className="p4-scenario-title">시나리오 B — useMemo 연산 캐싱</h4>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="p4-select"
        >
          <option value="price">가격순</option>
          <option value="volume">거래량순</option>
          <option value="changeRate">등락률순</option>
        </select>
      </div>

      <p className="p4-desc">
        아래 버튼은 sort와 <b>전혀 관계없는 상태</b>를 바꿉니다. 클릭하면 이 컴포넌트가 리렌더됩니다.<br />
        콘솔에서 <b>Before는 클릭마다 sort가 실행</b>되고, <b>After는 실행되지 않는 것</b>을 확인하세요.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          className="p3-toggle-btn active-bad"
          onClick={() => setTicker(t => t + 1)}
        >
          🔄 관계없는 리렌더 유발 ({ticker}번)
        </button>
        <span className="p4-desc" style={{ margin: 0 }}>
          ❌ Before sort 횟수: <b style={{ color: "#ef9a9a" }}>{before.sortCount}</b>
          &nbsp;|&nbsp;
          ✅ After sort 횟수: <b style={{ color: "#a5d6a7" }}>{after.sortCount}</b>
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
        <div>
          <div className="p4-side-label bad">❌ useMemo 없음 — 리렌더마다 sort</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr><th style={{ padding: "6px 8px", textAlign: "left", color: "#555" }}>#</th><th style={{ padding: "6px 8px", textAlign: "left", color: "#555" }}>심볼</th><th style={{ padding: "6px 8px", textAlign: "left", color: "#555" }}>값</th></tr></thead>
            <tbody>
              {before.sorted.slice(0, 10).map((asset, i) => (
                <tr key={asset.id} className="asset-row">
                  <td style={{ padding: "5px 8px", color: "#555" }}>{i + 1}</td>
                  <td style={{ padding: "5px 8px", fontWeight: 600 }}>{asset.symbol}</td>
                  <td style={{ padding: "5px 8px", color: "#aaa" }}>
                    {sortKey === "price" && `$${asset.price.toLocaleString()}`}
                    {sortKey === "volume" && asset.volume.toLocaleString()}
                    {sortKey === "changeRate" && `${asset.changeRate.toFixed(2)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div className="p4-side-label good">✅ useMemo 적용 — 입력값 바뀔 때만 sort</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr><th style={{ padding: "6px 8px", textAlign: "left", color: "#555" }}>#</th><th style={{ padding: "6px 8px", textAlign: "left", color: "#555" }}>심볼</th><th style={{ padding: "6px 8px", textAlign: "left", color: "#555" }}>값</th></tr></thead>
            <tbody>
              {after.sorted.slice(0, 10).map((asset, i) => (
                <tr key={asset.id} className="asset-row">
                  <td style={{ padding: "5px 8px", color: "#555" }}>{i + 1}</td>
                  <td style={{ padding: "5px 8px", fontWeight: 600 }}>{asset.symbol}</td>
                  <td style={{ padding: "5px 8px", color: "#aaa" }}>
                    {sortKey === "price" && `$${asset.price.toLocaleString()}`}
                    {sortKey === "volume" && asset.volume.toLocaleString()}
                    {sortKey === "changeRate" && `${asset.changeRate.toFixed(2)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// [시나리오 C] HTTP Cache-Control
// ─────────────────────────────────────────

function ScenarioC() {
  return (
    <div className="p4-scenario">
      <h4 className="p4-scenario-title">시나리오 C — HTTP Cache-Control (정적 리소스)</h4>
      <p className="p4-desc">
        Vite 빌드 시 파일명에 해시가 붙습니다(<code>index-C0xLWZzV.js</code>).
        파일 내용이 바뀌면 해시도 바뀌므로, 브라우저가 영구 캐싱해도 안전합니다.
      </p>
      <div className="p4-cache-table">
        <div className="p4-cache-row header">
          <span>리소스</span><span>Cache-Control 권장값</span><span>이유</span>
        </div>
        <div className="p4-cache-row bad">
          <span><code>index.html</code></span>
          <span><code>no-cache</code></span>
          <span>항상 최신 JS 해시를 확인해야 함</span>
        </div>
        <div className="p4-cache-row good">
          <span><code>*.js / *.css</code> (해시 포함)</span>
          <span><code>max-age=31536000, immutable</code></span>
          <span>해시가 다르면 새 파일 → 영구 캐싱 안전</span>
        </div>
        <div className="p4-cache-row good">
          <span>이미지 / 폰트</span>
          <span><code>max-age=86400</code></span>
          <span>하루 캐싱, 자주 안 바뀌는 리소스</span>
        </div>
      </div>
      <p className="p4-desc" style={{ marginTop: 8 }}>
        <b>확인 방법</b>: <code>npm run build && npm run preview</code> 후 Network 탭 →
        두 번째 방문 시 JS/CSS 파일의 Size 컬럼에 <code>(disk cache)</code> 표시 확인
      </p>
    </div>
  );
}

// ─────────────────────────────────────────
// Phase 4 메인 페이지
// ─────────────────────────────────────────

export default function Phase4Page() {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <span className="badge" style={{ background: "#2a1a3a", color: "#ce93d8" }}>
          💾 Phase 4 — 캐싱 최적화
        </span>
        <span className="p2-hint">3단계 캐싱: 서버 데이터 / 클라이언트 연산 / HTTP 정적 리소스</span>
      </div>
      <div className="p3-wrap">
        <ScenarioA />
        <ScenarioB />
        <ScenarioC />
      </div>
    </div>
  );
}
