import moment from 'moment';
import {
    AlertSettings,
    BudgetItem,
    CashAccount,
    FinDashAlert,
    FireSettings,
    Investment,
    Liability,
    TargetAllocation,
} from '../types';
import { generateRecurringEvents } from './eventGenerator';
import { computeMonthlyVariance } from './budgetVariance';
import { calculateRebalance } from './rebalance';

export interface AlertEngineInput {
    budgetItems: BudgetItem[];
    liabilities: Liability[];
    cashAccounts: CashAccount[];
    investments: Investment[];
    targetAllocations: TargetAllocation[];
    netWorth: number;
    targetAnnualSpending: number;
    fireSettings: FireSettings;
    emergencyFundTargetMonths: number;
    monthlyExpenses: number;
    alertSettings: AlertSettings;
    achievedMilestones: number[];
}

function alertId(type: string, relatedDate?: string): string {
    return `${type}-${relatedDate || 'global'}`;
}

export function evaluateAlerts(input: AlertEngineInput): FinDashAlert[] {
    if (!input.alertSettings.enabled) return [];

    const alerts: FinDashAlert[] = [];
    const dismissed = new Set(input.alertSettings.dismissedAlertIds || []);
    const now = moment();

    // Bill due
    const billWindow = input.alertSettings.billDueDaysBefore;
    const upcomingStart = now.clone().startOf('day').toDate();
    const upcomingEnd = now.clone().add(billWindow, 'days').endOf('day').toDate();
    const upcomingExpenses = generateRecurringEvents(
        input.budgetItems.filter(b => b.type === 'expense'),
        input.liabilities,
        upcomingStart,
        upcomingEnd
    );
    upcomingExpenses.forEach(exp => {
        const daysUntil = moment(exp.date).diff(now, 'days');
        if (daysUntil >= 0 && daysUntil <= billWindow) {
            const id = alertId('bill_due', exp.date + exp.name);
            if (!dismissed.has(id)) {
                alerts.push({
                    id,
                    type: 'bill_due',
                    message: `${exp.name} (${exp.amount.toFixed(0)}) due ${moment(exp.date).format('MMM D')}`,
                    severity: daysUntil <= 1 ? 'warning' : 'info',
                    createdAt: now.toISOString(),
                    relatedDate: exp.date,
                });
            }
        }
    });

    // Low cash
    const totalCash = input.cashAccounts.reduce((s, c) => s + c.balance, 0);
    if (totalCash < input.alertSettings.lowCashThreshold) {
        const id = alertId('low_cash');
        if (!dismissed.has(id)) {
            alerts.push({
                id,
                type: 'low_cash',
                message: `Cash balance ($${totalCash.toFixed(0)}) is below threshold ($${input.alertSettings.lowCashThreshold})`,
                severity: 'warning',
                createdAt: now.toISOString(),
            });
        }
    }

    // Rebalance drift
    if (input.investments.length > 0 && input.targetAllocations.length > 0) {
        const result = calculateRebalance(input.investments, input.targetAllocations);
        result.actions.forEach(action => {
            if (Math.abs(action.differenceAllocation) > input.alertSettings.rebalanceDriftPercent) {
                const id = alertId('rebalance_drift', action.ticker);
                if (!dismissed.has(id)) {
                    alerts.push({
                        id,
                        type: 'rebalance_drift',
                        message: `${action.ticker} is ${action.differenceAllocation.toFixed(1)}% off target allocation`,
                        severity: 'info',
                        createdAt: now.toISOString(),
                    });
                }
            }
        });
    }

    // Emergency fund met (skip when no expense baseline to avoid false positives)
    if (input.monthlyExpenses > 0) {
        const monthsCovered = totalCash / input.monthlyExpenses;
        if (monthsCovered >= input.emergencyFundTargetMonths) {
            const id = alertId('emergency_fund_met');
            if (!dismissed.has(id)) {
                alerts.push({
                    id,
                    type: 'emergency_fund_met',
                    message: `Emergency fund goal reached: ${monthsCovered.toFixed(1)} months covered`,
                    severity: 'info',
                    createdAt: now.toISOString(),
                });
            }
        }
    }

    // FIRE milestones
    const fireTarget = input.targetAnnualSpending / (input.fireSettings.swr / 100);
    const progress = fireTarget > 0 ? (input.netWorth / fireTarget) * 100 : 0;
    const milestones = [25, 50, 75, 100];
    milestones.forEach(m => {
        if (progress >= m && !input.achievedMilestones.includes(m)) {
            const id = alertId('fire_milestone', String(m));
            if (!dismissed.has(id)) {
                alerts.push({
                    id,
                    type: 'fire_milestone',
                    message: `FIRE milestone reached: ${m}% of FI number`,
                    severity: 'info',
                    createdAt: now.toISOString(),
                });
            }
        }
    });

    // Budget over
    const variance = computeMonthlyVariance(input.budgetItems, input.liabilities, now);
    variance.byCategory
        .filter(v => v.type === 'expense' && v.planned > 0)
        .forEach(v => {
            const overPercent = (v.variance / v.planned) * 100;
            if (overPercent > input.alertSettings.budgetOverPercent) {
                const id = alertId('budget_over', v.category);
                if (!dismissed.has(id)) {
                    alerts.push({
                        id,
                        type: 'budget_over',
                        message: `${v.category} is ${overPercent.toFixed(0)}% over planned this month`,
                        severity: 'warning',
                        createdAt: now.toISOString(),
                    });
                }
            }
        });

    return alerts;
}

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
    enabled: true,
    billDueDaysBefore: 3,
    lowCashThreshold: 1000,
    rebalanceDriftPercent: 5,
    budgetOverPercent: 10,
    browserNotifications: false,
    dismissedAlertIds: [],
};
