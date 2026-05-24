import { useState, useCallback, useMemo } from "react";
import { useAssetStore } from "../store/assetStore";
import AssetRow from "../components/after/AssetRow";

// ✅ AFTER: 3가지 최적화 동시 적용
// 1. memo(AssetRow): props 변경된 행만 리렌더
// 2. useCallback(onSelect): 함수 레퍼런스 안정 → memo 효과 살림
// 3. useMemo(filteredAssets, totalVolume): 연산 결과 캐싱
export default function DashboardAfter() {
  const assets = useAssetStore((s) => s.assets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  // ✅ useCallback: 함수 레퍼런스 유지
  const onSelect = useCallback((id: string) => setSelectedId(id), []);

  // ✅ useMemo: filter나 assets가 실제로 바뀔 때만 재계산
  const filteredAssets = useMemo(
    () =>
      filter
        ? assets.filter((a) => a.symbol.toLowerCase().includes(filter.toLowerCase()))
        : assets,
    [assets, filter]
  );

  // ✅ useMemo: 무거운 집계 연산 캐싱
  const totalVolume = useMemo(
    () => assets.reduce((sum, a) => sum + a.volume, 0),
    [assets]
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <span className="badge after">✅ AFTER (최적화)</span>
        <input
          placeholder="심볼 필터"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-input"
        />
        <span className="stat">
          {filteredAssets.length}건 | 총 거래량: {totalVolume.toLocaleString()}
        </span>
        {selectedId && <span className="selected">선택: {selectedId}</span>}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>심볼</th><th>가격</th><th>등락률</th><th>거래량</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.slice(0, 200).map((asset) => (
              <AssetRow key={asset.id} asset={asset} onSelect={onSelect} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
