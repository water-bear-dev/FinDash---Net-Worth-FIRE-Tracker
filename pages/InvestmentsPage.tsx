import React, { useMemo } from 'react';
import { Dividend, Investment, PortfolioAnalyticsSettings, RebalancingSettings, TargetAllocation, Transaction } from '../types';
import Card from '../components/Card';
import InvestmentTable from '../components/InvestmentTable';
import RebalancingEngine from '../components/RebalancingEngine';
import HowItWorksModal from '../components/HowItWorksModal';
import PortfolioPerformance from '../components/PortfolioPerformance';
import GainsBreakdown from '../components/GainsBreakdown';
import TaxLossHarvestCard from '../components/TaxLossHarvestCard';
import DividendAnalytics from '../components/DividendAnalytics';
import DiversificationCharts from '../components/DiversificationCharts';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import {
    computeRealizedGains,
    computeUnrealizedGains,
    getRealizedGainsYtd,
} from '../services/taxLots';

interface InvestmentsPageProps {
    holdings: Investment[];
    transactions: Transaction[];
    dividends: Dividend[];
    refreshPrices: () => void;
    isPricesLoading: boolean;
    targetAllocations: TargetAllocation[];
    setTargetAllocations: (value: TargetAllocation[] | ((val: TargetAllocation[]) => TargetAllocation[])) => void;
    rebalancingSettings: RebalancingSettings;
    setRebalancingSettings: (settings: RebalancingSettings) => void;
    monthlySavings: number;
    dripSettings: Record<string, boolean>;
    setDripSettings: (settings: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
    portfolioAnalyticsSettings: PortfolioAnalyticsSettings;
    formatCurrency: (value: number) => string;
}

const InvestmentsPage: React.FC<InvestmentsPageProps> = ({
    holdings,
    transactions,
    dividends,
    refreshPrices,
    isPricesLoading,
    targetAllocations,
    setTargetAllocations,
    rebalancingSettings,
    setRebalancingSettings,
    monthlySavings,
    dripSettings,
    setDripSettings,
    portfolioAnalyticsSettings,
    formatCurrency
}) => {
    const [isHowItWorksOpen, setIsHowItWorksOpen] = React.useState(false);

    const realizedGains = useMemo(() => computeRealizedGains(transactions), [transactions]);
    const unrealizedGains = useMemo(() => computeUnrealizedGains(holdings), [holdings]);
    const realizedYtdByTicker = useMemo(() => getRealizedGainsYtd(realizedGains), [realizedGains]);

    const unrealizedByTicker = useMemo(() => {
        const map = new Map<string, number>();
        unrealizedGains.forEach(u => map.set(u.ticker, u.gain));
        return map;
    }, [unrealizedGains]);

    const handleDripToggle = (ticker: string, enabled: boolean) => {
        setDripSettings(prev => ({ ...prev, [ticker]: enabled }));
    };

    return (
        <main className="space-y-6">
             <header className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio Holdings</h1>
                        <button 
                            onClick={() => setIsHowItWorksOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                            <InformationCircleIcon className="w-5 h-5" />
                            How it works
                        </button>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">View and manage your investment holdings and target allocations.</p>
                </div>
            </header>

            <HowItWorksModal 
                isOpen={isHowItWorksOpen} 
                onClose={() => setIsHowItWorksOpen(false)} 
                section="INVESTMENTS" 
            />

            <PortfolioPerformance
                transactions={transactions}
                dividends={dividends}
                holdings={holdings}
                benchmarkTicker={portfolioAnalyticsSettings.benchmarkTicker}
                formatCurrency={formatCurrency}
            />

            <Card title="Current Investments">
                <div className="flex justify-end mb-4">
                    <button 
                        onClick={refreshPrices} 
                        className="w-auto text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                        disabled={isPricesLoading}
                    >
                        {isPricesLoading ? 'Refreshing...' : 'Refresh Prices'}
                    </button>
                </div>
                <InvestmentTable
                    investments={holdings}
                    formatCurrency={formatCurrency}
                    unrealizedByTicker={unrealizedByTicker}
                    realizedYtdByTicker={realizedYtdByTicker}
                />
            </Card>

            <GainsBreakdown
                realizedGains={realizedGains}
                unrealizedGains={unrealizedGains}
                formatCurrency={formatCurrency}
            />

            <TaxLossHarvestCard
                unrealizedGains={unrealizedGains}
                realizedGains={realizedGains}
                formatCurrency={formatCurrency}
            />

            <DividendAnalytics
                dividends={dividends}
                holdings={holdings}
                dripSettings={dripSettings}
                onDripToggle={handleDripToggle}
                formatCurrency={formatCurrency}
            />

            <DiversificationCharts holdings={holdings} formatCurrency={formatCurrency} />

            <Card title="Rebalancing Engine">
                <RebalancingEngine 
                    holdings={holdings}
                    targetAllocations={targetAllocations}
                    setTargetAllocations={setTargetAllocations}
                    rebalancingSettings={rebalancingSettings}
                    setRebalancingSettings={setRebalancingSettings}
                    monthlySavings={monthlySavings}
                    formatCurrency={formatCurrency}
                />
            </Card>
        </main>
    );
};

export default InvestmentsPage;
