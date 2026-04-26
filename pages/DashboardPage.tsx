import React from 'react';
import { HistoricalNetWorth, CashAccount, Investment, Property, AssetCategory } from '../types';
import Card from '../components/Card';
import AllocationDonutChart from '../components/AllocationDonutChart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Treemap } from 'recharts';

interface DashboardPageProps {
    netWorth: number;
    historicalNetWorth: HistoricalNetWorth[];
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
    avApiKey: string;
}

const DashboardPage: React.FC<DashboardPageProps> = ({
    netWorth,
    historicalNetWorth,
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
    avApiKey
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

    // Format data for Treemap
    const treemapData = React.useMemo(() => {
        const children = allocationData.map(item => ({
            name: item.name,
            size: item.value
        }));
        return [{ name: 'Portfolio', children }];
    }, [allocationData]);
    
    const savingsRate = monthlyIncome > 0 ? (budgetSummary.netMonthlySavings / monthlyIncome) * 100 : 0;

    // Custom Tooltip for LineChart
    const CustomLineTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{label}</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <Card title="FIRE Journey">
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Target Annual Spend</p>
                            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(fireData.targetAnnualSpending)}</p>
                        </div>
                        <div className="mt-4">
                            <a href="#/fire" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium">
                                View Full FIRE Dashboard &rarr;
                            </a>
                        </div>
                    </div>
                </Card>
            </div>

             <Card title="Asset Allocation">
                <AllocationDonutChart data={allocationData} formatCurrency={formatCurrency} />
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Historical Net Worth">
                    {historicalNetWorth.length > 0 ? (
                        <div className="h-64 mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={historicalNetWorth}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="#6B7280" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                    />
                                    <YAxis 
                                        stroke="#6B7280" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} 
                                    />
                                    <RechartsTooltip content={<CustomLineTooltip />} />
                                    <Line 
                                        type="monotone" 
                                        dataKey="netWorth" 
                                        stroke="#6366f1" 
                                        strokeWidth={3} 
                                        dot={{ r: 4, strokeWidth: 2 }} 
                                        activeDot={{ r: 6, strokeWidth: 0 }} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                            Not enough historical data to display.
                        </div>
                    )}
                </Card>

                <Card title="Portfolio Treemap Heatmap">
                    <div className="h-64 mt-4 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <Treemap
                                data={treemapData}
                                dataKey="size"
                                stroke="#fff"
                                fill="#818cf8"
                                animationDuration={800}
                                animationEasing="ease-out"
                            >
                                <RechartsTooltip 
                                    formatter={(value: number) => formatCurrency(value)} 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                                />
                            </Treemap>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </main>
    );
};

export default DashboardPage;
