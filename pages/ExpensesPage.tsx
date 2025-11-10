import React, { useState, useMemo } from 'react';
import moment from 'moment';
import { BudgetItem, Liability } from '../types';
import Card from '../components/Card';
import BudgetItemModal from '../components/BudgetItemModal';
import { generateRecurringEvents } from '../services/eventGenerator';
import ConfirmationModal from '../components/ConfirmationModal';
import AllocationDonutChart from '../components/AllocationDonutChart';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

interface ExpensesPageProps {
    budgetItems: BudgetItem[];
    liabilities: Liability[];
    addBudgetItem: (item: Omit<BudgetItem, 'id'>) => void;
    updateBudgetItem: (item: BudgetItem, scope?: 'one' | 'future', occurrenceDate?: string) => void;
    removeBudgetItem: (item: BudgetItem, scope?: 'one' | 'future', occurrenceDate?: string) => void;
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
    const [currentMonth, setCurrentMonth] = useState(moment());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<(BudgetItem & { occurrenceDate?: string }) | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ item: BudgetItem; occurrenceDate: string; isRecurring: boolean; } | null>(null);

    const monthlyExpenseEvents = useMemo(() => {
        const start = currentMonth.clone().startOf('month').toDate();
        const end = currentMonth.clone().endOf('month').toDate();
        const expenseTemplates = budgetItems.filter(item => item.type === 'expense');
        return generateRecurringEvents(expenseTemplates, liabilities, start, end).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [currentMonth, budgetItems, liabilities]);

    const totalMonthlyExpenses = useMemo(() => 
        monthlyExpenseEvents.reduce((sum, e) => sum + e.amount, 0),
    [monthlyExpenseEvents]);

    const categoryChartData = useMemo(() => {
        const categoryMap = new Map<string, number>();
        monthlyExpenseEvents.forEach(event => {
            const currentAmount = categoryMap.get(event.category) || 0;
            categoryMap.set(event.category, currentAmount + event.amount);
        });
        return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
    }, [monthlyExpenseEvents]);

    const openAddModal = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const openEditModal = (item: BudgetItem) => {
        // item is the occurrence, with the specific date
        const originalItem = budgetItems.find(i => i.id === (item.originalId || item.id));
        if (originalItem) {
            setEditingItem({ ...originalItem, occurrenceDate: item.date });
            setIsModalOpen(true);
        }
    };
    
    const handleDeleteClick = (item: BudgetItem) => {
        const originalItem = budgetItems.find(i => i.id === (item.originalId || item.id));
        if (originalItem) {
             setItemToDelete({ item: originalItem, occurrenceDate: item.date, isRecurring: originalItem.isRecurring });
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleSave = (item: Omit<BudgetItem, 'id'> | BudgetItem, scope?: 'one' | 'future', occurrenceDate?: string) => {
        const itemToSave = { ...item, type: 'expense' as const };
        if ('id' in itemToSave && itemToSave.id) {
            updateBudgetItem(itemToSave, scope, occurrenceDate);
        } else {
            addBudgetItem(itemToSave);
        }
        closeModal();
    };

    const handleConfirmDelete = (scope?: 'one' | 'future') => {
        if (itemToDelete) {
            removeBudgetItem(itemToDelete.item, scope, itemToDelete.occurrenceDate);
            setItemToDelete(null);
        }
    };
    
    const handlePrevMonth = () => setCurrentMonth(m => m.clone().subtract(1, 'month'));
    const handleNextMonth = () => setCurrentMonth(m => m.clone().add(1, 'month'));
    const handleThisMonth = () => setCurrentMonth(moment());

    const btnPrimaryClasses = "text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
    const btnDangerClasses = "text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 transition-colors";
    const btnSecondaryClasses = "text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 transition-colors";

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Expenses</h1>
                <p className="text-gray-500 dark:text-gray-400">Track your expenses, recurring or one-time.</p>
            </header>

            <Card title="Monthly Summary">
                <div className="flex items-center justify-center gap-4 mb-6">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeftIcon className="h-5 w-5"/></button>
                    <h3 className="text-xl font-semibold text-center whitespace-nowrap w-40">{currentMonth.format('MMMM YYYY')}</h3>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronRightIcon className="h-5 w-5"/></button>
                    <button onClick={handleThisMonth} className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">This Month</button>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center md:text-left">
                         <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses for {currentMonth.format('MMMM')}</p>
                         <p className="text-4xl font-bold text-red-500">{formatCurrency(totalMonthlyExpenses)}</p>
                    </div>
                    <div>
                        <h4 className="text-center font-semibold mb-2">By Category</h4>
                        {categoryChartData.length > 0 ? (
                           <AllocationDonutChart data={categoryChartData} height={180} formatCurrency={formatCurrency} />
                        ) : (
                           <p className="text-center text-sm text-gray-500 dark:text-gray-400 h-[180px] flex items-center justify-center">No expenses this month.</p>
                        )}
                    </div>
                </div>
            </Card>

            <Card title={`Expenses for ${currentMonth.format('MMMM YYYY')}`}>
                <div className="flex justify-end mb-4">
                    <button onClick={openAddModal} className={btnPrimaryClasses}>Add New Expense Source</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Category</th>
                                <th className="px-4 py-2 text-right">Amount</th>
                                <th className="px-4 py-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {monthlyExpenseEvents.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-2">{moment(item.date).format('MMM D')}</td>
                                    <td className="px-4 py-2 font-medium">{item.name}</td>
                                    <td className="px-4 py-2">{item.category}</td>
                                    <td className="px-4 py-2 text-right font-semibold text-red-400">{formatCurrency(item.amount)}</td>
                                    <td className="px-4 py-2 text-center">
                                        <div className="flex justify-center items-center space-x-2">
                                            <button onClick={() => openEditModal(item)} className={`${btnSecondaryClasses} w-auto text-xs py-1 px-2`}>Edit</button>
                                            <button onClick={() => handleDeleteClick(item)} className={`${btnDangerClasses} w-auto text-xs py-1 px-2`}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {monthlyExpenseEvents.length === 0 && (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">No expenses recorded for this month.</p>
                    )}
                </div>
            </Card>

            {isModalOpen && <BudgetItemModal item={editingItem} onSave={handleSave} onClose={closeModal} liabilities={liabilities} occurrenceDate={editingItem?.occurrenceDate} defaultType="expense" />}

            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Expense"
                message={itemToDelete?.isRecurring ? `You are deleting an occurrence of a recurring expense.` : `Are you sure you want to delete "${itemToDelete?.item.name}"?`}
                showScopeOptions={itemToDelete?.isRecurring}
                occurrenceDate={itemToDelete?.occurrenceDate}
            />
        </div>
    );
};

export default ExpensesPage;