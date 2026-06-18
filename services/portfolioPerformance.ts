import moment from 'moment';
import { Dividend, Investment, Transaction } from '../types';
import { priceServerPath } from './priceServerConfig';

export interface CashFlow {
    date: Date;
    amount: number;
}

export interface PerformanceResult {
    xirr: number | null;
    twr: number | null;
    benchmarkXirr: number | null;
    alpha: number | null;
}

function xnpv(rate: number, flows: CashFlow[]): number {
    const t0 = flows[0].date.getTime();
    return flows.reduce((sum, f) => {
        const years = (f.date.getTime() - t0) / (365.25 * 24 * 60 * 60 * 1000);
        return sum + f.amount / Math.pow(1 + rate, years);
    }, 0);
}

function dxnpv(rate: number, flows: CashFlow[]): number {
    const t0 = flows[0].date.getTime();
    return flows.reduce((sum, f) => {
        const years = (f.date.getTime() - t0) / (365.25 * 24 * 60 * 60 * 1000);
        if (years === 0) return sum;
        return sum - (years * f.amount) / Math.pow(1 + rate, years + 1);
    }, 0);
}

export function calculateXirr(flows: CashFlow[], guess = 0.1): number | null {
    if (flows.length < 2) return null;

    const sorted = [...flows].sort((a, b) => a.date.getTime() - b.date.getTime());
    const hasPositive = sorted.some(f => f.amount > 0);
    const hasNegative = sorted.some(f => f.amount < 0);
    if (!hasPositive || !hasNegative) return null;

    let rate = guess;
    for (let i = 0; i < 100; i++) {
        const npv = xnpv(rate, sorted);
        const dnpv = dxnpv(rate, sorted);
        if (Math.abs(dnpv) < 1e-12) break;
        const next = rate - npv / dnpv;
        if (Math.abs(next - rate) < 1e-8) {
            return next * 100;
        }
        rate = next;
        if (rate < -0.99) rate = -0.99;
        if (rate > 10) rate = 10;
    }

    return Math.abs(xnpv(rate, sorted)) < 1 ? rate * 100 : null;
}

export function buildPortfolioCashFlows(
    transactions: Transaction[],
    dividends: Dividend[],
    currentPortfolioValue: number
): CashFlow[] {
    const flows: CashFlow[] = [];

    transactions.forEach(t => {
        const amount = t.type === 'buy'
            ? -(t.quantity * t.pricePerUnit)
            : t.quantity * t.pricePerUnit;
        flows.push({ date: new Date(t.date), amount });
    });

    dividends.forEach(d => {
        flows.push({ date: new Date(d.date), amount: d.amount });
    });

    if (currentPortfolioValue > 0) {
        flows.push({ date: new Date(), amount: currentPortfolioValue });
    }

    return flows;
}

export function calculateTwr(transactions: Transaction[], holdings: Investment[]): number | null {
    if (transactions.length === 0 || holdings.length === 0) return null;

    const months = new Set<string>();
    transactions.forEach(t => months.add(moment(t.date).format('YYYY-MM')));
    months.add(moment().format('YYYY-MM'));

    const sortedMonths = Array.from(months).sort();
    if (sortedMonths.length < 2) return null;

    let cumulativeReturn = 1;

    for (let i = 1; i < sortedMonths.length; i++) {
        const endMonth = sortedMonths[i];
        const endDate = moment(endMonth, 'YYYY-MM').endOf('month');

        const holdingsAtEnd = computeHoldingsAtDate(transactions, endDate.toDate());
        const endValue = holdingsAtEnd.reduce((sum, h) => {
            const live = holdings.find(x => x.ticker === h.ticker);
            const price = live && live.quantity > 0 ? live.currentValue / live.quantity : h.costBasisPerUnit;
            return sum + h.quantity * price;
        }, 0);

        const startMonth = sortedMonths[i - 1];
        const startDate = moment(startMonth, 'YYYY-MM').endOf('month');
        const holdingsAtStart = computeHoldingsAtDate(transactions, startDate.toDate());
        const startValue = holdingsAtStart.reduce((sum, h) => sum + h.quantity * h.costBasisPerUnit, 0);

        const monthFlows = transactions
            .filter(t => {
                const d = moment(t.date);
                return d.isAfter(startDate) && d.isSameOrBefore(endDate);
            })
            .reduce((sum, t) => {
                const amt = t.type === 'buy' ? t.quantity * t.pricePerUnit : -(t.quantity * t.pricePerUnit);
                return sum + amt;
            }, 0);

        if (startValue > 0) {
            const periodReturn = (endValue - monthFlows) / startValue;
            if (periodReturn > 0) cumulativeReturn *= periodReturn;
        }
    }

    return (cumulativeReturn - 1) * 100;
}

