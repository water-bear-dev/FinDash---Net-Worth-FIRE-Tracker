import React from 'react';
import { Investment } from '../types';
import Card from '../components/Card';
import InvestmentTable from '../components/InvestmentTable';
import ApiKeyWarning from '../components/ApiKeyWarning';

interface InvestmentsPageProps {
    holdings: Investment[];
    refreshPrices: () => void;
    isPricesLoading: boolean;
    fmpApiKey: string;
}

const InvestmentsPage: React.FC<InvestmentsPageProps> = ({
    holdings,
    refreshPrices,
    isPricesLoading,
    fmpApiKey
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
                        disabled={isPricesLoading || !fmpApiKey}
                        title={!fmpApiKey ? "Please set your API key in Settings to refresh prices" : ""}
                    >
                        {isPricesLoading ? 'Refreshing...' : 'Refresh Prices'}
                    </button>
                </div>
                {!fmpApiKey && <ApiKeyWarning featureName="live price updates" />}
                <InvestmentTable investments={holdings} />
            </Card>

            <Card title="Rebalancing Engine (Coming Soon)">
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <p className="mb-2">Portfolio rebalancing will be implemented in Phase 2.</p>
                    <ul className="text-sm list-disc list-inside inline-block text-left">
                        <li>Set Target Allocations (e.g., 80% Stocks, 20% Bonds)</li>
                        <li>Automated Buy/Sell recommendations to reach equilibrium</li>
                    </ul>
                </div>
            </Card>
        </main>
    );
};

export default InvestmentsPage;
