import { memo } from "react";
import type { Asset } from "../../entities/asset/types";

// ✅ AFTER: memo → props가 바뀐 행만 리렌더
type Props = {
  asset: Asset;
  onSelect: (id: string) => void;
};

const AssetRow = memo(function AssetRow({ asset, onSelect }: Props) {
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
});

export default AssetRow;
