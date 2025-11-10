import React, { useState } from 'react';
import Card from '../components/Card';
import { fetchCompanyProfile, fetchStockNews } from '../services/marketDataService';
import { CompanyProfile, StockNewsItem } from '../types';
import ApiKeyWarning from '../components/ApiKeyWarning';

interface MarketResearchPageProps {
    fmpApiKey: string;
    formatCurrency: (value: number) => string;
}

const MarketResearchPage: React.FC<MarketResearchPageProps> = ({ fmpApiKey, formatCurrency }) => {
    const [ticker, setTicker] = useState('');
    const [profile, setProfile] = useState<CompanyProfile | null>(null);
    const [news, setNews] = useState<StockNewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticker.trim() || !fmpApiKey) {
            setError(!fmpApiKey ? "Please set your FMP API Key in the Settings page." : "Please enter a ticker.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setProfile(null);
        setNews([]);

        try {
            const [profileData, newsData] = await Promise.all([
                fetchCompanyProfile(ticker, fmpApiKey),
                fetchStockNews(ticker, fmpApiKey)
            ]);

            if (!profileData) {
                throw new Error(`Could not find company profile for ticker: ${ticker}`);
            }
            setProfile(profileData);
            setNews(newsData);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const inputClasses = "block w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500";
    const btnPrimaryClasses = "w-full sm:w-auto text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Market Research</h1>
                <p className="text-gray-500 dark:text-gray-400">Get detailed company profiles and news for any stock ticker.</p>
            </header>
            
            {!fmpApiKey && <ApiKeyWarning featureName="market research" />}
            
            <Card title="Ticker Search">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value.toUpperCase())}
                        placeholder="e.g., AAPL, CBA.AX"
                        className={`${inputClasses} flex-grow`}
                        disabled={isLoading || !fmpApiKey}
                    />
                    <button type="submit" className={btnPrimaryClasses} disabled={isLoading || !fmpApiKey}>
                        {isLoading ? 'Searching...' : 'Search'}
                    </button>
                </form>
            </Card>

            {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg">{error}</div>}

            {profile && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <Card title="Company Profile">
                            <div className="flex items-center space-x-4 mb-4">
                                <img src={profile.image} alt={profile.companyName} className="h-16 w-16 rounded-full bg-gray-700"/>
                                <div>
                                    <h3 className="text-xl font-bold">{profile.companyName} ({profile.symbol})</h3>
                                    <p className="text-2xl font-bold text-indigo-400">{formatCurrency(profile.price)}</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-400 mb-4">{profile.description}</p>
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline text-sm">Visit Website</a>
                        </Card>
                    </div>
                     <div className="lg:col-span-2">
                        <Card title="Financial Snapshot">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div><dt className="text-gray-400">Market Cap</dt><dd className="font-semibold">{formatCurrency(profile.mktCap)}</dd></div>
                                <div><dt className="text-gray-400">Sector</dt><dd className="font-semibold">{profile.sector}</dd></div>
                                <div><dt className="text-gray-400">Industry</dt><dd className="font-semibold">{profile.industry}</dd></div>
                                <div><dt className="text-gray-400">52-Week Range</dt><dd className="font-semibold">{profile.range}</dd></div>
                                <div><dt className="text-gray-400">Avg. Volume</dt><dd className="font-semibold">{profile.volAvg.toLocaleString()}</dd></div>
                                <div><dt className="text-gray-400">CEO</dt><dd className="font-semibold">{profile.ceo}</dd></div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
            
            {news.length > 0 && (
                <Card title="Latest News">
                    <div className="space-y-4">
                        {news.map((item, index) => (
                             <a href={item.url} target="_blank" rel="noopener noreferrer" key={index} className="block p-4 rounded-lg hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-start space-x-4">
                                    {item.image && <img src={item.image} alt="" className="w-24 h-24 object-cover rounded-md flex-shrink-0" />}
                                    <div>
                                        <p className="font-bold text-gray-100">{item.title}</p>
                                        <p className="text-xs text-gray-400 mt-1">{item.site} - {new Date(item.publishedDate).toLocaleDateString()}</p>
                                        <p className="text-sm text-gray-300 mt-2 line-clamp-2">{item.text}</p>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </Card>
            )}

        </div>
    );
};

export default MarketResearchPage;