import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { generateInitialAssets } from "../shared/lib/mockGenerator";

const ITEM_COUNT = 10_000;

export default function Phase5After() {
  const assets = useMemo(() => generateInitialAssets(ITEM_COUNT), []);
  const parentRef = useRef<HTMLDivElement>(null);
  const startRef = useRef(performance.now());
  const [mountMs, setMountMs] = useState<number | null>(null);

  useEffect(() => {
    setMountMs(Math.round(performance.now() - startRef.current));
  }, []);

  const virtualizer = useVirtualizer({
    count: assets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <span className="badge after">✅ AFTER — 가상화 적용</span>
        <span className="p5-dom-count good">
          DOM 행: <b>{virtualItems.length}개</b> / 전체 {assets.length.toLocaleString()}개
        </span>
        {mountMs !== null && (
          <span className="p5-mount-time good">
            마운트: <b>{mountMs}ms</b>
          </span>
        )}
        <span className="p2-hint">스크롤해도 DOM 행 수는 일정하게 유지됨</span>
      </div>

      <div
        ref={parentRef}
        style={{ height: "calc(100vh - 180px)", overflow: "auto", padding: "0 24px" }}
      >
        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualItems.map((virtualRow) => {
            const asset = assets[virtualRow.index];
            const isPositive = asset.changeRate >= 0;
            return (
              <div
                key={virtualRow.index}
                style={{
                  position: "absolute",
                  top: virtualRow.start,
                  width: "100%",
                  height: virtualRow.size,
                  display: "grid",
                  gridTemplateColumns: "120px 1fr 1fr 1fr",
                  alignItems: "center",
                  borderBottom: "1px solid #111",
                  fontSize: 13,
                  color: "#e0e0e0",
                }}
              >
                <span style={{ fontWeight: 600 }}>{asset.symbol}</span>
                <span>${asset.price.toLocaleString()}</span>
                <span className={isPositive ? "positive" : "negative"}>
                  {isPositive ? "+" : ""}{asset.changeRate.toFixed(2)}%
                </span>
                <span style={{ color: "#666" }}>{asset.volume.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
