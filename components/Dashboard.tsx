import React from 'react';
import { CashAccount, Investment, Property, Liability } from '../types';
import Card from './Card';
import InvestmentTable from './InvestmentTable';
import FinancialInsights from './FinancialInsights';
import NetWorthChart from './NetWorthChart';

interface DashboardProps {
    netWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    fireCalculations: { requiredPortfolio: number; yearsToFire: string; };
    cashAccounts: CashAccount[];
    properties: Property[];
    liabilities: Liability[];
    investments: Investment[];
    refreshInvestmentPrices: () => void;
    netWorthChartData: { month: string; netWorth: number; }[];
    optimizationResult: string;
    runRebalancing: () => void;
    formatCurrency: (value: number) => string;
}

const Dashboard: React.FC<DashboardProps> = ({
    netWorth,
    totalAssets,
    totalLiabilities,
    fireCalculations,
    cashAccounts,
    properties,
    liabilities,
    investments,
    refreshInvestmentPrices,
    netWorthChartData,
    optimizationResult,
    runRebalancing,
    formatCurrency
}) => {
    return (
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Net Worth" className="md:col-span-2">
                    <div className="text-5xl font-bold text-white tracking-tight">{formatCurrency(netWorth)}</div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-sm text-green-400">Total Assets</div>
                            <div className="text-xl font-semibold">{formatCurrency(totalAssets)}</div>
                        </div>
                        <div>
                            <div className="text-sm text-red-400">Total Liabilities</div>
                            <div className="text-xl font-semibold">{formatCurrency(totalLiabilities)}</div>
                        </div>
                    </div>
                </Card>
                <Card title="FIRE Dashboard">
                     <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-400 block">Required FIRE Portfolio</label>
                            <p className="text-2xl font-semibold text-indigo-400">{formatCurrency(fireCalculations.requiredPortfolio)}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block">Estimated Years to FIRE</label>
                            <p className="text-2xl font-semibold">{fireCalculations.yearsToFire}</p>
                        </div>
                    </div>
                </Card>
            </div>
            
            <div className="lg:col-span-2">
                <Card title="Investments">
                    <div className="flex justify-end mb-4">
                        <button onClick={refreshInvestmentPrices} className="btn-primary" style={{width: 'auto'}}>Refresh Prices</button>
                    </div>
                    <InvestmentTable investments={investments} />
                </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
                <Card title="Assets">
                    <ul className="space-y-2">
                      {cashAccounts.map(a => <li key={a.id} className="flex justify-between"><span>{a.name}</span><span className="font-mono">{formatCurrency(a.balance)}</span></li>)}
                      {properties.map(p => <li key={p.id} className="flex justify-between"><span>{p.name}</span><span className="font-mono">{formatCurrency(p.currentValue)}</span></li>)}
                    </ul>
                </Card>
                 <Card title="Liabilities">
                    <ul className="space-y-2">
                      {liabilities.map(l => <li key={l.id} className="flex justify-between"><span>{l.name}</span><span className="font-mono">{formatCurrency(l.outstandingBalance)}</span></li>)}
                    </ul>
                </Card>
            </div>

            <div className="lg:col-span-3">
                <Card title="Net Worth Trajectory (12 Months)">
                    <NetWorthChart data={netWorthChartData} />
                </Card>
            </div>
            
            <div className="lg:col-span-3">
                <Card title="AI Financial Insights">
                   <FinancialInsights />
                </Card>
            </div>
            
            <div className="lg:col-span-3">
                 <Card title="Investment Optimizations">
                    <button onClick={runRebalancing} className="btn-primary mb-4" style={{width: 'auto'}}>Run Rebalancing Algorithm</button>
                    {optimizationResult && <div className="bg-indigo-500/20 text-indigo-300 p-3 rounded-lg">{optimizationResult}</div>}
                </Card>
            </div>

        </main>
    );
};

export default Dashboard;
