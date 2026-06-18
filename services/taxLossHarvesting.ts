import { RealizedGain, TaxLossHarvestSuggestion, UnrealizedGain } from '../types';
import moment from 'moment';

export function computeTaxLossSuggestions(
    unrealizedGains: UnrealizedGain[],
    realizedGains: RealizedGain[]
): TaxLossHarvestSuggestion[] {
    const yearStart = moment().startOf('year');
    const realizedYtd = realizedGains
        .filter(g => moment(g.date).isSameOrAfter(yearStart) && g.gain > 0)
        .reduce((sum, g) => sum + g.gain, 0);

    return unrealizedGains
        .filter(u => u.gain < 0)
        .map(u => ({
            ticker: u.ticker,
            unrealizedLoss: u.gain,
            potentialOffset: realizedYtd > 0 ? Math.min(Math.abs(u.gain), realizedYtd) : 0,
        }))
        .sort((a, b) => a.unrealizedLoss - b.unrealizedLoss);
}
