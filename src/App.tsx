import { lazy, Suspense, useState } from "react";
import StreamingControls from "./components/StreamingControls";
import "./App.css";

const DashboardBefore = lazy(() => import("./pages/DashboardBefore"));
const DashboardAfter  = lazy(() => import("./pages/DashboardAfter"));
const Phase2Before    = lazy(() => import("./pages/Phase2Before"));
const Phase2After     = lazy(() => import("./pages/Phase2After"));

type Tab = "p1-before" | "p1-after" | "p2-before" | "p2-after";

const TABS: { id: Tab; label: string; phase: 1 | 2 }[] = [
  { id: "p1-before", label: "❌ P1 Before",  phase: 1 },
  { id: "p1-after",  label: "✅ P1 After",   phase: 1 },
  { id: "p2-before", label: "❌ P2 Before",  phase: 2 },
  { id: "p2-after",  label: "✅ P2 After",   phase: 2 },
];

function App() {
  const [tab, setTab] = useState<Tab>("p1-before");

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">⚡ TradeLab</span>
        <span className="app-sub">실시간 트레이딩 대시보드 · 성능 최적화 실험실</span>
      </header>

      <StreamingControls />

      <nav className="tab-nav">
        <span className="tab-phase-label">Phase 1 · 렌더링</span>
        {TABS.filter(t => t.phase === 1).map(t => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? `active ${t.id.includes("before") ? "before" : "after"}` : ""}`}
            onClick={() => setTab(t.id)}
          >{t.label}</button>
        ))}
        <span className="tab-divider" />
        <span className="tab-phase-label">Phase 2 · Reflow</span>
        {TABS.filter(t => t.phase === 2).map(t => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? `active ${t.id.includes("before") ? "before" : "after"}` : ""}`}
            onClick={() => setTab(t.id)}
          >{t.label}</button>
        ))}
      </nav>

      <Suspense fallback={<div className="loading">청크 로딩 중...</div>}>
        {tab === "p1-before" && <DashboardBefore />}
        {tab === "p1-after"  && <DashboardAfter />}
        {tab === "p2-before" && <Phase2Before />}
        {tab === "p2-after"  && <Phase2After />}
      </Suspense>
    </div>
  );
}

export default App;
