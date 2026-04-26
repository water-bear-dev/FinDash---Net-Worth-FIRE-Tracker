import React, { useMemo } from 'react';
import { FireSettings } from '../types';
import { runFIRESimulation } from '../services/fireSimulation';
import { ArrowTrendingUpIcon, ShieldCheckIcon, ScaleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface FIRESimulatorProps {
    netWorth: number;
    targetAnnualSpending: number;
    monthlySavings: number;
    fireSettings: FireSettings;
    setFireSettings: (value: FireSettings | ((val: FireSettings) => FireSettings)) => void;
    formatCurrency: (value: number) => string;
}

const FIRESimulator: React.FC<FIRESimulatorProps> = ({
    netWorth,
    targetAnnualSpending,
    monthlySavings,
    fireSettings,
    setFireSettings,
    formatCurrency
}) => {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFireSettings(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0
        }));
    };

    // Run the simulation memoized to avoid excessive recalculations of Monte Carlo
    const results = useMemo(() => {
        return runFIRESimulation(netWorth, targetAnnualSpending, monthlySavings, fireSettings);
    }, [netWorth, targetAnnualSpending, monthlySavings, fireSettings]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Configuration Panel */}
                <div className="lg:col-span-1 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Simulation Parameters</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Safe Withdrawal Rate (%)
                            </label>
                            <input 
                                type="number" 
                                name="swr" 
                                value={fireSettings.swr} 
                                onChange={handleChange}
                                step="0.1"
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" 
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Standard is 4.0% (The Trinity Study)</p>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Expected Return (%)
                            </label>
                            <input 
                                type="number" 
                                name="expectedReturn" 
                                value={fireSettings.expectedReturn} 
                                onChange={handleChange}
                                step="0.1"
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" 
                            />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Inflation Rate (%)
                            </label>
                            <input 
                                type="number" 
                                name="inflationRate" 
                                value={fireSettings.inflationRate} 
                                onChange={handleChange}
                                step="0.1"
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" 
                            />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Expected Tax Rate (%)
                            </label>
                            <input 
                                type="number" 
                                name="taxRate" 
                                value={fireSettings.taxRate} 
                                onChange={handleChange}
                                step="1"
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" 
                            />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                                Simulation Years
                            </label>
                            <input 
                                type="number" 
                                name="simulationYears" 
                                value={fireSettings.simulationYears} 
                                onChange={handleChange}
                                step="1"
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" 
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Years in retirement to simulate</p>
                        </div>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                            <ScaleIcon className="w-6 h-6 text-indigo-500" />
                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Required Pre-Tax Income</h4>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(results.preTaxTarget)}</div>
                        <p className="text-sm text-gray-500 mt-2">To hit your {formatCurrency(targetAnnualSpending)} post-tax goal</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                            <ArrowTrendingUpIcon className="w-6 h-6 text-indigo-500" />
                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Inflation Adjusted Target</h4>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(results.inflationAdjustedTarget)}</div>
                        <p className="text-sm text-gray-500 mt-2">Base Target: {formatCurrency(results.baseTarget)}</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                            <ClockIcon className="w-6 h-6 text-indigo-500" />
                            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Compounded Time to FI</h4>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {results.yearsToFIRE === Infinity ? 'Never' : `${results.yearsToFIRE.toFixed(1)} Years`}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Using {(fireSettings.expectedReturn - fireSettings.inflationRate).toFixed(1)}% real return</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <ShieldCheckIcon className="w-6 h-6 text-indigo-500" />
                                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monte Carlo Success Rate</h4>
                            </div>
                            <div className={`text-4xl font-bold tracking-tight ${results.probabilityOfSuccess >= 95 ? 'text-green-500' : results.probabilityOfSuccess >= 80 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {results.probabilityOfSuccess.toFixed(1)}%
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-4">Probability your portfolio survives {fireSettings.simulationYears} years based on 1000 simulated market scenarios.</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FIRESimulator;
