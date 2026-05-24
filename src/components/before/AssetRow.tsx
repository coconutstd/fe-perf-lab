import type { Asset } from "../../entities/asset/types";

// ❌ BEFORE: memo 없음 → 부모 리렌더 시 1000개 전체 리렌더
type Props = {
  asset: Asset;
  onSelect: (id: string) => void;
};

export default function AssetRow({ asset, onSelect }: Props) {
  const isPositive = asset.changeRate >= 0;
  return (
    <tr onClick={() => onSelect(asset.id)} className="asset-row">
      <td className="td-symbol">
        <div className="td-symbol-inner">
          <img src={asset.imageUrl} width={24} height={24} alt={asset.symbol} />
          <span>{asset.symbol}</span>
        </div>
      </td>
      <td className="td-price">${asset.price.toLocaleString()}</td>
      <td className={`td-change ${isPositive ? "positive" : "negative"}`}>
        {isPositive ? "+" : ""}{asset.changeRate.toFixed(2)}%
      </td>
      <td className="td-volume">{asset.volume.toLocaleString()}</td>
    </tr>
  );
}
