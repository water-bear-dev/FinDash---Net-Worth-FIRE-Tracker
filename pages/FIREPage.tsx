import React from 'react';
import Card from '../components/Card';
import FIRESimulator from '../components/FIRESimulator';
import { FireSettings } from '../types';

interface FIREPageProps {
    netWorth: number;
    fireData: { targetAnnualSpending: number; monthlySavings: number; };
    fireSettings: FireSettings;
    setFireSettings: (value: FireSettings | ((val: FireSettings) => FireSettings)) => void;
    formatCurrency: (value: number) => string;
}

const FIREPage: React.FC<FIREPageProps> = ({ netWorth, fireData, fireSettings, setFireSettings, formatCurrency }) => {
    // Basic FIRE math
    const targetFIREAmount = fireData.targetAnnualSpending / (fireSettings.swr / 100);
    const progressPercentage = targetFIREAmount > 0 ? Math.min((netWorth / targetFIREAmount) * 100, 100) : 0;
    
    // Time to FIRE estimation
    let yearsToFIRE = 0;
    if (netWorth < targetFIREAmount && fireData.monthlySavings > 0) {
        const annualSavings = fireData.monthlySavings * 12;
        // Simple linear estimation without compound interest for MVP (Phase 3 will add advanced simulation)
        yearsToFIRE = (targetFIREAmount - netWorth) / annualSavings;
    }

    return (
        <main className="space-y-6">
             <header className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">FIRE Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400">Track your journey to Financial Independence and Early Retirement.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card title="Base Target FIRE Number">
                    <div className="text-4xl font-bold text-indigo-500 tracking-tight">{formatCurrency(targetFIREAmount)}</div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Based on {formatCurrency(fireData.targetAnnualSpending)} annual spend ({fireSettings.swr}% SWR)</div>
                </Card>
                <Card title="Current Progress">
                    <div className="text-4xl font-bold text-green-500 tracking-tight">{progressPercentage.toFixed(1)}%</div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </Card>
                <Card title="Estimated Time to FI">
                    {netWorth >= targetFIREAmount ? (
                        <div className="text-4xl font-bold text-yellow-500 tracking-tight">FI Reached! 🎉</div>
                    ) : fireData.monthlySavings > 0 ? (
                        <div className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">~{yearsToFIRE.toFixed(1)} Years</div>
                    ) : (
                        <div className="text-2xl font-bold text-red-500 tracking-tight">Negative Savings Rate</div>
                    )}
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Based on {formatCurrency(fireData.monthlySavings)}/mo savings</div>
                </Card>
            </div>

            <Card title="Advanced Monte Carlo Simulator">
                <FIRESimulator 
                    netWorth={netWorth}
                    targetAnnualSpending={fireData.targetAnnualSpending}
                    monthlySavings={fireData.monthlySavings}
                    fireSettings={fireSettings}
                    setFireSettings={setFireSettings}
                    formatCurrency={formatCurrency}
                />
            </Card>
        </main>
    );
};

export default FIREPage;
