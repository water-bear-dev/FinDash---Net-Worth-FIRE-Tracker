import React, { useMemo } from 'react';
import { RealizedGain, UnrealizedGain } from '../types';
import Card from './Card';
import { computeTaxLossSuggestions } from '../services/taxLossHarvesting';

interface TaxLossHarvestCardProps {
    unrealizedGains: UnrealizedGain[];
    realizedGains: RealizedGain[];
    formatCurrency: (value: number) => string;
}

const TaxLossHarvestCard: React.FC<TaxLossHarvestCardProps> = ({
    unrealizedGains,
    realizedGains,
    formatCurrency,
}) => {
    const suggestions = useMemo(
        () => computeTaxLossSuggestions(unrealizedGains, realizedGains),
        [unrealizedGains, realizedGains]
    );

    if (suggestions.length === 0) return null;

    return (
        <Card title="Tax-Loss Harvesting Opportunities">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Holdings at a loss that could offset realized gains (informational only).
            </p>
            <div className="space-y-3" data-testid="tax-loss-harvest-card">
                {suggestions.map(s => (
                    <div
                        key={s.ticker}
                        className="flex justify-between items-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30"
                        data-testid={`harvest-${s.ticker}`}
                    >
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{s.ticker}</p>
                            <p className="text-sm text-red-600 dark:text-red-400">
                                Unrealized loss: {formatCurrency(s.unrealizedLoss)}
                            </p>
                        </div>
                        {s.potentialOffset > 0 && (
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                Could offset {formatCurrency(s.potentialOffset)} of realized gains
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default TaxLossHarvestCard;
