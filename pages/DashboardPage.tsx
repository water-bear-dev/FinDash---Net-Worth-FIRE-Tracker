import React from 'react';
import { CashAccount, Investment, Property, AssetCategory } from '../types';
import Card from '../components/Card';
import InvestmentTable from '../components/InvestmentTable';
import AllocationDonutChart from '../components/AllocationDonutChart';
import ApiKeyWarning from '../components/ApiKeyWarning';

interface DashboardPageProps {
    netWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    fireData: { targetAnnualSpending: number; monthlySavings: number; };
    holdings: Investment[];
    cashAccounts: CashAccount[];
    properties: Property[];
    budgetSummary: { totalExpenses: number; netMonthlySavings: number };
    monthlyIncome: number;
    refreshPrices: () => void;
    isPricesLoading: boolean;
    formatCurrency: (value: number) => string;
    fmpApiKey: string;
}

const DashboardPage: React.FC<DashboardPageProps> = ({
    netWorth,
    totalAssets,
    totalLiabilities,
    fireData,
    holdings,
    cashAccounts,
    properties,
    budgetSummary,
    monthlyIncome,
    refreshPrices,
    isPricesLoading,
    formatCurrency,
    fmpApiKey
}) => {

    const allocationData = React.useMemo(() => {
        const data: { [key in AssetCategory]?: number } = {};
        
        holdings.forEach(h => {
            data[h.category] = (data[h.category] || 0) + h.currentValue;
        });
        cashAccounts.forEach(c => {
             data[AssetCategory.Cash] = (data[AssetCategory.Cash] || 0) + c.balance;
        });
        properties.forEach(p => {
             data[AssetCategory.Property] = (data[AssetCategory.Property] || 0) + p.currentValue;
        });

        return Object.entries(data).map(([name, value]) => ({
            name,
            value,
        }));

    }, [holdings, cashAccounts, properties]);
    
    const savingsRate = monthlyIncome > 0 ? (budgetSummary.netMonthlySavings / monthlyIncome) * 100 : 0;

    return (
        <main className="space-y-6">
             <header className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400">A high-level overview of your financial status.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card title="Net Worth">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{formatCurrency(netWorth)}</div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Your financial snapshot</div>
                </Card>
                 <Card title="Total Assets">
                    <div className="text-4xl font-bold text-green-500 tracking-tight">{formatCurrency(totalAssets)}</div>
                     <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">What you own</div>
                    </Card>
                 <Card title="Total Liabilities">
                    <div className="text-4xl font-bold text-red-500 tracking-tight">{formatCurrency(totalLiabilities)}</div>
                     <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">What you owe</div>
                    </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <Card title="Investments">
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
                </div>
                <div className="lg:col-span-2 space-y-6">
                     <Card title="Budget Summary">
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Savings Rate</p>
                                <p className="text-2xl font-semibold text-indigo-500 dark:text-indigo-400">{savingsRate.toFixed(1)}%</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Net Monthly Savings</p>
                                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(budgetSummary.netMonthlySavings)}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

             <Card title="Asset Allocation">
                <AllocationDonutChart data={allocationData} formatCurrency={formatCurrency} />
            </Card>
        </main>
    );
};

export default DashboardPage;
