import React, { useMemo, useState } from 'react';
import { Liability, BudgetItem } from '../types';
import Card from './Card';
import { buildDebtInputs, compareDebtStrategies, deriveLiabilityPayments } from '../services/debtPayoff';

interface DebtPayoffPlannerProps {
    liabilities: Liability[];
    budgetItems: BudgetItem[];
    formatCurrency: (value: number) => string;
}

const DebtPayoffPlanner: React.FC<DebtPayoffPlannerProps> = ({ liabilities, budgetItems, formatCurrency }) => {
    const paymentMap = useMemo(() => deriveLiabilityPayments(liabilities, budgetItems), [liabilities, budgetItems]);
    const [manualPayments, setManualPayments] = useState<Record<string, number>>({});

    const debtInputs = useMemo(
        () => buildDebtInputs(liabilities, paymentMap, manualPayments),
        [liabilities, paymentMap, manualPayments]
    );

    const comparison = useMemo(() => {
        if (debtInputs.length === 0) return null;
        return compareDebtStrategies(debtInputs);
    }, [debtInputs]);

    if (liabilities.filter(l => l.outstandingBalance > 0).length === 0) {
        return (
            <Card title="Debt Payoff Planner">
                <p className="text-sm text-gray-500 dark:text-gray-400">Add liabilities with an outstanding balance to compare snowball vs avalanche payoff strategies.</p>
            </Card>
        );
    }

    const interestSaved =
        comparison && comparison.snowball.totalInterestPaid !== comparison.avalanche.totalInterestPaid
            ? Math.abs(comparison.snowball.totalInterestPaid - comparison.avalanche.totalInterestPaid)
            : 0;
    const betterStrategy =
        comparison &&
        (comparison.avalanche.totalInterestPaid <= comparison.snowball.totalInterestPaid ? 'avalanche' : 'snowball');

    return (
        <Card title="Debt Payoff Planner">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Compare snowball (smallest balance first) vs avalanche (highest interest first). Monthly payments are inferred from linked recurring expenses when available.
            </p>

            <div className="overflow-x-auto mb-6">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="py-2">Debt</th>
                            <th className="py-2 text-right">Balance</th>
                            <th className="py-2 text-right">Rate</th>
                            <th className="py-2 text-right">Monthly Payment</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {debtInputs.map(d => (
                            <tr key={d.id}>
                                <td className="py-2">{d.name}</td>
                                <td className="py-2 text-right">{formatCurrency(d.balance)}</td>
                                <td className="py-2 text-right">{d.interestRate.toFixed(2)}%</td>
                                <td className="py-2 text-right">
                                    <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={manualPayments[d.id] ?? d.monthlyPayment}
                                        onChange={e =>
                                            setManualPayments(prev => ({
                                                ...prev,
                                                [d.id]: parseFloat(e.target.value) || 0,
                                            }))
                                        }
                                        className="w-28 p-1.5 text-right bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                                        data-testid={`debt-payment-${d.id}`}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {comparison && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="debt-payoff-comparison">
                    {(['snowball', 'avalanche'] as const).map(strategy => {
                        const result = comparison[strategy];
                        const isBetter = betterStrategy === strategy;
                        return (
                            <div
                                key={strategy}
                                className={`p-4 rounded-xl border ${isBetter ? 'border-green-400 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'}`}
                            >
                                <h4 className="font-semibold capitalize text-gray-900 dark:text-white">
                                    {strategy}
                                    {isBetter && interestSaved > 0 && (
                                        <span className="ml-2 text-xs text-green-600 dark:text-green-400">Recommended</span>
                                    )}
                                </h4>
                                <dl className="mt-3 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500">Payoff date</dt>
                                        <dd>{result.payoffDate}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500">Months</dt>
                                        <dd>{result.monthsToPayoff}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-gray-500">Total interest</dt>
                                        <dd>{formatCurrency(result.totalInterestPaid)}</dd>
                                    </div>
                                </dl>
                            </div>
                        );
                    })}
                </div>
            )}

            {comparison && interestSaved > 0 && (
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                    {betterStrategy === 'avalanche' ? 'Avalanche' : 'Snowball'} saves approximately{' '}
                    <span className="font-semibold">{formatCurrency(interestSaved)}</span> in interest.
                </p>
            )}
        </Card>
    );
};

export default DebtPayoffPlanner;
