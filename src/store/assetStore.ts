import { create } from "zustand";
import type { Asset } from "../entities/asset/types";
import { generateInitialAssets, getImageUrl } from "../shared/lib/mockGenerator";

interface AssetStore {
  assets: Asset[];
  intervalMs: number;
  updateRate: number;
  brokenRefs: boolean;
  imageOptimized: boolean; // Phase 3: 이미지 최적화 토글
  isStreaming: boolean;
  setIntervalMs: (ms: number) => void;
  setUpdateRate: (rate: number) => void;
  setBrokenRefs: (v: boolean) => void;
  setImageOptimized: (v: boolean) => void;
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
  imageOptimized: true,
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
  setImageOptimized: (v) => {
    // 토글 시 모든 자산의 imageUrl 일괄 교체
    set((state) => ({
      imageOptimized: v,
      assets: state.assets.map((asset, i) => ({
        ...asset,
        imageUrl: getImageUrl(i, v),
      })),
    }));
  },

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
            updatedAt: Date.now(),
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
