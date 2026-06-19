import React, { useMemo, useState } from 'react';
import { FireScenario, FireSettings } from '../types';
import { applyPreset, compareScenarios, createScenarioFromBaseline, SCENARIO_PRESETS } from '../services/fireScenarios';

interface FireScenarioSandboxProps {
    netWorth: number;
    monthlySavings: number;
    targetAnnualSpending: number;
    fireSettings: FireSettings;
    savedScenarios: FireScenario[];
    onSaveScenarios: (scenarios: FireScenario[]) => void;
    formatCurrency: (value: number) => string;
}

const FireScenarioSandbox: React.FC<FireScenarioSandboxProps> = ({
    netWorth,
    monthlySavings,
    targetAnnualSpending,
    fireSettings,
    savedScenarios,
    onSaveScenarios,
    formatCurrency,
}) => {
    const baseline = useMemo(
        () => createScenarioFromBaseline('Baseline', monthlySavings, targetAnnualSpending, fireSettings),
        [monthlySavings, targetAnnualSpending, fireSettings]
    );

    const [scenarioA, setScenarioA] = useState<FireScenario | null>(null);
    const [scenarioB, setScenarioB] = useState<FireScenario | null>(null);

    const results = useMemo(() => {
        const scenarios = [baseline, ...(scenarioA ? [scenarioA] : []), ...(scenarioB ? [scenarioB] : [])];
        return compareScenarios(netWorth, scenarios);
    }, [netWorth, baseline, scenarioA, scenarioB]);

    const addPreset = (preset: typeof SCENARIO_PRESETS[number]) => {
        const name = preset.label;
        const scenario = applyPreset(preset, { monthlySavings, targetAnnualSpending, fireSettings }, name);
        if (!scenarioA) setScenarioA(scenario);
        else if (!scenarioB) setScenarioB(scenario);
    };

    const saveCurrent = () => {
        const toSave = [scenarioA, scenarioB].filter((s): s is FireScenario => s !== null);
        if (toSave.length === 0) return;
        const merged = [...savedScenarios, ...toSave].slice(-5);
        onSaveScenarios(merged);
    };

    const updateScenario = (
        setter: React.Dispatch<React.SetStateAction<FireScenario | null>>,
        field: keyof FireScenario,
        value: number
    ) => {
        setter(prev => prev ? { ...prev, [field]: value } : prev);
    };

    return (
        <div className="space-y-6" data-testid="scenario-sandbox">
            <div className="flex flex-wrap gap-2">
                {SCENARIO_PRESETS.map(preset => (
                    <button
                        key={preset.label}
                        onClick={() => addPreset(preset)}
                        className="px-3 py-1.5 text-xs font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200"
                    >
                        {preset.label}
                    </button>
                ))}
                <button onClick={saveCurrent} className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    Save scenarios
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[scenarioA, scenarioB].map((scenario, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <h4 className="font-semibold mb-3">Scenario {idx + 1}</h4>
                        {scenario ? (
                            <div className="space-y-3 text-sm">
                                <div>
                                    <label className="text-xs text-gray-500">Monthly Savings</label>
                                    <input type="number" value={scenario.monthlySavings} onChange={e => updateScenario(idx === 0 ? setScenarioA : setScenarioB, 'monthlySavings', parseFloat(e.target.value) || 0)} className="w-full mt-1 p-2 rounded border dark:bg-gray-700 dark:border-gray-600" data-testid={`scenario-${idx}-savings`} />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Expected Return (%)</label>
                                    <input type="number" value={scenario.expectedReturn} onChange={e => updateScenario(idx === 0 ? setScenarioA : setScenarioB, 'expectedReturn', parseFloat(e.target.value) || 0)} className="w-full mt-1 p-2 rounded border dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Annual Spending</label>
                                    <input type="number" value={scenario.targetAnnualSpending} onChange={e => updateScenario(idx === 0 ? setScenarioA : setScenarioB, 'targetAnnualSpending', parseFloat(e.target.value) || 0)} className="w-full mt-1 p-2 rounded border dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <button onClick={() => idx === 0 ? setScenarioA(null) : setScenarioB(null)} className="text-xs text-red-500">Clear</button>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">Click a preset above to add a comparison scenario.</p>
                        )}
                    </div>
                ))}
                <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
                    <h4 className="font-semibold mb-3 text-indigo-700 dark:text-indigo-300">Baseline (live)</h4>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p>Savings: {formatCurrency(monthlySavings)}/mo</p>
                        <p>Spending: {formatCurrency(targetAnnualSpending)}/yr</p>
                        <p>Return: {fireSettings.expectedReturn}%</p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto" data-testid="scenario-compare-table">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase text-gray-500 bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-2">Scenario</th>
                            <th className="px-4 py-2 text-right">Years to FIRE</th>
                            <th className="px-4 py-2 text-right">FI Target</th>
                            <th className="px-4 py-2 text-right">Success %</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {results.map(r => (
                            <tr key={r.scenarioId} data-testid={`scenario-result-${r.scenarioName}`}>
                                <td className="px-4 py-2 font-medium">{r.scenarioName}</td>
                                <td className="px-4 py-2 text-right" data-testid={`years-${r.scenarioName}`}>
                                    {r.yearsToFIRE === Infinity ? '∞' : r.yearsToFIRE.toFixed(1)}
                                </td>
                                <td className="px-4 py-2 text-right">{formatCurrency(r.baseTarget)}</td>
                                <td className="px-4 py-2 text-right">{r.probabilityOfSuccess.toFixed(0)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {savedScenarios.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold mb-2">Saved Scenarios</h4>
                    <div className="flex flex-wrap gap-2">
                        {savedScenarios.map(s => (
                            <button
                                key={s.id}
                                onClick={() => !scenarioA ? setScenarioA(s) : setScenarioB(s)}
                                className="px-3 py-1 text-xs rounded-lg bg-gray-200 dark:bg-gray-700"
                            >
                                Load: {s.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FireScenarioSandbox;
