import { Transaction, BudgetItem } from '../types';
import moment from 'moment';

export const exportTransactionsToJSON = (transactions: Transaction[]) => {
    const jsonContent = JSON.stringify(transactions, null, 2);
    downloadJSON(jsonContent, `findash-transactions-${moment().format('YYYY-MM-DD')}.json`);
};

export const exportBudgetToJSON = (budgetItems: BudgetItem[]) => {
    const jsonContent = JSON.stringify(budgetItems, null, 2);
    downloadJSON(jsonContent, `findash-budget-${moment().format('YYYY-MM-DD')}.json`);
};

function downloadJSON(jsonContent: string, filename: string) {
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
