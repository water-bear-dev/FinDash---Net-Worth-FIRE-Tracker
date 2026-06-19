import React, { useMemo, useState } from 'react';
import moment from 'moment';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BudgetItem, Liability } from '../types';
import Card from '../components/Card';
import CsvImportModal from '../components/CsvImportModal';
import { computeCategoryTrends, computeMonthlyVariance } from '../services/budgetVariance';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

interface CashFlowPageProps {
    budgetItems: BudgetItem[];
    liabilities: Liability[];
    geminiApiKey: string;
    addBudgetItem: (item: Omit<BudgetItem, 'id'>) => void;
    formatCurrency: (value: number) => string;
}

const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const CashFlowPage: React.FC<CashFlowPageProps> = ({
    budgetItems,
    liabilities,
    geminiApiKey,
    addBudgetItem,
    formatCurrency,
}) => {
    const [currentMonth, setCurrentMonth] = useState(moment());
    const [isImportOpen, setIsImportOpen] = useState(false);

    const variance = useMemo(
        () => computeMonthlyVariance(budgetItems, liabilities, currentMonth),
        [budgetItems, liabilities, currentMonth]
    );

    const categoryTrends = useMemo(
        () => computeCategoryTrends(budgetItems, liabilities, 6),
        [budgetItems, liabilities]
    );

    const trendChartData = useMemo(() => {
        const months = [...new Set(categoryTrends.map(p => p.month))].sort();
        const categories = [...new Set(categoryTrends.map(p => p.category))].slice(0, 5);
        return months.map(month => {
            const row: Record<string, string | number> = { month };
            categories.forEach(cat => {
                const point = categoryTrends.find(p => p.month === month && p.category === cat);
                row[cat] = point?.amount || 0;
            });
            return row;
        });
    }, [categoryTrends]);

    const topCategories = useMemo(() => {
        const cats = [...new Set(categoryTrends.map(p => p.category))].slice(0, 5);
        return cats;
    }, [categoryTrends]);

    const expenseVariances = variance.byCategory.filter(v => v.type === 'expense');
    const netPlanned = variance.totalPlannedIncome - variance.totalPlannedExpenses;
    const netActual = variance.totalActualIncome - variance.totalActualExpenses;
    const netVariance = netActual - netPlanned;

    const btnPrimary = "text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg text-sm px-5 py-2.5 transition-colors";

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cash Flow</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Compare planned recurring budget vs actual logged events.
                    </p>
                </div>
                <button onClick={() => setIsImportOpen(true)} className={btnPrimary} data-testid="import-csv-btn">
                    Import CSV
                </button>
            </header>

            <Card title="Month Overview">
                <div className="flex items-center justify-center gap-4 mb-6">
                    <button onClick={() => setCurrentMonth(m => m.clone().subtract(1, 'month'))} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <h3 className="text-xl font-semibold w-40 text-center">{currentMonth.format('MMMM YYYY')}</h3>
                    <button onClick={() => setCurrentMonth(m => m.clone().add(1, 'month'))} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <ChevronRightIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => setCurrentMonth(moment())} className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-gray-200 dark:bg-gray-700">
                        This Month
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="variance-summary">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <p className="text-xs text-gray-500 uppercase">Planned Net</p>
                        <p className="text-2xl font-bold">{formatCurrency(netPlanned)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <p className="text-xs text-gray-500 uppercase">Actual Net</p>
                        <p className="text-2xl font-bold">{formatCurrency(netActual)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                        <p className="text-xs text-gray-500 uppercase">Variance</p>
                        <p className={`text-2xl font-bold ${netVariance > 0 ? 'text-green-500' : netVariance < 0 ? 'text-red-500' : ''}`}>
                            {formatCurrency(netVariance)}
                        </p>
                    </div>
                </div>
            </Card>

            {budgetItems.length === 0 ? (
                <Card title="No Data">
                    <p className="text-gray-500 text-center py-8">Add income and expense items to see cash flow variance.</p>
                </Card>
            ) : (
                <>
                    <Card title="Category Variance">
                        <div className="overflow-x-auto" data-testid="variance-table">
                            <table className="w-full text-left text-sm">
                                <thead className="text-xs uppercase text-gray-500 bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th className="px-4 py-2">Category</th>
                                        <th className="px-4 py-2">Type</th>
                                        <th className="px-4 py-2 text-right">Planned</th>
                                        <th className="px-4 py-2 text-right">Actual</th>
                                        <th className="px-4 py-2 text-right">Variance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {expenseVariances.map(v => (
                                        <tr key={`${v.category}-${v.type}`} data-testid={`variance-row-${v.category}`}>
                                            <td className="px-4 py-2 font-medium">{v.category}</td>
                                            <td className="px-4 py-2 capitalize">{v.type}</td>
                                            <td className="px-4 py-2 text-right">{formatCurrency(v.planned)}</td>
                                            <td className="px-4 py-2 text-right">{formatCurrency(v.actual)}</td>
                                            <td className={`px-4 py-2 text-right font-semibold ${v.variance > 0 ? 'text-red-500' : v.variance < 0 ? 'text-green-500' : ''}`}>
                                                {formatCurrency(v.variance)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {expenseVariances.length === 0 && (
                                <p className="text-center text-gray-500 py-6">No expense variance data for this month.</p>
                            )}
                        </div>
                    </Card>

                    <Card title="6-Month Expense Trends by Category">
                        {trendChartData.length > 0 ? (
                            <div data-testid="category-trend-chart" className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={trendChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                        <Legend />
                                        {topCategories.map((cat, i) => (
                                            <Bar key={cat} dataKey={cat} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-8">Not enough data for trend chart.</p>
                        )}
                    </Card>
                </>
            )}

            {isImportOpen && (
                <CsvImportModal
                    budgetItems={budgetItems}
                    geminiApiKey={geminiApiKey}
                    addBudgetItem={addBudgetItem}
                    onClose={() => setIsImportOpen(false)}
                />
            )}
        </div>
    );
};

export default CashFlowPage;
