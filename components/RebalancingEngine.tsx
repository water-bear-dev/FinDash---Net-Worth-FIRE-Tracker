import React, { useState, useMemo } from 'react';
import { Investment, TargetAllocation } from '../types';
import { calculateRebalance } from '../services/rebalance';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import AllocationDonutChart from './AllocationDonutChart';

interface RebalancingEngineProps {
    holdings: Investment[];
    targetAllocations: TargetAllocation[];
    setTargetAllocations: (value: TargetAllocation[] | ((val: TargetAllocation[]) => TargetAllocation[])) => void;
    formatCurrency: (value: number) => string;
}

const RebalancingEngine: React.FC<RebalancingEngineProps> = ({ holdings, targetAllocations, setTargetAllocations, formatCurrency }) => {
    const [newCapitalStr, setNewCapitalStr] = useState<string>('0');
    const [newTicker, setNewTicker] = useState('');
    const [newPercentage, setNewPercentage] = useState('');

    const newCapital = parseFloat(newCapitalStr) || 0;

    const rebalanceActions = useMemo(() => {
        return calculateRebalance(holdings, targetAllocations, newCapital);
    }, [holdings, targetAllocations, newCapital]);

    const totalTargetPercentage = targetAllocations.reduce((sum, t) => sum + t.targetPercentage, 0);

    const handleAddTarget = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTicker || !newPercentage) return;
        const targetValue = parseFloat(newPercentage);
        if (isNaN(targetValue) || targetValue <= 0) return;

        setTargetAllocations(prev => {
            // Update if exists, else add
            const existing = prev.find(t => t.ticker.toUpperCase() === newTicker.toUpperCase());
            if (existing) {
                return prev.map(t => t.ticker.toUpperCase() === newTicker.toUpperCase() ? { ...t, targetPercentage: targetValue } : t);
            }
            return [...prev, { ticker: newTicker.toUpperCase(), targetPercentage: targetValue }];
        });
        setNewTicker('');
        setNewPercentage('');
    };

    const handleRemoveTarget = (ticker: string) => {
        setTargetAllocations(prev => prev.filter(t => t.ticker !== ticker));
    };

    const currentData = useMemo(() => {
        return rebalanceActions
            .filter(r => r.currentValue > 0)
            .map(r => ({ name: r.ticker, value: r.currentValue }));
    }, [rebalanceActions]);

    const targetData = useMemo(() => {
        return targetAllocations.map(t => ({ name: t.ticker, value: t.targetPercentage }));
    }, [targetAllocations]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Charts */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col justify-center items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white w-full mb-2">Current Allocation</h3>
                    <AllocationDonutChart data={currentData} height={200} />
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col justify-center items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white w-full mb-2">Target Allocation</h3>
                    <AllocationDonutChart data={targetData} height={200} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Target Allocations Configuration */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Target Allocations</h3>
                    
                    <form onSubmit={handleAddTarget} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            placeholder="Ticker (e.g. VOO)"
                            value={newTicker}
                            onChange={(e) => setNewTicker(e.target.value)}
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                            required
                        />
                        <input
                            type="number"
                            placeholder="Target %"
                            value={newPercentage}
                            onChange={(e) => setNewPercentage(e.target.value)}
                            step="0.1"
                            min="0"
                            max="100"
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-24 p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                            required
                        />
                        <button type="submit" className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm p-2 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800">
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="flex justify-between items-center mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>Total Target Allocation:</span>
                        <span className={`font-bold ${totalTargetPercentage > 100 ? 'text-red-500' : totalTargetPercentage === 100 ? 'text-green-500' : ''}`}>
                            {totalTargetPercentage.toFixed(1)}%
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-2">Ticker</th>
                                    <th className="px-4 py-2 text-right">Target %</th>
                                    <th className="px-4 py-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {targetAllocations.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-2 text-center text-gray-500">No targets set.</td>
                                    </tr>
                                ) : (
                                    targetAllocations.map((t) => (
                                        <tr key={t.ticker} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                            <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{t.ticker}</td>
                                            <td className="px-4 py-2 text-right">{t.targetPercentage.toFixed(1)}%</td>
                                            <td className="px-4 py-2 text-center">
                                                <button onClick={() => handleRemoveTarget(t.ticker)} className="text-red-600 dark:text-red-500 hover:text-red-800">
                                                    <TrashIcon className="w-4 h-4 mx-auto" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Rebalancing Actions */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recommended Actions</h3>
                    
                    <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">New Capital to Deploy</label>
                        <input
                            type="number"
                            value={newCapitalStr}
                            onChange={(e) => setNewCapitalStr(e.target.value)}
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                            placeholder="Amount in dollars"
                        />
                    </div>

                    <div className="overflow-x-auto flex-grow">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-3 py-2">Asset</th>
                                    <th className="px-3 py-2">Action</th>
                                    <th className="px-3 py-2 text-right">Amount</th>
                                    <th className="px-3 py-2 text-right">Current → Target</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rebalanceActions.filter(a => a.action !== 'hold').length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                                            {targetAllocations.length === 0 ? "Set target allocations to see recommendations." : "Portfolio is perfectly balanced!"}
                                        </td>
                                    </tr>
                                ) : (
                                    rebalanceActions.map((action) => (
                                        action.action !== 'hold' && (
                                            <tr key={action.ticker} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                                <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{action.ticker}</td>
                                                <td className="px-3 py-2">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                        action.action === 'buy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                                    }`}>
                                                        {action.action.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right font-medium">{formatCurrency(action.amountToTrade)}</td>
                                                <td className="px-3 py-2 text-right text-xs">
                                                    {action.currentAllocation.toFixed(1)}% &rarr; {action.targetAllocation.toFixed(1)}%
                                                </td>
                                            </tr>
                                        )
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RebalancingEngine;
