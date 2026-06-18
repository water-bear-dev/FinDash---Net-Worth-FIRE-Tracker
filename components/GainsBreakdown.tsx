import React, { useMemo } from 'react';
import { RealizedGain, UnrealizedGain } from '../types';
import Card from './Card';
import { summarizeGains } from '../services/taxLots';

interface GainsBreakdownProps {
    realizedGains: RealizedGain[];
    unrealizedGains: UnrealizedGain[];
    formatCurrency: (value: number) => string;
}

const GainsBreakdown: React.FC<GainsBreakdownProps> = ({
    realizedGains,
    unrealizedGains,
    formatCurrency,
}) => {
    const summary = useMemo(
        () => summarizeGains(realizedGains, unrealizedGains),
        [realizedGains, unrealizedGains]
    );

    const tickerRows = useMemo(() => {
        const map = new Map<string, { realized: number; unrealized: number }>();
        unrealizedGains.forEach(u => {
            map.set(u.ticker, { realized: 0, unrealized: u.gain });
        });
        realizedGains.forEach(r => {
            const existing = map.get(r.ticker) || { realized: 0, unrealized: 0 };
            existing.realized += r.gain;
            map.set(r.ticker, existing);
        });
        return Array.from(map.entries()).map(([ticker, vals]) => ({
            ticker,
            ...vals,
            net: vals.realized + vals.unrealized,
        }));
    }, [realizedGains, unrealizedGains]);

    if (unrealizedGains.length === 0 && realizedGains.length === 0) {
        return null;
    }

    const gainColor = (v: number) => (v >= 0 ? 'text-green-500' : 'text-red-500');

    return (
        <Card title="Gains Breakdown">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" data-testid="gains-summary">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Realized</p>
                    <p className={`text-2xl font-semibold ${gainColor(summary.totalRealized)}`}>
                        {formatCurrency(summary.totalRealized)}
                    </p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Unrealized</p>
                    <p className={`text-2xl font-semibold ${gainColor(summary.totalUnrealized)}`} data-testid="total-unrealized">
                        {formatCurrency(summary.totalUnrealized)}
                    </p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Net Gain</p>
                    <p className={`text-2xl font-semibold ${gainColor(summary.netGain)}`}>
                        {formatCurrency(summary.netGain)}
                    </p>
                </div>
            </div>

            {tickerRows.length > 0 && (
                <div className="overflow-x-auto" data-testid="gains-by-ticker">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs uppercase text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="py-2">Ticker</th>
                                <th className="py-2 text-right">Realized</th>
                                <th className="py-2 text-right">Unrealized</th>
                                <th className="py-2 text-right">Net</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {tickerRows.map(row => (
                                <tr key={row.ticker} data-testid={`gains-row-${row.ticker}`}>
                                    <td className="py-2 font-medium">{row.ticker}</td>
                                    <td className={`py-2 text-right ${gainColor(row.realized)}`}>
                                        {formatCurrency(row.realized)}
                                    </td>
                                    <td className={`py-2 text-right ${gainColor(row.unrealized)}`}>
                                        {formatCurrency(row.unrealized)}
                                    </td>
                                    <td className={`py-2 text-right font-semibold ${gainColor(row.net)}`}>
                                        {formatCurrency(row.net)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {realizedGains.length > 0 && (
                <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Realized Transactions</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs uppercase text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th className="py-2">Date</th>
                                    <th className="py-2">Ticker</th>
                                    <th className="py-2 text-right">Qty</th>
                                    <th className="py-2 text-right">Gain</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {realizedGains.map((g, i) => (
                                    <tr key={`${g.ticker}-${g.date}-${i}`} data-testid="realized-gain-row">
                                        <td className="py-2">{g.date}</td>
                                        <td className="py-2">{g.ticker}</td>
                                        <td className="py-2 text-right">{g.quantity}</td>
                                        <td className={`py-2 text-right font-semibold ${gainColor(g.gain)}`}>
                                            {formatCurrency(g.gain)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default GainsBreakdown;
