import { PriceData } from './marketDataService';

/**
 * Fetches the latest price for a ticker from Alpha Vantage.
 * Note: Free tier has a limit of 25 requests per day.
 * @param tickers Array of tickers to fetch
 * @param apiKey Alpha Vantage API Key
 */
export const fetchPricesFromAlphaVantage = async (tickers: string[], apiKey: string): Promise<PriceData[]> => {
    if (!apiKey || tickers.length === 0) return [];

    const results: PriceData[] = [];

    // Note: Alpha Vantage free tier is limited. In a real app, you'd want to throttle these 
    // or use a backend to cache them. For now, we fetch them one by one.
    for (const ticker of tickers) {
        try {
            // Function for stocks/ETFs
            let url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;

            // For crypto (Alpha Vantage expects symbols like BTC, ETH)
            if (ticker.includes('USD')) {
                const cryptoSymbol = ticker.replace('USD', '').replace('-', '');
                url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${cryptoSymbol}&to_currency=USD&apikey=${apiKey}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data['Global Quote']) {
                const price = parseFloat(data['Global Quote']['05. price']);
                if (!isNaN(price)) {
                    results.push({ symbol: ticker, price });
                }
            } else if (data['Realtime Currency Exchange Rate']) {
                const price = parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']);
                if (!isNaN(price)) {
                    results.push({ symbol: ticker, price });
                }
            }

            // To respect the "5 calls per minute" limit if applicable (though user said hourly is fine)
            // if (tickers.length > 5) await new Promise(resolve => setTimeout(resolve, 12000));

        } catch (error) {
            console.error(`Error fetching Alpha Vantage data for ${ticker}:`, error);
        }
    }

    return results;
};
