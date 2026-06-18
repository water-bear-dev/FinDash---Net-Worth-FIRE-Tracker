import { AssetCategory, Investment, TickerInfo } from '../types';
import { priceServerPath } from './priceServerConfig';

export interface AllocationSlice {
    name: string;
    value: number;
}

export async function fetchTickerInfo(tickers: string[]): Promise<Map<string, TickerInfo>> {
    const map = new Map<string, TickerInfo>();
    if (tickers.length === 0) return map;

    try {
        const response = await fetch(
            priceServerPath(`/info?tickers=${tickers.map(encodeURIComponent).join(',')}`)
        );
        if (!response.ok) return map;
        const data: TickerInfo[] = await response.json();
        data.forEach(info => map.set(info.symbol, info));
    } catch {
        // fall through to heuristics
    }

    return map;
}

export function heuristicTickerInfo(ticker: string, category: AssetCategory): TickerInfo {
    let country = 'Unknown';
    let sector = category;
    let currency = 'USD';

    if (ticker.endsWith('.AX')) {
        country = 'Australia';
        currency = 'AUD';
    } else if (ticker.includes('-USD')) {
        country = 'Global';
        sector = 'Crypto';
        currency = 'USD';
    } else if (category === AssetCategory.ETF) {
        sector = 'ETF';
    }

    return {
        symbol: ticker,
        sector,
        industry: sector,
        country,
        currency,
    };
}

export function aggregateByField(
    holdings: Investment[],
    infoMap: Map<string, TickerInfo>,
    field: 'sector' | 'country' | 'currency' | 'category'
): AllocationSlice[] {
    const totals = new Map<string, number>();

    holdings.forEach(h => {
        const info = infoMap.get(h.ticker) || heuristicTickerInfo(h.ticker, h.category);
        let key: string;
        switch (field) {
            case 'sector': key = info.sector || 'Unknown'; break;
            case 'country': key = info.country || 'Unknown'; break;
            case 'currency': key = info.currency || 'Unknown'; break;
            case 'category': key = h.category; break;
        }
        totals.set(key, (totals.get(key) || 0) + h.currentValue);
    });

    return Array.from(totals.entries())
        .map(([name, value]) => ({ name, value }))
        .filter(s => s.value > 0)
        .sort((a, b) => b.value - a.value);
}
