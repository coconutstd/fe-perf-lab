import { useState, useEffect, useRef } from "react";
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
// Phase 4 메인 페이지
// ─────────────────────────────────────────

export default function Phase4Page() {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <span className="badge" style={{ background: "#2a1a3a", color: "#ce93d8" }}>
          💾 Phase 4 — 캐싱 최적화
        </span>
        <span className="p2-hint">TanStack Query staleTime — 같은 데이터 재요청 방지</span>
      </div>
      <div className="p3-wrap">
        <ScenarioA />
      </div>
    </div>
  );
}
