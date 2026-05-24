import { create } from "zustand";
import type { Asset } from "../entities/asset/types";
import { generateInitialAssets } from "../shared/lib/mockGenerator";

interface AssetStore {
  assets: Asset[];
  intervalMs: number;
  updateRate: number; // 0.0 ~ 1.0 (업데이트 대상 비율)
  brokenRefs: boolean; // true: 변경 없는 항목도 새 객체로 반환 → memo 무력화 실험
  isStreaming: boolean;
  setIntervalMs: (ms: number) => void;
  setUpdateRate: (rate: number) => void;
  setBrokenRefs: (v: boolean) => void;
  tick: () => void;
  startStreaming: () => void;
  stopStreaming: () => void;
}

let _timerId: ReturnType<typeof setInterval> | null = null;

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: generateInitialAssets(1000),
  intervalMs: 50,
  updateRate: 0.01,
  brokenRefs: false,
  isStreaming: false,

  setIntervalMs: (ms) => {
    set({ intervalMs: ms });
    if (get().isStreaming) {
      get().stopStreaming();
      get().startStreaming();
    }
  },

  setUpdateRate: (rate) => set({ updateRate: rate }),
  setBrokenRefs: (v) => set({ brokenRefs: v }),

  tick: () => {
    const { updateRate, brokenRefs } = get();
    set((state) => ({
      assets: state.assets.map((asset) => {
        const shouldUpdate = Math.random() < updateRate;
        if (shouldUpdate) {
          const delta = (Math.random() * 10) - 5;
          const nextPrice = Math.max(1, asset.price + delta);
          return {
            ...asset,
            price: parseFloat(nextPrice.toFixed(2)),
            changeRate: parseFloat(((delta / asset.price) * 100).toFixed(2)),
            volume: asset.volume + Math.floor(Math.random() * 10_000),
          };
        }
        // brokenRefs=true: 값 변화 없이 새 객체 반환 → React.memo shallow 비교 실패
        return brokenRefs ? { ...asset } : asset;
      }),
    }));
  },

  startStreaming: () => {
    if (_timerId) clearInterval(_timerId);
    const { intervalMs, tick } = get();
    _timerId = setInterval(tick, intervalMs);
    set({ isStreaming: true });
  },

  stopStreaming: () => {
    if (_timerId) clearInterval(_timerId);
    _timerId = null;
    set({ isStreaming: false });
  },
}));
