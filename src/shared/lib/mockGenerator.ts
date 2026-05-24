import type { Asset } from "../../entities/asset/types";

// 이미지 최적화 실험용: 고해상도 원본 vs 최적화 버전을 쿼리스트링으로 제어
const IMAGE_IDS = [
  "1611974789855-9c20af410-3950",
  "1621761191319-c6fb62004040",
  "1642543492481-03b9e4b7ca13",
  "1518546305927-5a555bb7020d",
  "1534951009808-766178b47a4f",
];

const SYMBOLS = [
  "BTC", "ETH", "AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "GOOGL",
  "META", "NFLX", "AMD", "INTC", "PYPL", "ADBE", "CRM", "ORCL",
];

export function generateInitialAssets(count = 1000): Asset[] {
  return Array.from({ length: count }, (_, index) => {
    const symbolBase = SYMBOLS[index % SYMBOLS.length];
    const suffix = Math.floor(index / SYMBOLS.length);
    return {
      id: `asset-${index}`,
      name: `${symbolBase} Fund ${suffix || ""}`.trim(),
      symbol: suffix ? `${symbolBase}${suffix}` : symbolBase,
      price: Math.floor(Math.random() * 10000) + 100,
      changeRate: parseFloat((Math.random() * 10 - 5).toFixed(2)),
      volume: Math.floor(Math.random() * 1_000_000),
      // 이미지 최적화 실험: ?optimized=true 토글로 Before/After 전환
      imageUrl: `https://images.unsplash.com/photo-${
        IMAGE_IDS[index % IMAGE_IDS.length]
      }?auto=format&fit=crop&w=40&h=40&q=80`,
    };
  });
}
