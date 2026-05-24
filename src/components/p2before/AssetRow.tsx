import { memo, useEffect, useState } from "react";
import type { Asset } from "../../entities/asset/types";

// ❌ BEFORE — width + background-color
// width 변경    → Layout(Reflow) → Paint → Composite  (3단계 전부)
// background-color 변경 → Paint → Composite           (2단계)
const AssetRowP2Before = memo(function AssetRowP2Before({ asset }: { asset: Asset }) {
  const isPositive = asset.changeRate >= 0;
  // changeRate 0~10% → bar 0~100%
  const barWidth = Math.min(Math.abs(asset.changeRate) * 10, 100);

  const [isFlashing, setIsFlashing] = useState(false);
  useEffect(() => {
    setIsFlashing(true);
    const t = setTimeout(() => setIsFlashing(false), 500);
    return () => clearTimeout(t);
  }, [asset.updatedAt]); // memo 덕분에 실제 변경된 행에서만 실행

  return (
    <tr
      className="asset-row"
      style={{
        // ❌ background-color: Paint(Repaint) 트리거
        backgroundColor: isFlashing
          ? (isPositive ? "rgba(76,175,80,0.18)" : "rgba(244,67,54,0.18)")
          : "transparent",
        transition: "background-color 0.5s",
      }}
    >
      <td className="td-symbol">
        <div className="td-symbol-inner"><span>{asset.symbol}</span></div>
      </td>
      <td className="td-price">${asset.price.toLocaleString()}</td>
      <td className={`td-change ${isPositive ? "positive" : "negative"}`}>
        {isPositive ? "+" : ""}{asset.changeRate.toFixed(2)}%
      </td>
      <td className="td-bar">
        <div className="bar-track">
          {/* ❌ width 변경 → Reflow(Layout 재계산) 트리거 */}
          <div
            style={{
              width: `${barWidth}%`,
              height: "100%",
              backgroundColor: isPositive ? "#4caf50" : "#f44336",
              transition: "width 0.3s ease",
              borderRadius: 2,
            }}
          />
        </div>
      </td>
    </tr>
  );
});

export default AssetRowP2Before;
