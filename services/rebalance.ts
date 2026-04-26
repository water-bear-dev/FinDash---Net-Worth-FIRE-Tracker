import { Investment, TargetAllocation } from '../types';

export interface RebalanceAction {
    ticker: string;
    currentValue: number;
    targetValue: number;
    currentAllocation: number;
    targetAllocation: number;
    differenceAllocation: number;
    action: 'buy' | 'sell' | 'hold';
    amountToTrade: number;
}

export function calculateRebalance(
    holdings: Investment[],
    targets: TargetAllocation[],
    newCapital: number = 0
): RebalanceAction[] {
    const totalCurrentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalTargetValue = totalCurrentValue + newCapital;

    // Create a map for quick lookup
    const holdingsMap = new Map(holdings.map(h => [h.ticker, h]));
    const targetsMap = new Map(targets.map(t => [t.ticker, t]));

    // Combine all unique tickers from both holdings and targets
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

        // Set a small threshold to avoid tiny adjustments
        const threshold = 1.0; // $1.00

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

    // Sort actions: sells first (to free up capital), then buys (largest diff first)
    actions.sort((a, b) => {
        if (a.action === 'sell' && b.action !== 'sell') return -1;
        if (a.action !== 'sell' && b.action === 'sell') return 1;
        return b.amountToTrade - a.amountToTrade;
    });

    return actions;
}
