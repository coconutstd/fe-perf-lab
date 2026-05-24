export interface AssetDetail {
  id: string;
  symbol: string;
  description: string;
  marketCap: string;
  peRatio: number;
  news: { title: string; date: string }[];
}

let callCount = 0;

// 실제 서버 요청처럼 500ms 지연
export async function fetchAssetDetail(id: string): Promise<AssetDetail> {
  callCount++;
  console.log(`[API] fetchAssetDetail("${id}") 호출 — 누적 ${callCount}회`);
  await new Promise((r) => setTimeout(r, 500));

  const symbol = id.replace("asset-", "MOCK");
  return {
    id,
    symbol,
    description: `${symbol}은 글로벌 자산 포트폴리오 편입 종목입니다.`,
    marketCap: `$${(Math.random() * 900 + 100).toFixed(1)}B`,
    peRatio: parseFloat((Math.random() * 30 + 5).toFixed(1)),
    news: [
      { title: `${symbol} 실적 발표 예정`, date: "2026-05-20" },
      { title: `${symbol} 신규 파트너십 체결`, date: "2026-05-18" },
      { title: `${symbol} 배당금 상향 조정`, date: "2026-05-15" },
    ],
  };
}

export function getApiCallCount() {
  return callCount;
}
