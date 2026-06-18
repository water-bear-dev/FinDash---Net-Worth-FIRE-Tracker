import moment from 'moment';
import { Dividend, Investment } from '../types';

export interface DividendTickerStats {
    ticker: string;
    trailing12mDividends: number;
    costBasis: number;
    yieldOnCost: number;
    projectedAnnualIncome: number;
    dripProjectedIncome: number;
}

export function computeDividendStats(
    dividends: Dividend[],
    holdings: Investment[],
    dripSettings: Record<string, boolean>
): DividendTickerStats[] {
    const yearAgo = moment().subtract(12, 'months');

    const tickers = new Set([
        ...holdings.map(h => h.ticker),
        ...dividends.map(d => d.ticker),
    ]);

    return Array.from(tickers).map(ticker => {
        const holding = holdings.find(h => h.ticker === ticker);
        const costBasis = holding ? holding.quantity * holding.costBasisPerUnit : 0;
        const currentPrice = holding && holding.quantity > 0
            ? holding.currentValue / holding.quantity
            : 0;

        const trailing12mDividends = dividends
            .filter(d => d.ticker === ticker && moment(d.date).isSameOrAfter(yearAgo))
            .reduce((sum, d) => sum + d.amount, 0);

        const yieldOnCost = costBasis > 0 ? (trailing12mDividends / costBasis) * 100 : 0;
        const projectedAnnualIncome = trailing12mDividends;

        let dripProjectedIncome = projectedAnnualIncome;
        if (dripSettings[ticker] && currentPrice > 0 && holding) {
            const extraShares = trailing12mDividends / currentPrice;
            dripProjectedIncome = projectedAnnualIncome + extraShares * (trailing12mDividends / Math.max(holding.quantity, 1));
        }

        return {
            ticker,
            trailing12mDividends,
            costBasis,
            yieldOnCost,
            projectedAnnualIncome,
            dripProjectedIncome,
        };
    }).filter(s => s.trailing12mDividends > 0 || s.costBasis > 0);
}

export function totalProjectedDividendIncome(stats: DividendTickerStats[], useDrip: boolean): number {
    return stats.reduce(
        (sum, s) => sum + (useDrip ? s.dripProjectedIncome : s.projectedAnnualIncome),
        0
    );
}
