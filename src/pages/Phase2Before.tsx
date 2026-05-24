import { useAssetStore } from "../store/assetStore";
import AssetRowP2Before from "../components/p2before/AssetRow";

export default function Phase2Before() {
  const assets = useAssetStore((s) => s.assets);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <span className="badge before">❌ BEFORE — width / background-color</span>
        <span className="p2-hint">
          DevTools → 오른쪽 상단 ⋮ → More tools → <b>Rendering</b> → <b>Paint flashing</b> ON
        </span>
      </div>
      <div className="p2-explain">
        <div className="p2-card">
          <span className="p2-label bad">모멘텀 바</span>
          <code>width: {"{barWidth}%"}</code> + <code>transition: width</code>
          <p>변경될 때마다 브라우저가 Layout(Reflow) → Paint → Composite 전 단계 수행</p>
        </div>
        <div className="p2-card">
          <span className="p2-label bad">행 하이라이트</span>
          <code>background-color</code> transition
          <p>Paint → Composite 트리거 — 초록 영역이 깜빡이는 것이 Repaint</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>심볼</th><th>가격</th><th>등락률</th><th style={{ width: 140 }}>모멘텀</th>
            </tr>
          </thead>
          <tbody>
            {assets.slice(0, 200).map((asset) => (
              <AssetRowP2Before key={asset.id} asset={asset} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
