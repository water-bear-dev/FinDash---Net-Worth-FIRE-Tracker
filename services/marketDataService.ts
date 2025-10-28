// FIX: Add imports for new types
import { CompanyProfile, StockNewsItem } from '../types';

export interface PriceData {
    symbol: string;
    price: number;
}

export const fetchInvestmentPrices = async (tickers: string[], apiKey: string): Promise<PriceData[]> => {
    if (!apiKey || tickers.length === 0) {
        return tickers.map(ticker => ({ symbol: ticker, price: 0 }));
    }

    // FMP API has a different endpoint for crypto
    const cryptoTickers = tickers.filter(t => t.endsWith('USD')).map(t => `BTCUSD,ETHUSD`); // common examples
    const stockTickers = tickers.filter(t => !t.endsWith('USD'));

    const pricePromises = [];

    if (stockTickers.length > 0) {
        const url = `https://financialmodelingprep.com/api/v3/quote/${stockTickers.join(',')}?apikey=${apiKey}`;
        pricePromises.push(fetch(url).then(res => res.json()));
    }
    // Note: FMP free tier has limited crypto coverage. This is a sample implementation.
    // A more robust solution would check asset category. For now, this is a placeholder.


    try {
        const results = await Promise.all(pricePromises);
        const flatResults = results.flat();

        if (!Array.isArray(flatResults)) {
             console.error('Unexpected data format from FMP API:', flatResults);
             return tickers.map(ticker => ({ symbol: ticker, price: 0 }));
        }

        return tickers.map(ticker => {
            const quote = flatResults.find((item: any) => item.symbol === ticker);
            return {
                symbol: ticker,
                price: quote?.price || 0
            }
        });

    } catch (error) {
        console.error('Error fetching market data:', error);
        return tickers.map(ticker => ({ symbol: ticker, price: 0 }));
    }
};

// FIX: Add fetchCompanyProfile function
export const fetchCompanyProfile = async (ticker: string, apiKey: string): Promise<CompanyProfile | null> => {
    if (!apiKey || !ticker) return null;
    try {
        const url = `https://financialmodelingprep.com/api/v3/profile/${ticker.toUpperCase()}?apikey=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
            return data[0];
        }
        return null;
    } catch (error) {
        console.error(`Error fetching company profile for ${ticker}:`, error);
        return null;
    }
};

// FIX: Add fetchStockNews function
export const fetchStockNews = async (ticker: string, apiKey: string): Promise<StockNewsItem[]> => {
    if (!apiKey || !ticker) return [];
    try {
        const url = `https://financialmodelingprep.com/api/v3/stock_news?tickers=${ticker.toUpperCase()}&limit=10&apikey=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(`Error fetching stock news for ${ticker}:`, error);
        return [];
    }
};
