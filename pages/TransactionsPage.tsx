import React, { useState, ChangeEvent, useMemo } from 'react';
import { Transaction, AssetCategory, Dividend, Investment, UpcomingDividend } from '../types';
import Card from '../components/Card';
import AllocationDonutChart from '../components/AllocationDonutChart';
import ConfirmationModal from '../components/ConfirmationModal';
import TransactionHistoryTable from '../components/TransactionHistoryTable';
import { fetchUpcomingDividends } from '../services/marketDataService';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import ApiKeyWarning from '../components/ApiKeyWarning';

interface TransactionsPageProps {
    transactions: Transaction[];
    investments: Investment[]; // Now receives live-priced investments
    addTransactionAndUpdateBudget: (transaction: Omit<Transaction, 'id'>) => void;
    removeTransaction: (id: string) => void;
    dividends: Dividend[];
    addDividend: (dividend: Omit<Dividend, 'id'>) => void;
    removeDividend: (id: string) => void;
    formatCurrency: (value: number) => string;
    avApiKey: string;
}

const TransactionModal: React.FC<{
    onSave: (transaction: Omit<Transaction, 'id'>) => void;
    onClose: () => void;
}> = ({ onSave, onClose }) => {
    const [formState, setFormState] = useState({
        ticker: '',
        category: AssetCategory.Stock,
        type: 'buy' as 'buy' | 'sell',
        date: new Date().toISOString().split('T')[0],
        quantity: '',
        pricePerUnit: ''
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formState,
            ticker: formState.ticker.toUpperCase(),
            quantity: parseFloat(formState.quantity),
            pricePerUnit: parseFloat(formState.pricePerUnit)
        });
    };
    
    const inputClasses = "block w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500";
    const btnPrimaryClasses = "text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800";
    const btnSecondaryClasses = "text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700";
    const labelClasses = "block mb-1 text-sm font-medium text-gray-900 dark:text-gray-300";

    return (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Transaction</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className={labelClasses}>Ticker</label><input name="ticker" type="text" placeholder="e.g., VOO, CBA.AX" value={formState.ticker} onChange={handleChange} required className={inputClasses} /></div>
                        <div><label className={labelClasses}>Category</label><select name="category" value={formState.category} onChange={handleChange} required className={inputClasses}><option value={AssetCategory.Stock}>Stock</option><option value={AssetCategory.ETF}>ETF</option><option value={AssetCategory.Crypto}>Crypto</option></select></div>
                        <div><label className={labelClasses}>Type</label><select name="type" value={formState.type} onChange={handleChange} required className={inputClasses}><option value="buy">Buy</option><option value="sell">Sell</option></select></div>
                        <div><label className={labelClasses}>Date</label><input name="date" type="date" value={formState.date} onChange={handleChange} required className={inputClasses} /></div>
                        <div><label className={labelClasses}>Quantity</label><input name="quantity" type="number" placeholder="0" value={formState.quantity} onChange={handleChange} required className={inputClasses} step="any"/></div>
                        <div><label className={labelClasses}>Price per Unit</label><input name="pricePerUnit" type="number" placeholder="0.00" value={formState.pricePerUnit} onChange={handleChange} required className={inputClasses} step="any"/></div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className={`${btnSecondaryClasses} w-auto`}>Cancel</button>
                        <button type="submit" className={`${btnPrimaryClasses} w-auto`}>Save Transaction</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DividendModal: React.FC<{
    onSave: (dividend: Omit<Dividend, 'id'>) => void;
    onClose: () => void;
}> = ({ onSave, onClose }) => {
    const [formState, setFormState] = useState({
        ticker: '',
        date: new Date().toISOString().split('T')[0],
        amount: ''
    });

     const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formState,
            ticker: formState.ticker.toUpperCase(),
            amount: parseFloat(formState.amount)
        });
    };

    const inputClasses = "block w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500";
    const btnPrimaryClasses = "text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800";
    const btnSecondaryClasses = "text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700";
    const labelClasses = "block mb-1 text-sm font-medium text-gray-900 dark:text-gray-300";

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                 <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Dividend</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div><label className={labelClasses}>Ticker</label><input name="ticker" type="text" placeholder="e.g., VOO" value={formState.ticker} onChange={handleChange} required className={inputClasses} /></div>
                     <div><label className={labelClasses}>Date Received</label><input name="date" type="date" value={formState.date} onChange={handleChange} required className={inputClasses} /></div>
                     <div><label className={labelClasses}>Total Amount</label><input name="amount" type="number" placeholder="0.00" value={formState.amount} onChange={handleChange} required className={inputClasses} step="any"/></div>
                     <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className={`${btnSecondaryClasses} w-auto`}>Cancel</button>
                        <button type="submit" className={`${btnPrimaryClasses} w-auto`}>Save Dividend</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const InvestmentTradingPage: React.FC<TransactionsPageProps> = ({ 
    transactions, 
    investments,
    addTransactionAndUpdateBudget, 
    removeTransaction,
    dividends,
    addDividend,
    removeDividend,
    formatCurrency,
    avApiKey,
}) => {
    const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
    const [isDividendModalOpen, setDividendModalOpen] = useState(false);
    const [dividendToDelete, setDividendToDelete] = useState<Dividend | null>(null);

    
    const summaries = useMemo(() => {
        const summaryData: Record<string, { invested: number; currentValue: number; pnl: number; pnlPercent: number }> = {};

        // Group investments by category
        const investmentsByCategory = investments.reduce((acc, inv) => {
            if (!acc[inv.category]) acc[inv.category] = [];
            acc[inv.category].push(inv);
            return acc;
        }, {} as Record<AssetCategory, Investment[]>);

        // Calculate summaries for each category
        for (const category of Object.keys(investmentsByCategory) as AssetCategory[]) {
            const categoryInvestments = investmentsByCategory[category];
            const invested = categoryInvestments.reduce((sum, inv) => sum + (inv.quantity * inv.costBasisPerUnit), 0);
            const currentValue = categoryInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
            const pnl = currentValue - invested;
            const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
            summaryData[category] = { invested, currentValue, pnl, pnlPercent };
        }
        return summaryData;
    }, [investments]);
    

    const handleSaveTransaction = (transaction: Omit<Transaction, 'id'>) => {
        addTransactionAndUpdateBudget(transaction);
        setTransactionModalOpen(false);
    }
    
    const handleSaveDividend = (dividend: Omit<Dividend, 'id'>) => {
        addDividend(dividend);
        setDividendModalOpen(false);
    }

    const handleConfirmDividendDelete = () => {
        if (dividendToDelete) {
            removeDividend(dividendToDelete.id);
            setDividendToDelete(null);
        }
    };


    const totalDividends = dividends.reduce((sum, d) => sum + d.amount, 0);

    const btnPrimaryClasses = "text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800";
    const btnDangerClasses = "text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 transition-colors";

    return (
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400">Track your investment performance and dividend income.</p>
                </div>
                <div className="flex items-center space-x-2">
                     <button onClick={() => setTransactionModalOpen(true)} className={btnPrimaryClasses}>Add Transaction</button>
                     <button onClick={() => setDividendModalOpen(true)} className={btnPrimaryClasses}>Add Dividend</button>
                </div>
            </header>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {Object.keys(summaries).map((category) => {
                    const typedCategory = category as AssetCategory;
                    const summary = summaries[typedCategory];
                    if (!summary) return null;

                    const categoryInvestments = investments.filter(inv => inv.category === typedCategory);
                    const chartData = categoryInvestments.map(inv => ({
                        name: inv.ticker,
                        value: inv.currentValue,
                    }));

                    return (
                    <Card key={typedCategory} title={`${typedCategory} Performance`}>
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm"><span className="text-gray-400">Invested Capital</span><span className="font-semibold">{formatCurrency(summary.invested)}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-400">Current Value</span><span className="font-semibold">{formatCurrency(summary.currentValue)}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-gray-400">P/L</span><span className={`font-semibold ${summary.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(summary.pnl)}</span></div>
                             <div className="flex justify-between text-sm"><span className="text-gray-400">P/L %</span><span className={`font-semibold ${summary.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{summary.pnlPercent.toFixed(2)}%</span></div>
                        </div>
                        {chartData.length > 1 && (
                            <div className="h-56 -mb-4">
                                <AllocationDonutChart data={chartData} height={220} formatCurrency={formatCurrency} />
                            </div>
                        )}
                    </Card>
                )})}
            </div>


            <Card title="Transaction History">
                <TransactionHistoryTable
                    transactions={transactions}
                    formatCurrency={formatCurrency}
                    onDelete={removeTransaction}
                />
            </Card>

            <Card title="Dividend History">
                <p className="mb-4 text-lg text-gray-900 dark:text-white">Total Received: <span className="font-bold text-green-500 dark:text-green-400">{formatCurrency(totalDividends)}</span></p>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-2">Date</th><th className="px-4 py-2">Ticker</th>
                                <th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {dividends.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(d => (
                                <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-2">{d.date}</td>
                                    <td className="px-4 py-2 font-medium">{d.ticker}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(d.amount)}</td>
                                    <td className="px-4 py-2 text-center">
                                        <button onClick={() => setDividendToDelete(d)} className={`${btnDangerClasses} w-auto text-xs py-1 px-2`}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {isTransactionModalOpen && <TransactionModal onSave={handleSaveTransaction} onClose={() => setTransactionModalOpen(false)} />}
            {isDividendModalOpen && <DividendModal onSave={handleSaveDividend} onClose={() => setDividendModalOpen(false)} />}
            
            <ConfirmationModal
                isOpen={!!dividendToDelete}
                onClose={() => setDividendToDelete(null)}
                onConfirm={handleConfirmDividendDelete}
                title="Delete Dividend"
                message={`Are you sure you want to delete the dividend for "${dividendToDelete?.ticker}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default InvestmentTradingPage;