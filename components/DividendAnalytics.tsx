import React, { useMemo } from 'react';
import { Dividend, Investment } from '../types';
import Card from './Card';
import { computeDividendStats } from '../services/dividendAnalytics';

interface DividendAnalyticsProps {
    dividends: Dividend[];
    holdings: Investment[];
    dripSettings: Record<string, boolean>;
    onDripToggle: (ticker: string, enabled: boolean) => void;
    formatCurrency: (value: number) => string;
}

const DividendAnalytics: React.FC<DividendAnalyticsProps> = ({
    dividends,
    holdings,
    dripSettings,
    onDripToggle,
    formatCurrency,
}) => {
    const stats = useMemo(
        () => computeDividendStats(dividends, holdings, dripSettings),
        [dividends, holdings, dripSettings]
    );

    if (stats.length === 0) return null;

    const totalProjected = stats.reduce((sum, s) => sum + s.projectedAnnualIncome, 0);

    return (
        <Card title="Dividend Analytics">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Trailing 12-month dividend income: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(totalProjected)}</span>
            </p>
            <div className="overflow-x-auto" data-testid="dividend-analytics-table">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="py-2">Ticker</th>
                            <th className="py-2 text-right">12m Dividends</th>
                            <th className="py-2 text-right">Yield on Cost</th>
                            <th className="py-2 text-right">Projected Annual</th>
                            <th className="py-2 text-center">DRIP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {stats.map(s => (
                            <tr key={s.ticker} data-testid={`dividend-row-${s.ticker}`}>
                                <td className="py-2 font-medium">{s.ticker}</td>
                                <td className="py-2 text-right">{formatCurrency(s.trailing12mDividends)}</td>
                                <td className="py-2 text-right" data-testid={`yield-on-cost-${s.ticker}`}>
                                    {s.yieldOnCost.toFixed(2)}%
                                </td>
                                <td className="py-2 text-right">{formatCurrency(s.projectedAnnualIncome)}</td>
                                <td className="py-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={!!dripSettings[s.ticker]}
                                        onChange={e => onDripToggle(s.ticker, e.target.checked)}
                                        data-testid={`drip-toggle-${s.ticker}`}
                                        aria-label={`DRIP for ${s.ticker}`}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                DRIP toggle affects income projection only (does not create buy transactions).
            </p>
        </Card>
    );
};

export default DividendAnalytics;
