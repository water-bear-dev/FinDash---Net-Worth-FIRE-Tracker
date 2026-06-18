import React, { useEffect, useState } from 'react';
import { Dividend, Investment, Transaction } from '../types';
import Card from './Card';
import { computePerformance, fetchPriceHistory } from '../services/portfolioPerformance';

interface PortfolioPerformanceProps {
    transactions: Transaction[];
    dividends: Dividend[];
    holdings: Investment[];
    benchmarkTicker: string;
    formatCurrency: (value: number) => string;
}

const PortfolioPerformance: React.FC<PortfolioPerformanceProps> = ({
    transactions,
    dividends,
    holdings,
    benchmarkTicker,
    formatCurrency,
}) => {
    const [loading, setLoading] = useState(false);
    const [xirr, setXirr] = useState<number | null>(null);
    const [twr, setTwr] = useState<number | null>(null);
    const [benchmarkXirr, setBenchmarkXirr] = useState<number | null>(null);
    const [alpha, setAlpha] = useState<number | null>(null);

    useEffect(() => {
        if (transactions.length === 0) return;

        let cancelled = false;
        setLoading(true);

        fetchPriceHistory(benchmarkTicker, '1y').then(history => {
            if (cancelled) return;
            const result = computePerformance(transactions, dividends, holdings, history, benchmarkTicker);
            setXirr(result.xirr);
            setTwr(result.twr);
            setBenchmarkXirr(result.benchmarkXirr);
            setAlpha(result.alpha);
            setLoading(false);
        });

        return () => { cancelled = true; };
    }, [transactions, dividends, holdings, benchmarkTicker]);

    if (transactions.length === 0) return null;

    const fmtPct = (v: number | null) => (v === null ? 'N/A' : `${v.toFixed(2)}%`);
    const alphaColor = alpha !== null && alpha >= 0 ? 'text-green-500' : 'text-red-500';

    return (
        <Card title="Portfolio Performance">
            {loading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Calculating performance...</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="portfolio-performance">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Portfolio XIRR</p>
                        <p className="text-2xl font-semibold text-indigo-500" data-testid="portfolio-xirr">
                            {fmtPct(xirr)}
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">TWR</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {fmtPct(twr)}
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Benchmark ({benchmarkTicker})</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white" data-testid="benchmark-xirr">
                            {fmtPct(benchmarkXirr)}
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Alpha vs Benchmark</p>
                        <p className={`text-2xl font-semibold ${alphaColor}`}>
                            {alpha !== null ? `${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)}%` : 'N/A'}
                        </p>
                    </div>
                </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Portfolio value: {formatCurrency(holdings.reduce((s, h) => s + h.currentValue, 0))}
            </p>
        </Card>
    );
};

export default PortfolioPerformance;
