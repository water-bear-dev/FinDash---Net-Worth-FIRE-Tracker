import { FireSettings } from '../types';

export interface SimulationResult {
    baseTarget: number;
    inflationAdjustedTarget: number;
    preTaxTarget: number;
    probabilityOfSuccess: number;
    yearsToFIRE: number;
}

// Simple Box-Muller transform for normally distributed random numbers
function randomNormal(mean: number, stdDev: number): number {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * stdDev + mean;
}

export function runFIRESimulation(
    netWorth: number,
    targetAnnualSpending: number,
    monthlySavings: number,
    settings: FireSettings
): SimulationResult {
    // 1. Calculate Targets
    // Pre-tax vs Post-tax: 
    // Assuming targetAnnualSpending is what the user wants in their pocket.
    // They need to withdraw more to cover taxes.
    const preTaxAnnualSpending = targetAnnualSpending / (1 - (settings.taxRate / 100));
    
    // Base Target uses the SWR
    const swrDecimal = settings.swr / 100;
    const baseTarget = preTaxAnnualSpending / swrDecimal;

    // Years to FIRE Estimation (Simple compound interest on savings + current net worth)
    // FV = P(1+r)^t + PMT * (((1+r)^t - 1) / r)
    // We solve for t iteratively or use an approximation. 
    let yearsToFIRE = 0;
    let simulatedNetWorth = netWorth;
    const realReturn = (settings.expectedReturn - settings.inflationRate) / 100; // Real return
    const annualSavings = monthlySavings * 12;

    if (netWorth >= baseTarget) {
        yearsToFIRE = 0;
    } else if (annualSavings <= 0 && realReturn <= 0) {
        yearsToFIRE = Infinity; // Will never reach it
    } else {
        // Step year by year up to 100 years max
        for (let y = 1; y <= 100; y++) {
            simulatedNetWorth = simulatedNetWorth * (1 + realReturn) + annualSavings;
            if (simulatedNetWorth >= baseTarget) {
                // Linear interpolation for months
                const previousNW = (simulatedNetWorth - annualSavings) / (1 + realReturn);
                const gap = baseTarget - previousNW;
                const progress = gap / (simulatedNetWorth - previousNW);
                yearsToFIRE = (y - 1) + Math.max(0, Math.min(1, progress));
                break;
            }
            if (y === 100) yearsToFIRE = Infinity;
        }
    }

    // Inflation Adjusted Target (Future Value of the Base Target when they FIRE)
    let inflationAdjustedTarget = baseTarget;
    if (yearsToFIRE > 0 && yearsToFIRE !== Infinity) {
        inflationAdjustedTarget = baseTarget * Math.pow(1 + (settings.inflationRate / 100), yearsToFIRE);
    }

    // 2. Monte Carlo Simulation for Probability of Success
    // We simulate withdrawal phase for `simulationYears`
    const numSimulations = 1000;
    let successes = 0;
    const stdDev = 0.15; // 15% standard deviation for stock market

    // If they haven't reached FI yet, we simulate assuming they start with the Base Target
    // If they already have more than Base Target, we simulate with their actual Net Worth
    const startingCapital = Math.max(baseTarget, netWorth);

    for (let i = 0; i < numSimulations; i++) {
        let capital = startingCapital;
        let isSuccessful = true;
        let currentSpending = preTaxAnnualSpending; // Starts at current required pre-tax spending

        for (let year = 1; year <= settings.simulationYears; year++) {
            // Apply market return
            const marketReturn = randomNormal(settings.expectedReturn / 100, stdDev);
            capital = capital * (1 + marketReturn);

            // Subtract spending (assuming start of year or end of year, let's do end of year)
            capital -= currentSpending;

            if (capital <= 0) {
                isSuccessful = false;
                break;
            }

            // Adjust spending for next year due to inflation
            const inflation = randomNormal(settings.inflationRate / 100, 0.03); // 3% std dev for inflation
            currentSpending = currentSpending * (1 + inflation);
        }

        if (isSuccessful) {
            successes++;
        }
    }

    const probabilityOfSuccess = (successes / numSimulations) * 100;

    return {
        baseTarget,
        inflationAdjustedTarget,
        preTaxTarget: preTaxAnnualSpending,
        probabilityOfSuccess,
        yearsToFIRE
    };
}
