import { useAssetStore } from "../store/assetStore";
import AssetRowP2After from "../components/p2after/AssetRow";

export default function Phase2After() {
  const assets = useAssetStore((s) => s.assets);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <span className="badge after">✅ AFTER — transform / opacity</span>
        <span className="p2-hint">
          Paint flashing ON 상태에서 초록 영역이 <b>사라진 것</b>을 확인
        </span>
      </div>
      <div className="p2-explain">
        <div className="p2-card">
          <span className="p2-label good">모멘텀 바</span>
          <code>transform: scaleX({"{scale}"})</code> + <code>will-change: transform</code>
          <p>GPU가 처리 — Layout/Paint 없이 Composite 단계만 수행</p>
        </div>
        <div className="p2-card">
          <span className="p2-label good">행 하이라이트</span>
          <code>opacity</code> transition + <code>will-change: opacity</code>
          <p>별도 레이어의 opacity만 변경 — Composite only, Repaint 없음</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 0, padding: 0 }} />
              <th>심볼</th><th>가격</th><th>등락률</th><th style={{ width: 140 }}>모멘텀</th>
            </tr>
          </thead>
          <tbody>
            {assets.slice(0, 200).map((asset) => (
              <AssetRowP2After key={asset.id} asset={asset} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
