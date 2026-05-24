import { memo, useEffect, useRef } from "react";
import type { Asset } from "../../entities/asset/types";

// ✅ AFTER — transform:scaleX + opacity
// transform 변경 → Composite 단계만 (GPU 처리, Layout/Paint 없음)
// opacity 변경  → Composite 단계만
const AssetRowP2After = memo(function AssetRowP2After({ asset }: { asset: Asset }) {
  const isPositive = asset.changeRate >= 0;
  // changeRate 0~10% → scale 0~1.0
  const barScale = Math.min(Math.abs(asset.changeRate) * 0.1, 1);

  const flashRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = flashRef.current;
    if (!el) return;
    // DOM을 직접 조작해 React 리렌더 없이 opacity만 변경 (Composite only)
    el.style.opacity = "1";
    const t = setTimeout(() => { el.style.opacity = "0"; }, 500);
    return () => clearTimeout(t);
  }, [asset.updatedAt]);

  return (
    <tr className="asset-row" style={{ position: "relative" }}>
      {/* ✅ opacity 전환 → Composite only. will-change로 GPU 레이어 사전 예약 */}
      <td style={{ padding: 0, width: 0, overflow: "visible", position: "relative" }}>
        <div
          ref={flashRef}
          style={{
            position: "absolute",
            inset: "0 -9999px",
            backgroundColor: isPositive ? "rgba(76,175,80,0.18)" : "rgba(244,67,54,0.18)",
            opacity: 0,
            transition: "opacity 0.5s",
            willChange: "opacity",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      </td>
      <td className="td-symbol" style={{ position: "relative", zIndex: 1 }}>
        <div className="td-symbol-inner"><span>{asset.symbol}</span></div>
      </td>
      <td className="td-price" style={{ position: "relative", zIndex: 1 }}>
        ${asset.price.toLocaleString()}
      </td>
      <td className={`td-change ${isPositive ? "positive" : "negative"}`} style={{ position: "relative", zIndex: 1 }}>
        {isPositive ? "+" : ""}{asset.changeRate.toFixed(2)}%
      </td>
      <td className="td-bar" style={{ position: "relative", zIndex: 1 }}>
        <div className="bar-track">
          {/* ✅ transform: scaleX → GPU Composite only, Layout 재계산 없음 */}
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: isPositive ? "#4caf50" : "#f44336",
              transform: `scaleX(${barScale})`,
              transformOrigin: "left",
              transition: "transform 0.3s ease",
              borderRadius: 2,
              willChange: "transform",
            }}
          />
        </div>
      </td>
    </tr>
  );
});

export default AssetRowP2After;
