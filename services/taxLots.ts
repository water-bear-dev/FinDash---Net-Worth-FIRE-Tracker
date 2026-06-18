import moment from 'moment';
import { Investment, RealizedGain, TaxLot, Transaction, UnrealizedGain } from '../types';

interface OpenLot {
    id: string;
    ticker: string;
    remainingQty: number;
    costPerUnit: number;
    acquiredDate: string;
}

export function buildTaxLots(transactions: Transaction[]): TaxLot[] {
    const lotsByTicker = new Map<string, OpenLot[]>();
    const closedLots: TaxLot[] = [];

    const sorted = [...transactions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sorted.forEach((tx, index) => {
        if (tx.type === 'buy') {
            const lots = lotsByTicker.get(tx.ticker) || [];
            lots.push({
                id: `${tx.id}-${index}`,
                ticker: tx.ticker,
                remainingQty: tx.quantity,
                costPerUnit: tx.pricePerUnit,
                acquiredDate: tx.date,
            });
            lotsByTicker.set(tx.ticker, lots);
            return;
        }

        let qtyToSell = tx.quantity;
        const lots = lotsByTicker.get(tx.ticker) || [];

        while (qtyToSell > 0.000001 && lots.length > 0) {
            const lot = lots[0];
            const consumed = Math.min(qtyToSell, lot.remainingQty);
            closedLots.push({
                id: lot.id,
                ticker: lot.ticker,
                quantity: consumed,
                remainingQty: lot.remainingQty - consumed,
                costPerUnit: lot.costPerUnit,
                acquiredDate: lot.acquiredDate,
            });
            lot.remainingQty -= consumed;
            qtyToSell -= consumed;
            if (lot.remainingQty <= 0.000001) lots.shift();
        }

        lotsByTicker.set(tx.ticker, lots);
    });

    const openLots: TaxLot[] = [];
    lotsByTicker.forEach(lots => {
        lots.forEach(lot => {
            if (lot.remainingQty > 0.000001) {
                openLots.push({
                    id: lot.id,
                    ticker: lot.ticker,
                    quantity: lot.remainingQty,
                    remainingQty: lot.remainingQty,
                    costPerUnit: lot.costPerUnit,
                    acquiredDate: lot.acquiredDate,
                });
            }
        });
    });

    return [...openLots, ...closedLots];
}

export function computeRealizedGains(transactions: Transaction[]): RealizedGain[] {
    const gains: RealizedGain[] = [];
    const lotsByTicker = new Map<string, OpenLot[]>();

    const sorted = [...transactions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sorted.forEach((tx, index) => {
        if (tx.type === 'buy') {
            const lots = lotsByTicker.get(tx.ticker) || [];
            lots.push({
                id: `${tx.id}-${index}`,
                ticker: tx.ticker,
                remainingQty: tx.quantity,
                costPerUnit: tx.pricePerUnit,
                acquiredDate: tx.date,
            });
            lotsByTicker.set(tx.ticker, lots);
            return;
        }

        let qtyToSell = tx.quantity;
        const lots = lotsByTicker.get(tx.ticker) || [];
        let costBasis = 0;

        while (qtyToSell > 0.000001 && lots.length > 0) {
            const lot = lots[0];
            const consumed = Math.min(qtyToSell, lot.remainingQty);
            costBasis += consumed * lot.costPerUnit;
            lot.remainingQty -= consumed;
            qtyToSell -= consumed;
            if (lot.remainingQty <= 0.000001) lots.shift();
        }

        lotsByTicker.set(tx.ticker, lots);
        const proceeds = tx.quantity * tx.pricePerUnit;
        const gain = proceeds - costBasis;

        gains.push({
            ticker: tx.ticker,
            date: tx.date,
            quantity: tx.quantity,
            proceeds,
            costBasis,
            gain,
            gainPercent: costBasis > 0 ? (gain / costBasis) * 100 : 0,
        });
    });

    return gains;
}

export function computeUnrealizedGains(holdings: Investment[]): UnrealizedGain[] {
    return holdings.map(h => {
        const costBasis = h.quantity * h.costBasisPerUnit;
        const gain = h.currentValue - costBasis;
        return {
            ticker: h.ticker,
            quantity: h.quantity,
            costBasis,
            marketValue: h.currentValue,
            gain,
            gainPercent: costBasis > 0 ? (gain / costBasis) * 100 : 0,
        };
    });
}

export function getRealizedGainsYtd(realizedGains: RealizedGain[]): Map<string, number> {
    const yearStart = moment().startOf('year');
    const byTicker = new Map<string, number>();

    realizedGains.forEach(g => {
        if (moment(g.date).isSameOrAfter(yearStart)) {
            byTicker.set(g.ticker, (byTicker.get(g.ticker) || 0) + g.gain);
        }
    });

    return byTicker;
}

export function summarizeGains(
    realizedGains: RealizedGain[],
    unrealizedGains: UnrealizedGain[]
): { totalRealized: number; totalUnrealized: number; netGain: number } {
    const totalRealized = realizedGains.reduce((sum, g) => sum + g.gain, 0);
    const totalUnrealized = unrealizedGains.reduce((sum, g) => sum + g.gain, 0);
    return {
        totalRealized,
        totalUnrealized,
        netGain: totalRealized + totalUnrealized,
    };
}
