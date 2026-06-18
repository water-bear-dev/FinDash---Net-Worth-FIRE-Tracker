import React from 'react';
import { Investment } from '../types';

interface InvestmentTableProps {
  investments: Investment[];
  formatCurrency: (value: number) => string;
  unrealizedByTicker?: Map<string, number>;
  realizedYtdByTicker?: Map<string, number>;
}

const InvestmentTable: React.FC<InvestmentTableProps> = ({
  investments,
  formatCurrency,
  unrealizedByTicker,
  realizedYtdByTicker,
}) => {

  if (investments.length === 0) {
    return <p className="text-gray-400">No investments found. Add transactions to see your holdings.</p>;
  }

  return (
    <div className="overflow-x-auto" data-testid="investment-table">
      <table className="w-full text-left">
        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
          <tr>
            <th className="px-4 py-2">Ticker</th>
            <th className="px-4 py-2 text-right">Quantity</th>
            <th className="px-4 py-2 text-right">Avg. Cost</th>
            <th className="px-4 py-2 text-right">Current Value</th>
            <th className="px-4 py-2 text-right">Unrealized</th>
            <th className="px-4 py-2 text-right">Realized YTD</th>
            <th className="px-4 py-2 text-right">P/L (%)</th>
          </tr>
        </thead>
        <tbody>
          {investments.map((inv) => {
            const costBasisTotal = inv.quantity * inv.costBasisPerUnit;
            const unrealized = unrealizedByTicker?.get(inv.ticker) ?? (inv.currentValue - costBasisTotal);
            const realizedYtd = realizedYtdByTicker?.get(inv.ticker) ?? 0;
            const pnlPercent = costBasisTotal > 0 ? (unrealized / costBasisTotal) * 100 : 0;
            const pnlColor = unrealized >= 0 ? 'text-green-400' : 'text-red-400';

            return (
              <tr key={inv.id} className="border-b border-gray-700 hover:bg-gray-700/50" data-testid={`holding-row-${inv.ticker}`}>
                <td className="px-4 py-2 font-medium">{inv.ticker}</td>
                <td className="px-4 py-2 text-right">{inv.quantity.toLocaleString()}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(inv.costBasisPerUnit)}</td>
                <td className="px-4 py-2 text-right" data-testid={`current-value-${inv.ticker}`}>
                  {formatCurrency(inv.currentValue)}
                </td>
                <td className={`px-4 py-2 text-right ${pnlColor}`} data-testid={`unrealized-${inv.ticker}`}>
                  {formatCurrency(unrealized)}
                </td>
                <td className="px-4 py-2 text-right">{formatCurrency(realizedYtd)}</td>
                <td className={`px-4 py-2 text-right font-semibold ${pnlColor}`}>
                  {pnlPercent.toFixed(2)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InvestmentTable;
