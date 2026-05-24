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

function ScenarioB() {
  const assets = useAssetStore((s) => s.assets);
  const [sortKey, setSortKey] = useState<SortKey>("price");
  const [useMemoOn, setUseMemoOn] = useState(true);
  const renderCount = useRef(0);
  renderCount.current++;

  // ❌ Before: assets나 sortKey가 바뀌지 않아도 렌더마다 1000개 정렬 재실행
  const sortedBefore = useMemoOn
    ? null
    : [...assets].sort((a, b) => b[sortKey] - a[sortKey]);

  // ✅ After: assets 또는 sortKey가 바뀔 때만 재정렬
  const sortedAfter = useMemo(() => {
    if (!useMemoOn) return null;
    console.time(`sort(${sortKey})`);
    const result = [...assets].sort((a, b) => b[sortKey] - a[sortKey]);
    console.timeEnd(`sort(${sortKey})`);
    return result;
  }, [assets, sortKey, useMemoOn]);

  const sorted = useMemoOn ? sortedAfter! : sortedBefore!;

  return (
    <div className="p4-scenario">
      <div className="p4-scenario-header">
        <h4 className="p4-scenario-title">시나리오 B — useMemo 연산 캐싱</h4>
        <div className="p4-toggle-group">
          <button
            className={`p3-toggle-btn ${!useMemoOn ? "active-bad" : ""}`}
            onClick={() => setUseMemoOn(false)}
          >❌ useMemo 없음</button>
          <button
            className={`p3-toggle-btn ${useMemoOn ? "active-good" : ""}`}
            onClick={() => setUseMemoOn(true)}
          >✅ useMemo 적용</button>
        </div>
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
        스트리밍 ON 상태에서 정렬 기준을 바꿔보세요.<br />
        <b>Before</b>: 50ms마다 1000개 정렬 재실행 | <b>After</b>: sortKey 변경 시에만 재실행.<br />
        콘솔에서 <code>console.time('sort')</code> 로그 확인.
      </p>
      <div className="table-wrap" style={{ maxHeight: 300 }}>
        <table>
          <thead><tr><th>순위</th><th>심볼</th><th>{sortKey === "price" ? "가격" : sortKey === "volume" ? "거래량" : "등락률"}</th></tr></thead>
          <tbody>
            {sorted.slice(0, 20).map((asset, i) => (
              <tr key={asset.id} className="asset-row">
                <td className="td-price" style={{ color: "#555", width: 40 }}>{i + 1}</td>
                <td className="td-symbol"><div className="td-symbol-inner">{asset.symbol}</div></td>
                <td className="td-price">
                  {sortKey === "price" && `$${asset.price.toLocaleString()}`}
                  {sortKey === "volume" && asset.volume.toLocaleString()}
                  {sortKey === "changeRate" && (
                    <span className={asset.changeRate >= 0 ? "positive" : "negative"}>
                      {asset.changeRate >= 0 ? "+" : ""}{asset.changeRate.toFixed(2)}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
