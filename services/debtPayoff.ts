import moment from 'moment';
import { Liability } from '../types';

export interface DebtInput {
    id: string;
    name: string;
    balance: number;
    interestRate: number;
    monthlyPayment: number;
}

export interface DebtPayoffSummary {
    strategy: 'snowball' | 'avalanche';
    payoffDate: string;
    totalInterestPaid: number;
    monthsToPayoff: number;
}

function simulatePayoff(debts: DebtInput[], strategy: 'snowball' | 'avalanche'): DebtPayoffSummary {
    const working = debts.map(d => ({ ...d, balance: d.balance }));
    let month = 0;
    let totalInterestPaid = 0;
    const maxMonths = 600;

    while (working.some(d => d.balance > 0.01) && month < maxMonths) {
        month++;
        const monthlyRate = (rate: number) => rate / 100 / 12;

        working.forEach(d => {
            if (d.balance <= 0) return;
            const interest = d.balance * monthlyRate(d.interestRate);
            totalInterestPaid += interest;
            const payment = Math.min(d.monthlyPayment, d.balance + interest);
            const principal = Math.max(0, payment - interest);
            d.balance = Math.max(0, d.balance + interest - payment);
        });

        const extraPool = working.reduce((sum, d) => {
            if (d.balance <= 0) return sum;
            const interest = d.balance * monthlyRate(d.interestRate);
            const minDue = Math.min(d.monthlyPayment, d.balance + interest);
            return sum + Math.max(0, d.monthlyPayment - minDue);
        }, 0);

        const active = working.filter(d => d.balance > 0.01);
        if (active.length === 0) break;

        const sorted = [...active].sort((a, b) =>
            strategy === 'snowball' ? a.balance - b.balance : b.interestRate - a.interestRate
        );

        let remainingExtra = extraPool;
        for (const d of sorted) {
            if (remainingExtra <= 0) break;
            const applied = Math.min(remainingExtra, d.balance);
            d.balance -= applied;
            remainingExtra -= applied;
        }
    }

    const payoffDate = moment().add(month, 'months').format('YYYY-MM-DD');
    return { strategy, payoffDate, totalInterestPaid, monthsToPayoff: month };
}

export function compareDebtStrategies(debts: DebtInput[]): { snowball: DebtPayoffSummary; avalanche: DebtPayoffSummary } {
    return {
        snowball: simulatePayoff(debts, 'snowball'),
        avalanche: simulatePayoff(debts, 'avalanche'),
    };
}

export function deriveLiabilityPayments(
    liabilities: Liability[],
    budgetItems: { amount: number; type: string; isRecurring: boolean; recurringSettings?: { endLiabilityId?: string } }[]
): Map<string, number> {
    const payments = new Map<string, number>();
    liabilities.forEach(l => payments.set(l.id, 0));

    budgetItems.forEach(item => {
        if (item.type !== 'expense' || !item.isRecurring) return;
        const liabilityId = item.recurringSettings?.endLiabilityId;
        if (!liabilityId) return;
        payments.set(liabilityId, (payments.get(liabilityId) || 0) + item.amount);
    });

    return payments;
}

export function buildDebtInputs(
    liabilities: Liability[],
    paymentMap: Map<string, number>,
    manualPayments: Record<string, number> = {}
): DebtInput[] {
    return liabilities
        .filter(l => l.outstandingBalance > 0)
        .map(l => ({
            id: l.id,
            name: l.name,
            balance: l.outstandingBalance,
            interestRate: l.interestRate,
            monthlyPayment: manualPayments[l.id] ?? paymentMap.get(l.id) ?? Math.max(l.outstandingBalance * 0.02, 50),
        }));
}
