import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { ArrowsUpDownIcon, TrashIcon } from '@heroicons/react/24/outline';

interface TransactionHistoryTableProps {
    transactions: Transaction[];
    formatCurrency: (value: number) => string;
    onDelete: (id: string) => void;
}

type SortKeys = 'date' | 'ticker' | 'type' | 'quantity' | 'pricePerUnit' | 'total';

const TransactionHistoryTable: React.FC<TransactionHistoryTableProps> = ({ transactions, formatCurrency, onDelete }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortKeys; direction: 'ascending' | 'descending' } | null>({ key: 'date', direction: 'descending' });
    const [filters, setFilters] = useState({ ticker: '', type: 'all', startDate: '', endDate: '' });
    const [itemToDelete, setItemToDelete] = useState<Transaction | null>(null);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const startDate = filters.startDate ? new Date(filters.startDate) : null;
            const endDate = filters.endDate ? new Date(filters.endDate) : null;

            // Adjust for timezone differences by comparing dates only
            if (startDate) startDate.setUTCHours(0, 0, 0, 0);
            if (endDate) endDate.setUTCHours(23, 59, 59, 999);
            
            return (
                t.ticker.toLowerCase().includes(filters.ticker.toLowerCase()) &&
                (filters.type === 'all' || t.type === filters.type) &&
                (!startDate || transactionDate >= startDate) &&
                (!endDate || transactionDate <= endDate)
            );
        });
    }, [transactions, filters]);

    const sortedTransactions = useMemo(() => {
        let sortableItems = [...filteredTransactions];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;

                if (sortConfig.key === 'total') {
                    aValue = a.quantity * a.pricePerUnit;
                    bValue = b.quantity * b.pricePerUnit;
                } else {
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredTransactions, sortConfig]);
    
    const requestSort = (key: SortKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const resetFilters = () => {
        setFilters({ ticker: '', type: 'all', startDate: '', endDate: '' });
    };

    const handleConfirmDelete = () => {
        if (itemToDelete) {
            onDelete(itemToDelete.id);
            setItemToDelete(null);
        }
    };
    
    const inputClasses = "block w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500";
    const btnSecondaryClasses = "text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 transition-colors";
    
    const SortableHeader: React.FC<{ sortKey: SortKeys, children: React.ReactNode, className?: string }> = ({ sortKey, children, className }) => (
        <th className={`px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 ${className}`} onClick={() => requestSort(sortKey)}>
            <div className="flex items-center justify-between">
                <span>{children}</span>
                <ArrowsUpDownIcon className={`h-4 w-4 ml-2 text-gray-400 ${sortConfig?.key === sortKey ? 'text-gray-900 dark:text-white' : ''}`} />
            </div>
        </th>
    );

    return (
        <>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <input type="text" name="ticker" placeholder="Filter by Ticker..." value={filters.ticker} onChange={handleFilterChange} className={inputClasses} />
                    <select name="type" value={filters.type} onChange={handleFilterChange} className={inputClasses}>
                        <option value="all">All Types</option>
                        <option value="buy">Buy</option>
                        <option value="sell">Sell</option>
                    </select>
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className={inputClasses} />
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className={inputClasses} />
                    <button onClick={resetFilters} className={btnSecondaryClasses}>Reset</button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <SortableHeader sortKey="date">Date</SortableHeader>
                            <SortableHeader sortKey="ticker">Ticker</SortableHeader>
                            <SortableHeader sortKey="type">Type</SortableHeader>
                            <SortableHeader sortKey="quantity" className="text-right">Quantity</SortableHeader>
                            <SortableHeader sortKey="pricePerUnit" className="text-right">Price/Unit</SortableHeader>
                            <SortableHeader sortKey="total" className="text-right">Total Value</SortableHeader>
                            <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedTransactions.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-4 py-2">{t.date}</td>
                                <td className="px-4 py-2 font-medium">{t.ticker}</td>
                                <td className={`px-4 py-2 capitalize font-semibold ${t.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>{t.type}</td>
                                <td className="px-4 py-2 text-right">{t.quantity.toLocaleString()}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(t.pricePerUnit)}</td>
                                <td className="px-4 py-2 text-right">{formatCurrency(t.quantity * t.pricePerUnit)}</td>
                                <td className="px-4 py-2 text-center">
                                    <button onClick={() => setItemToDelete(t)} className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400">
                                        <TrashIcon className="h-5 w-5"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {sortedTransactions.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No transactions found matching your criteria.</p>
                )}
            </div>

             <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Transaction"
                message={`Are you sure you want to delete this transaction: ${itemToDelete?.type.toUpperCase()} ${itemToDelete?.quantity} of ${itemToDelete?.ticker}? This action cannot be undone.`}
            />
        </>
    );
};

export default TransactionHistoryTable;
