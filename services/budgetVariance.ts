import moment, { Moment } from 'moment';
import { BudgetItem, CategoryTrendPoint, CategoryVariance, Liability, MonthlyVarianceSummary } from '../types';
import { generatePlannedEvents, generateRecurringEvents } from './eventGenerator';

function sumByCategory(events: BudgetItem[], type: 'income' | 'expense'): Map<string, number> {
    const map = new Map<string, number>();
    events.filter(e => e.type === type).forEach(e => {
        map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    return map;
}

function buildCategoryVariances(
    plannedMap: Map<string, number>,
    actualMap: Map<string, number>,
    type: 'income' | 'expense'
): CategoryVariance[] {
    const categories = new Set([...plannedMap.keys(), ...actualMap.keys()]);
    return Array.from(categories).map(category => {
        const planned = plannedMap.get(category) || 0;
        const actual = actualMap.get(category) || 0;
        const variance = actual - planned;
        const variancePercent = planned > 0 ? (variance / planned) * 100 : (actual > 0 ? 100 : 0);
        return {
            category,
            type,
            planned,
            actual,
            variance,
            variancePercent: Math.round(variancePercent * 10) / 10,
        };
    }).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
}

export function computeMonthlyVariance(
    budgetItems: BudgetItem[],
    liabilities: Liability[],
    month: Moment
): MonthlyVarianceSummary {
    const start = month.clone().startOf('month').toDate();
    const end = month.clone().endOf('month').toDate();

    const plannedEvents = generatePlannedEvents(budgetItems, liabilities, start, end);
    const actualEvents = generateRecurringEvents(budgetItems, liabilities, start, end);

    const plannedIncome = sumByCategory(plannedEvents, 'income');
    const plannedExpense = sumByCategory(plannedEvents, 'expense');
    const actualIncome = sumByCategory(actualEvents, 'income');
    const actualExpense = sumByCategory(actualEvents, 'expense');

    const incomeVariances = buildCategoryVariances(plannedIncome, actualIncome, 'income');
    const expenseVariances = buildCategoryVariances(plannedExpense, actualExpense, 'expense');

    return {
        month: month.format('YYYY-MM'),
        totalPlannedExpenses: [...plannedExpense.values()].reduce((s, v) => s + v, 0),
        totalActualExpenses: [...actualExpense.values()].reduce((s, v) => s + v, 0),
        totalPlannedIncome: [...plannedIncome.values()].reduce((s, v) => s + v, 0),
        totalActualIncome: [...actualIncome.values()].reduce((s, v) => s + v, 0),
        byCategory: [...expenseVariances, ...incomeVariances],
    };
}

export function computeCategoryTrends(
    budgetItems: BudgetItem[],
    liabilities: Liability[],
    months = 6
): CategoryTrendPoint[] {
    const points: CategoryTrendPoint[] = [];

    for (let i = months - 1; i >= 0; i--) {
        const month = moment().subtract(i, 'months');
        const start = month.clone().startOf('month').toDate();
        const end = month.clone().endOf('month').toDate();
        const events = generateRecurringEvents(budgetItems, liabilities, start, end);

        const expenseMap = sumByCategory(events, 'expense');
        expenseMap.forEach((amount, category) => {
            points.push({ month: month.format('YYYY-MM'), category, amount, type: 'expense' });
        });
    }

    return points;
}
