import React from 'react';
import { Investment, TargetAllocation, RebalancingSettings } from '../types';
import Card from '../components/Card';
import InvestmentTable from '../components/InvestmentTable';
import ApiKeyWarning from '../components/ApiKeyWarning';
import RebalancingEngine from '../components/RebalancingEngine';

interface InvestmentsPageProps {
    holdings: Investment[];
    refreshPrices: () => void;
    isPricesLoading: boolean;
    avApiKey: string;
    targetAllocations: TargetAllocation[];
    setTargetAllocations: (value: TargetAllocation[] | ((val: TargetAllocation[]) => TargetAllocation[])) => void;
    rebalancingSettings: RebalancingSettings;
    setRebalancingSettings: (settings: RebalancingSettings) => void;
    monthlySavings: number;
    formatCurrency: (value: number) => string;
}

const InvestmentsPage: React.FC<InvestmentsPageProps> = ({
    holdings,
    refreshPrices,
    isPricesLoading,
    avApiKey,
    targetAllocations,
    setTargetAllocations,
    rebalancingSettings,
    setRebalancingSettings,
    monthlySavings,
    formatCurrency
}) => {
    return (
        <main className="space-y-6">
             <header className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio Holdings</h1>
                <p className="text-gray-500 dark:text-gray-400">View and manage your investment holdings.</p>
            </header>

            <Card title="Current Investments">
                <div className="flex justify-end mb-4">
                    <button 
                        onClick={refreshPrices} 
                        className="w-auto text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                        disabled={isPricesLoading || !avApiKey}
                        title={!avApiKey ? "Please set your API key in Settings to refresh prices" : ""}
                    >
                        {isPricesLoading ? 'Refreshing...' : 'Refresh Prices'}
                    </button>
                </div>
                {!avApiKey && <ApiKeyWarning featureName="live price updates" />}
                <InvestmentTable investments={holdings} />
            </Card>

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
