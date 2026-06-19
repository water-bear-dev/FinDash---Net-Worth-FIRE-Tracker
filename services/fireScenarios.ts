import { FireScenario, FireScenarioResult, FireSettings } from '../types';
import { runFIRESimulation } from './fireSimulation';

export function createScenarioFromBaseline(
    name: string,
    monthlySavings: number,
    targetAnnualSpending: number,
    fireSettings: FireSettings
): FireScenario {
    return {
        id: `scenario-${Date.now()}`,
        name,
        monthlySavings,
        targetAnnualSpending,
        expectedReturn: fireSettings.expectedReturn,
        swr: fireSettings.swr,
        inflationRate: fireSettings.inflationRate,
        taxRate: fireSettings.taxRate,
    };
}

export function runScenario(netWorth: number, scenario: FireScenario): FireScenarioResult {
    const settings: FireSettings = {
        swr: scenario.swr,
        inflationRate: scenario.inflationRate,
        expectedReturn: scenario.expectedReturn,
        taxRate: scenario.taxRate,
        simulationYears: 30,
    };
    const result = runFIRESimulation(netWorth, scenario.targetAnnualSpending, scenario.monthlySavings, settings);
    return {
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        ...result,
    };
}

export function compareScenarios(netWorth: number, scenarios: FireScenario[]): FireScenarioResult[] {
    return scenarios.map(s => runScenario(netWorth, s));
}

export const SCENARIO_PRESETS = [
    { label: '+$500/mo savings', deltaSavings: 500 },
    { label: '7% returns', expectedReturn: 7 },
    { label: 'Lean FIRE (-20% spending)', spendingMultiplier: 0.8 },
] as const;

export function applyPreset(
    preset: typeof SCENARIO_PRESETS[number],
    baseline: { monthlySavings: number; targetAnnualSpending: number; fireSettings: FireSettings },
    name: string
): FireScenario {
    const scenario = createScenarioFromBaseline(
        name,
        baseline.monthlySavings + ('deltaSavings' in preset ? preset.deltaSavings : 0),
        'spendingMultiplier' in preset ? baseline.targetAnnualSpending * preset.spendingMultiplier : baseline.targetAnnualSpending,
        baseline.fireSettings
    );
    if ('expectedReturn' in preset) {
        scenario.expectedReturn = preset.expectedReturn;
    }
    return scenario;
}
