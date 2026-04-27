import { Investment, TargetAllocation, RebalancingSettings } from '../types';

export interface RebalanceAction {
    ticker: string;
    currentValue: number;
    targetValue: number;
    currentAllocation: number;
    targetAllocation: number;
    differenceAllocation: number;
    action: 'buy' | 'sell' | 'hold';
    amountToTrade: number;
    isOptimal?: boolean;
}

export interface RebalanceResult {
    actions: RebalanceAction[];
    optimalInvestmentAmount: number;
    optimalFrequencyMonths: number;
}

/**
 * Calculates rebalancing actions and optimal investment frequency/amount.
 * Logic inspired by investcalc.github.io and the "Square Root Rule" for brokerage fees.
 */
export function calculateRebalance(
    holdings: Investment[],
    targets: TargetAllocation[],
    newCapital: number = 0,
    settings: RebalancingSettings = { brokerageFee: 9.5, expectedReturn: 7.0 },
    monthlySavings: number = 1000
): RebalanceResult {
    const totalCurrentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalTargetValue = totalCurrentValue + newCapital;

    // 1. Calculate Optimal Investment Amount
    // Formula: sqrt( (2 * brokerage * savings_per_period) / periodic_return )
    // We assume period is 1 month.
    const r = settings.expectedReturn / 100 / 12; // Monthly return as decimal
    const fee = settings.brokerageFee;
    const s = monthlySavings > 0 ? monthlySavings : 1000; // Fallback to 1000 if no savings

    const optimalAmount = Math.sqrt((2 * fee * s) / r);
    const optimalFrequency = optimalAmount / s;

    // 2. Calculate Standard Rebalancing Actions
    const holdingsMap = new Map(holdings.map(h => [h.ticker, h]));
    const targetsMap = new Map(targets.map(t => [t.ticker, t]));
    const allTickers = Array.from(new Set([...holdingsMap.keys(), ...targetsMap.keys()]));

    const actions: RebalanceAction[] = [];

    allTickers.forEach(ticker => {
        const holding = holdingsMap.get(ticker);
        const target = targetsMap.get(ticker);

        const currentValue = holding ? holding.currentValue : 0;
        const currentAllocation = totalCurrentValue > 0 ? (currentValue / totalCurrentValue) * 100 : 0;

        const targetPercentage = target ? target.targetPercentage : 0;
        const targetValue = totalTargetValue * (targetPercentage / 100);
        
        const differenceValue = targetValue - currentValue;
        const differenceAllocation = targetPercentage - currentAllocation;

        const threshold = 1.0;

        let action: 'buy' | 'sell' | 'hold' = 'hold';
        if (differenceValue > threshold) {
            action = 'buy';
        } else if (differenceValue < -threshold) {
            action = 'sell';
        }

        actions.push({
            ticker,
            currentValue,
            targetValue,
            currentAllocation,
            targetAllocation: targetPercentage,
            differenceAllocation,
            action,
            amountToTrade: Math.abs(differenceValue)
        });
    });

    // 3. Mark the "Optimal" buy action
    // According to CS Guide, we prioritize the most deficient asset.
    const buyActions = actions.filter(a => a.action === 'buy').sort((a, b) => b.amountToTrade - a.amountToTrade);
    if (buyActions.length > 0) {
        buyActions[0].isOptimal = true;
    }

    // Sort: sells first, then buys (largest first)
    actions.sort((a, b) => {
        if (a.action === 'sell' && b.action !== 'sell') return -1;
        if (a.action !== 'sell' && b.action === 'sell') return 1;
        return b.amountToTrade - a.amountToTrade;
    });

    return {
        actions,
        optimalInvestmentAmount: optimalAmount,
        optimalFrequencyMonths: optimalFrequency
    };
}
