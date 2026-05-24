import { useAssetStore } from "../store/assetStore";

export default function StreamingControls() {
  const { isStreaming, intervalMs, updateRate, brokenRefs, startStreaming, stopStreaming,
    setIntervalMs, setUpdateRate, setBrokenRefs } = useAssetStore();

  return (
    <div className="controls">
      <div className="control-group">
        <button
          onClick={isStreaming ? stopStreaming : startStreaming}
          className={`btn-stream ${isStreaming ? "stop" : "start"}`}
        >
          {isStreaming ? "⏹ 중단" : "▶ 스트리밍 시작"}
        </button>
      </div>

      <div className="control-group">
        <label>업데이트 주기</label>
        <select value={intervalMs} onChange={(e) => setIntervalMs(Number(e.target.value))}>
          <option value={16}>16ms (60fps급)</option>
          <option value={50}>50ms (초당 20회)</option>
          <option value={200}>200ms (초당 5회)</option>
          <option value={1000}>1000ms (초당 1회)</option>
        </select>
      </div>

      <div className="control-group">
        <label>업데이트 비율</label>
        <select value={updateRate} onChange={(e) => setUpdateRate(Number(e.target.value))}>
          <option value={0.005}>0.5% (~5개)</option>
          <option value={0.01}>1% (~10개)</option>
          <option value={0.05}>5% (~50개)</option>
          <option value={0.2}>20% (~200개)</option>
        </select>
      </div>

      <div className="control-group">
        <label title="변경 없는 항목도 새 객체로 반환 → React.memo 무력화">
          <input
            type="checkbox"
            checked={brokenRefs}
            onChange={(e) => setBrokenRefs(e.target.checked)}
          />
          참조 무결성 깨기
        </label>
        <span className="hint">(memo 무력화 실험)</span>
      </div>
    </div>
  );
}
