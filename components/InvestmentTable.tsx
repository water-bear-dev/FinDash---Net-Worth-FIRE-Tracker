import React from 'react';
import { Investment } from '../types';

interface InvestmentTableProps {
  investments: Investment[];
}

const InvestmentTable: React.FC<InvestmentTableProps> = ({ investments }) => {

  if (investments.length === 0) {
    return <p className="text-gray-400">No investments found. Add transactions to see your holdings.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
          <tr>
            <th className="px-4 py-2">Ticker</th>
            <th className="px-4 py-2 text-right">Quantity</th>
            <th className="px-4 py-2 text-right">Avg. Cost</th>
            <th className="px-4 py-2 text-right">Current Value</th>
            <th className="px-4 py-2 text-right">P/L (%)</th>
          </tr>
        </thead>
        <tbody>
          {investments.map((inv) => {
            const costBasisTotal = inv.quantity * inv.costBasisPerUnit;
            const pnl = inv.currentValue - costBasisTotal;
            const pnlPercent = costBasisTotal > 0 ? (pnl / costBasisTotal) * 100 : 0;
            const pnlColor = pnl >= 0 ? 'text-green-400' : 'text-red-400';

            return (
              <tr key={inv.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                <td className="px-4 py-2 font-medium">{inv.ticker}</td>
                <td className="px-4 py-2 text-right">{inv.quantity.toLocaleString()}</td>
                <td className="px-4 py-2 text-right">${inv.costBasisPerUnit.toFixed(2)}</td>
                <td className="px-4 py-2 text-right">${inv.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
