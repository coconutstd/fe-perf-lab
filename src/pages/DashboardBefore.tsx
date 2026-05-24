import { useState } from "react";
import { useAssetStore } from "../store/assetStore";
import AssetRow from "../components/before/AssetRow";

// ❌ BEFORE: 최적화 없음
// - onSelect가 렌더마다 새 함수 생성 → memo 있어도 무의미
// - filteredAssets가 렌더마다 재계산
// - AssetRow에 memo 없음 → 전체 1000개 리렌더
export default function DashboardBefore() {
  const assets = useAssetStore((s) => s.assets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  // ❌ 렌더마다 새 함수 객체 생성
  const onSelect = (id: string) => setSelectedId(id);

  // ❌ 렌더마다 전체 배열을 새로 순회
  const filteredAssets = assets.filter((a) =>
    a.symbol.toLowerCase().includes(filter.toLowerCase())
  );

  // ❌ 렌더마다 재계산
  const totalVolume = assets.reduce((sum, a) => sum + a.volume, 0);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <span className="badge before">❌ BEFORE (비최적화)</span>
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
