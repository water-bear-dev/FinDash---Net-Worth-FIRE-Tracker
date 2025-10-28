

import React, { useState, useMemo } from 'react';
import moment from 'moment';
import { BudgetItem, Liability } from '../types';
import Card from '../components/Card';
import BudgetItemModal from '../components/BudgetItemModal';
import { generateRecurringEvents } from '../services/eventGenerator';

interface BudgetPageProps {
    budgetItems: BudgetItem[];
    liabilities: Liability[];
    addBudgetItem: (item: Omit<BudgetItem, 'id'>) => void;
    updateBudgetItem: (item: BudgetItem) => void;
    removeBudgetItem: (id: string) => void;
    formatCurrency: (value: number) => string;
}

const BudgetPage: React.FC<BudgetPageProps> = ({
    budgetItems,
    liabilities,
    addBudgetItem,
    updateBudgetItem,
    removeBudgetItem,
    formatCurrency,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

    const openAddModal = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const openEditModal = (item: BudgetItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleSave = (item: Omit<BudgetItem, 'id'> | BudgetItem) => {
        if ('id' in item) {
            updateBudgetItem(item);
        } else {
            addBudgetItem(item);
        }
        closeModal();
    };

    const monthlyEvents = useMemo(() => {
        const start = moment().startOf('month').toDate();
        const end = moment().endOf('month').toDate();
        return generateRecurringEvents(budgetItems, liabilities, start, end);
    }, [budgetItems, liabilities]);

    const summary = useMemo(() => {
        const income = monthlyEvents.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
        const expense = monthlyEvents.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
        const net = income - expense;
        return { income, expense, net };
    }, [monthlyEvents]);

    const sortedBudgetItems = [...budgetItems].sort((a, b) => a.name.localeCompare(b.name));
    
    const btnPrimaryClasses = "text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
    const btnDangerClasses = "text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 transition-colors";
    const btnSecondaryClasses = "text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 transition-colors";

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Budget</h1>
                <p className="text-gray-500 dark:text-gray-400">Track your income and expenses, recurring or one-time.</p>
            </header>

            <Card title="This Month's Summary">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p>
                        <p className="text-2xl font-semibold text-green-500">{formatCurrency(summary.income)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
                        <p className="text-2xl font-semibold text-red-500">{formatCurrency(summary.expense)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Net Savings</p>
                        <p className={`text-2xl font-semibold ${summary.net >= 0 ? 'text-indigo-500' : 'text-orange-500'}`}>{formatCurrency(summary.net)}</p>
                    </div>
                </div>
            </Card>

            <Card title="Budget Items">
                <div className="flex justify-end mb-4">
                    <button onClick={openAddModal} className={btnPrimaryClasses}>Add Budget Item</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Category</th>
                                <th className="px-4 py-2 text-right">Amount</th>
                                <th className="px-4 py-2">Type</th>
                                <th className="px-4 py-2">Frequency</th>
                                <th className="px-4 py-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {sortedBudgetItems.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-2 font-medium">{item.name}</td>
                                    <td className="px-4 py-2">{item.category}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(item.amount)}</td>
                                    <td className={`px-4 py-2 capitalize font-semibold ${item.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{item.type}</td>
                                    <td className="px-4 py-2 capitalize">{item.isRecurring ? item.recurringSettings?.frequency : 'One-time'}</td>
                                    <td className="px-4 py-2 text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <button onClick={() => openEditModal(item)} className={`${btnSecondaryClasses} w-auto text-xs py-1 px-2`}>Edit</button>
                                            <button onClick={() => removeBudgetItem(item.id)} className={`${btnDangerClasses} w-auto text-xs py-1 px-2`}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {isModalOpen && <BudgetItemModal item={editingItem} onSave={handleSave} onClose={closeModal} liabilities={liabilities} />}
        </div>
    );
};

export default BudgetPage;