import moment from 'moment';
import { BudgetItem, Liability, SavingsRateHistoryPoint } from '../types';
import { generateRecurringEvents } from './eventGenerator';

export function computeSavingsRateHistory(
    budgetItems: BudgetItem[],
    liabilities: Liability[],
    months = 12
): SavingsRateHistoryPoint[] {
    const points: SavingsRateHistoryPoint[] = [];

    for (let i = months - 1; i >= 0; i--) {
        const month = moment().subtract(i, 'months');
        const start = month.clone().startOf('month').toDate();
        const end = month.clone().endOf('month').toDate();
        const events = generateRecurringEvents(budgetItems, liabilities, start, end);
        const totalIncome = events.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
        const totalExpenses = events.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
        const netSavings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

        points.push({
            month: month.format('YYYY-MM'),
            savingsRate: Math.round(savingsRate * 10) / 10,
            netSavings,
            totalIncome,
            totalExpenses,
        });
    }

    return points;
}
