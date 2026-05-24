import { useEffect, useMemo, useRef, useState } from "react";
import { generateInitialAssets } from "../shared/lib/mockGenerator";

const assets = generateInitialAssets(10_000);

// ❌ inputValue를 부모가 소유
// → onChange마다 부모 리렌더 → 10,000개 행 reconciliation
// → filterQuery는 Enter 시에만 바뀌는데도 타이핑이 버벅임
export default function Phase6Before() {
  const [inputValue, setInputValue] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [lag, setLag] = useState<number | null>(null);
  const renderCount = useRef(0);
  const keyPressTime = useRef(0);
  renderCount.current++;

  const filtered = useMemo(
    () => assets.filter(a => a.symbol.toLowerCase().includes(filterQuery.toLowerCase())),
    [filterQuery]
  );

  useEffect(() => {
    if (keyPressTime.current > 0) {
      setLag(Math.round(performance.now() - keyPressTime.current));
      keyPressTime.current = 0;
    }
  });

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    keyPressTime.current = performance.now();
    if (e.key === "Enter") setFilterQuery(inputValue);
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <span className="badge before">❌ BEFORE — inputValue state가 부모에 있음</span>
        <span className="p6-render-count bad">페이지 렌더: <b>{renderCount.current}회</b></span>
        {lag !== null && <span className="p6-lag bad">입력 지연: <b>{lag}ms</b></span>}
        <span className="p2-hint">타이핑마다 부모 리렌더 → 리스트 데이터 안 바뀌어도 10,000행 재조정</span>
      </div>
      <div className="p6-search-bar">
        <input
          className="filter-input"
          placeholder="심볼 검색 후 Enter..."
          value={inputValue}
          onKeyDown={handleKeyDown}
          onChange={e => setInputValue(e.target.value)}
          style={{ width: 240 }}
          autoComplete="off"
        />
        <button className="p6-search-btn" onClick={() => setFilterQuery(inputValue)}>검색</button>
        <span className="stat">{filtered.length.toLocaleString()}개 결과</span>
        <span className="p2-hint">※ DevTools → Performance → CPU 4x slowdown 시 더 극명</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>심볼</th><th>가격</th><th>등락률</th><th>거래량</th></tr></thead>
          <tbody>
            {filtered.map(asset => {
              const isPositive = asset.changeRate >= 0;
              return (
                <tr key={asset.id} className="asset-row">
                  <td className="td-symbol"><div className="td-symbol-inner">{asset.symbol}</div></td>
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
