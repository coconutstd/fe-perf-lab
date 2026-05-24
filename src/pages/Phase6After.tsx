import { memo, useEffect, useMemo, useRef, useState } from "react";
import { generateInitialAssets } from "../shared/lib/mockGenerator";

const assets = generateInitialAssets(10_000);

// 인풋이 자기 state를 소유 — Enter/버튼 누를 때만 부모에 전달
const SearchInput = memo(function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [value, setValue] = useState("");
  const [lag, setLag] = useState<number | null>(null);
  const keyPressTime = useRef(0);

  useEffect(() => {
    if (keyPressTime.current > 0) {
      setLag(Math.round(performance.now() - keyPressTime.current));
      keyPressTime.current = 0;
    }
  });

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    keyPressTime.current = performance.now();
    if (e.key === "Enter") onSearch(value);
  }

  return (
    <div className="p6-input-wrap">
      <input
        className="filter-input"
        placeholder="심볼 검색..."
        value={value}
        onKeyDown={handleKeyDown}
        onChange={e => setValue(e.target.value)}
        style={{ width: 240 }}
        autoComplete="off"
      />
      <button
        className="p6-search-btn"
        onClick={() => onSearch(value)}
      >검색</button>
      {lag !== null && <span className="p6-lag good">입력 지연: <b>{lag}ms</b></span>}
    </div>
  );
});

export default function Phase6After() {
  const [filterQuery, setFilterQuery] = useState("");
  const renderCount = useRef(0);
  renderCount.current++;

  const filtered = useMemo(
    () => assets.filter(a => a.symbol.toLowerCase().includes(filterQuery.toLowerCase())),
    [filterQuery]
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <span className="badge after">✅ AFTER — Enter/버튼 시에만 리스트 리렌더</span>
        <span className="p6-render-count good">페이지 렌더: <b>{renderCount.current}회</b></span>
        <span className="p2-hint">타이핑은 항상 즉각 반응 — 검색 실행 시에만 리렌더</span>
      </div>
      <div className="p6-search-bar">
        <SearchInput onSearch={setFilterQuery} />
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
