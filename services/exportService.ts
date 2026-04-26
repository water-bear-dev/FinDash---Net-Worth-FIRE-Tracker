import { Transaction, BudgetItem } from '../types';
import moment from 'moment';

export const exportTransactionsToCSV = (transactions: Transaction[]) => {
    const headers = ['Date', 'Type', 'Amount', 'Category', 'Description'];
    const rows = transactions.map(t => [
        t.date,
        t.type,
        t.amount.toString(),
        t.category,
        `"${(t.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(e => e.join(','))
    ].join('\n');

    downloadCSV(csvContent, `findash-transactions-${moment().format('YYYY-MM-DD')}.csv`);
};

export const exportBudgetToCSV = (budgetItems: BudgetItem[]) => {
    const headers = ['Name', 'Amount', 'Type', 'Frequency', 'Category', 'Next Due Date'];
    const rows = budgetItems.map(b => [
        `"${b.name.replace(/"/g, '""')}"`,
        b.amount.toString(),
        b.type,
        b.frequency,
        b.category,
        b.nextDueDate || ''
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(e => e.join(','))
    ].join('\n');

    downloadCSV(csvContent, `findash-budget-${moment().format('YYYY-MM-DD')}.csv`);
};

function downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
