import React, { useState } from 'react';
import Card from '../components/Card';
import FIRESimulator from '../components/FIRESimulator';
import HowItWorksModal from '../components/HowItWorksModal';
import { FireSettings } from '../types';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface FIREPageProps {
    netWorth: number;
    fireData: { targetAnnualSpending: number; monthlySavings: number; };
    fireSettings: FireSettings;
    setFireSettings: (value: FireSettings | ((val: FireSettings) => FireSettings)) => void;
    setTargetAnnualSpending: (value: number) => void;
    formatCurrency: (value: number) => string;
}

const FIREPage: React.FC<FIREPageProps> = ({ netWorth, fireData, fireSettings, setFireSettings, setTargetAnnualSpending, formatCurrency }) => {
    const [localSpending, setLocalSpending] = React.useState(fireData.targetAnnualSpending);
    const [isSaved, setIsSaved] = React.useState(false);
    const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

    // Basic FIRE math
    const targetFIREAmount = fireData.targetAnnualSpending / (fireSettings.swr / 100);
    const progressPercentage = targetFIREAmount > 0 ? Math.min((netWorth / targetFIREAmount) * 100, 100) : 0;
    
    // Time to FIRE estimation
    let yearsToFIRE = 0;
    if (netWorth < targetFIREAmount && fireData.monthlySavings > 0) {
        const annualSavings = fireData.monthlySavings * 12;
        yearsToFIRE = (targetFIREAmount - netWorth) / annualSavings;
    }

    const handleSaveSpending = (e: React.FormEvent) => {
        e.preventDefault();
        setTargetAnnualSpending(localSpending);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <main className="space-y-6">
             <header className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">FIRE Dashboard</h1>
                        <button 
                            onClick={() => setIsHowItWorksOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                            <InformationCircleIcon className="w-5 h-5" />
                            How it works
                        </button>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Track your journey to Financial Independence and Early Retirement.</p>
                </div>
                <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">FI Number:</span>
                    <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{formatCurrency(targetFIREAmount)}</span>
                </div>
            </header>

            <HowItWorksModal 
                isOpen={isHowItWorksOpen} 
                onClose={() => setIsHowItWorksOpen(false)} 
                section="FIRE" 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card title="Current Progress">
                    <div className="text-4xl font-bold text-green-500 tracking-tight">{progressPercentage.toFixed(1)}%</div>
                    <div className="mt-4 w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-600 to-green-400 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,197,94,0.4)]" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 text-right">{formatCurrency(netWorth)} / {formatCurrency(targetFIREAmount)}</div>
                </Card>
                <Card title="Estimated Time to FI">
                    {netWorth >= targetFIREAmount ? (
                        <div className="text-4xl font-bold text-yellow-500 tracking-tight animate-bounce">FI Reached! 🎉</div>
                    ) : fireData.monthlySavings > 0 ? (
                        <div className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">~{yearsToFIRE.toFixed(1)} Years</div>
                    ) : (
                        <div className="text-2xl font-bold text-red-500 tracking-tight">Negative Savings Rate</div>
                    )}
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Based on {formatCurrency(fireData.monthlySavings)}/mo savings</div>
                </Card>
                <Card title="FI Goals & Assumptions">
                    <form onSubmit={handleSaveSpending} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Annual Spending in Retirement</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-400">$</span>
                                <input 
                                    type="number" 
                                    value={localSpending} 
                                    onChange={(e) => setLocalSpending(Number(e.target.value))} 
                                    className="block w-full pl-7 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-[10px] text-gray-400 max-w-[150px]">Used to calculate FI number (25x rule at 4%)</p>
                            <button type="submit" className="text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg text-xs px-4 py-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                                {isSaved ? 'Saved! ✓' : 'Update Goal'}
                            </button>
                        </div>
                    </form>
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
