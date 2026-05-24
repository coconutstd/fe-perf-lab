import { useEffect, useMemo, useRef, useState } from "react";
import { generateInitialAssets } from "../shared/lib/mockGenerator";

const ITEM_COUNT = 10_000;

export default function Phase5Before() {
  const assets = useMemo(() => generateInitialAssets(ITEM_COUNT), []);
  const startRef = useRef(performance.now());
  const [mountMs, setMountMs] = useState<number | null>(null);

  useEffect(() => {
    setMountMs(Math.round(performance.now() - startRef.current));
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <span className="badge before">❌ BEFORE — 전체 렌더 (가상화 없음)</span>
        <span className="p5-dom-count bad">
          DOM 행: <b>{assets.length.toLocaleString()}개</b>
        </span>
        {mountMs !== null && (
          <span className="p5-mount-time bad">
            마운트: <b>{mountMs}ms</b>
          </span>
        )}
        <span className="p2-hint">DevTools → Elements에서 tbody 안 tr 개수 확인</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>심볼</th><th>가격</th><th>등락률</th><th>거래량</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => {
              const isPositive = asset.changeRate >= 0;
              return (
                <tr key={asset.id} className="asset-row">
                  <td className="td-symbol">
                    <div className="td-symbol-inner">{asset.symbol}</div>
                  </td>
                  <td className="td-price">${asset.price.toLocaleString()}</td>
                  <td className={`td-change ${isPositive ? "positive" : "negative"}`}>
                    {isPositive ? "+" : ""}{asset.changeRate.toFixed(2)}%
                  </td>
                  <td className="td-volume">{asset.volume.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
