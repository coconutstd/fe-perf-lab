import { lazy, Suspense, useState } from "react";
import StreamingControls from "./components/StreamingControls";
import "./App.css";

// Phase 3: React.lazy → 탭 클릭 시점에 청크 로드
const DashboardBefore = lazy(() => import("./pages/DashboardBefore"));
const DashboardAfter = lazy(() => import("./pages/DashboardAfter"));

type Tab = "before" | "after";

function App() {
  const [tab, setTab] = useState<Tab>("before");

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">⚡ TradeLab</span>
        <span className="app-sub">실시간 트레이딩 대시보드 · 성능 최적화 실험실</span>
      </header>

      <StreamingControls />

      <nav className="tab-nav">
        <button
          className={`tab-btn ${tab === "before" ? "active before" : ""}`}
          onClick={() => setTab("before")}
        >
          ❌ Before (비최적화)
        </button>
        <button
          className={`tab-btn ${tab === "after" ? "active after" : ""}`}
          onClick={() => setTab("after")}
        >
          ✅ After (최적화)
        </button>
      </nav>

      <Suspense fallback={<div className="loading">청크 로딩 중...</div>}>
        {tab === "before" && <DashboardBefore />}
        {tab === "after" && <DashboardAfter />}
      </Suspense>
    </div>
  );
}

export default App;
