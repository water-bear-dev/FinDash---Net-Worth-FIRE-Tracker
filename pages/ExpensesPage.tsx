import React, { useState, useMemo } from 'react';
import moment from 'moment';
import { BudgetItem, Liability } from '../types';
import Card from '../components/Card';
import BudgetItemModal from '../components/BudgetItemModal';
import { generateRecurringEvents } from '../services/eventGenerator';

interface ExpensesPageProps {
    budgetItems: BudgetItem[];
    liabilities: Liability[];
    addBudgetItem: (item: Omit<BudgetItem, 'id'>) => void;
    updateBudgetItem: (item: BudgetItem) => void;
    removeBudgetItem: (id: string) => void;
    formatCurrency: (value: number) => string;
}

const ExpensesPage: React.FC<ExpensesPageProps> = ({
    budgetItems,
    liabilities,
    addBudgetItem,
    updateBudgetItem,
    removeBudgetItem,
    formatCurrency,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

    const expenseItems = useMemo(() => 
        budgetItems.filter(item => item.type === 'expense'), 
    [budgetItems]);

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
        const itemToSave = { ...item, type: 'expense' as const };
        if ('id' in itemToSave && itemToSave.id) {
            updateBudgetItem(itemToSave);
        } else {
            addBudgetItem(itemToSave);
        }
        closeModal();
    };
    
    const totalMonthlyExpenses = useMemo(() => {
        const start = moment().startOf('month').toDate();
        const end = moment().endOf('month').toDate();
        const monthlyExpenseEvents = generateRecurringEvents(expenseItems, liabilities, start, end);
        return monthlyExpenseEvents.reduce((sum, e) => sum + e.amount, 0);
    }, [expenseItems, liabilities]);

    const sortedExpenseItems = useMemo(() => 
        [...expenseItems].sort((a, b) => a.name.localeCompare(b.name)),
    [expenseItems]);
    
    const btnPrimaryClasses = "text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
    const btnDangerClasses = "text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 transition-colors";
    const btnSecondaryClasses = "text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 transition-colors";

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expenses</h1>
                <p className="text-gray-500 dark:text-gray-400">Track your expenses, recurring or one-time.</p>
            </header>

            <Card title="Total Monthly Expenses">
                <div className="text-center">
                     <p className="text-4xl font-bold text-red-500">{formatCurrency(totalMonthlyExpenses)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Based on your recurring and one-time items for this month.</p>
                </div>
            </Card>

            <Card title="Expense Items">
                <div className="flex justify-end mb-4">
                    <button onClick={openAddModal} className={btnPrimaryClasses}>Add Expense</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Category</th>
                                <th className="px-4 py-2 text-right">Amount</th>
                                <th className="px-4 py-2">Frequency</th>
                                <th className="px-4 py-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {sortedExpenseItems.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-2 font-medium">{item.name}</td>
                                    <td className="px-4 py-2">{item.category}</td>
                                    <td className="px-4 py-2 text-right font-semibold text-red-400">{formatCurrency(item.amount)}</td>
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

            {isModalOpen && <BudgetItemModal item={editingItem} onSave={handleSave} onClose={closeModal} liabilities={liabilities} defaultType="expense" />}
        </div>
    );
};

export default ExpensesPage;