function computeHoldingsAtDate(
    transactions: Transaction[],
    asOf: Date
): { ticker: string; quantity: number; costBasisPerUnit: number }[] {
    const map = new Map<string, { quantity: number; totalCost: number }>();

    transactions
        .filter(t => new Date(t.date) <= asOf)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .forEach(t => {
            const h = map.get(t.ticker) || { quantity: 0, totalCost: 0 };
            if (t.type === 'buy') {
                h.quantity += t.quantity;
                h.totalCost += t.quantity * t.pricePerUnit;
            } else {
                const avg = h.quantity > 0 ? h.totalCost / h.quantity : 0;
                h.quantity -= t.quantity;
                h.totalCost -= t.quantity * avg;
            }
            map.set(t.ticker, h);
        });

    return Array.from(map.entries())
        .filter(([, h]) => h.quantity > 0.000001)
        .map(([ticker, h]) => ({
            ticker,
            quantity: h.quantity,
            costBasisPerUnit: h.totalCost / h.quantity,
        }));
}

export async function fetchPriceHistory(
    ticker: string,
    period = '1y'
): Promise<{ date: string; close: number }[]> {
    try {
        const response = await fetch(priceServerPath(`/history?ticker=${encodeURIComponent(ticker)}&period=${period}`));
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
}

export function buildBenchmarkCashFlows(
    transactions: Transaction[],
    benchmarkHistory: { date: string; close: number }[],
    benchmarkTicker: string
): CashFlow[] | null {
    const buys = transactions
        .filter(t => t.type === 'buy')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (buys.length === 0 || benchmarkHistory.length === 0) return null;

    const firstBuy = buys[0];
    const totalInvested = buys.reduce((sum, t) => sum + t.quantity * t.pricePerUnit, 0);

    const priceOn = (dateStr: string): number | null => {
        const target = moment(dateStr);
        const sorted = [...benchmarkHistory].sort((a, b) => a.date.localeCompare(b.date));
        let price: number | null = null;
        for (const point of sorted) {
            if (moment(point.date).isSameOrBefore(target)) price = point.close;
            else break;
        }
        return price;
    };

    const entryPrice = priceOn(firstBuy.date);
    if (!entryPrice || entryPrice <= 0) return null;

    const shares = totalInvested / entryPrice;
    const flows: CashFlow[] = [
        { date: new Date(firstBuy.date), amount: -totalInvested },
    ];

    const lastPrice = benchmarkHistory[benchmarkHistory.length - 1]?.close;
    if (lastPrice) {
        flows.push({ date: new Date(), amount: shares * lastPrice });
    }

    return flows;
}

export function computePerformance(
    transactions: Transaction[],
    dividends: Dividend[],
    holdings: Investment[],
    benchmarkHistory: { date: string; close: number }[],
    benchmarkTicker: string
): PerformanceResult {
    const portfolioValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const portfolioFlows = buildPortfolioCashFlows(transactions, dividends, portfolioValue);
    const xirr = calculateXirr(portfolioFlows);
    const twr = calculateTwr(transactions, holdings);

    const benchmarkFlows = buildBenchmarkCashFlows(transactions, benchmarkHistory, benchmarkTicker);
    const benchmarkXirr = benchmarkFlows ? calculateXirr(benchmarkFlows) : null;

    const alpha = xirr !== null && benchmarkXirr !== null ? xirr - benchmarkXirr : null;

    return { xirr, twr, benchmarkXirr, alpha };
}
