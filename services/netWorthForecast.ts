import moment from 'moment';
import { HistoricalNetWorth, NetWorthForecastPoint } from '../types';

export function projectNetWorth(
    currentNetWorth: number,
    monthlySavings: number,
    expectedReturnPercent: number,
    months: number
): NetWorthForecastPoint[] {
    const monthlyRate = expectedReturnPercent / 100 / 12;
    const points: NetWorthForecastPoint[] = [];
    let nw = currentNetWorth;

    for (let i = 1; i <= months; i++) {
        nw = nw * (1 + monthlyRate) + monthlySavings;
        points.push({
            date: moment().add(i, 'months').format('YYYY-MM'),
            netWorth: Math.round(nw * 100) / 100,
            isForecast: true,
        });
    }

    return points;
}

export function mergeHistoricalAndForecast(
    historical: HistoricalNetWorth[],
    forecast: NetWorthForecastPoint[]
): { date: string; actualNetWorth: number | null; forecastNetWorth: number | null }[] {
    const historicalPoints = historical.map(h => ({
        date: h.date,
        actualNetWorth: h.netWorth,
        forecastNetWorth: null as number | null,
    }));

    const lastHistorical = historicalPoints[historicalPoints.length - 1];
    const bridgePoint = lastHistorical
        ? [{ date: lastHistorical.date, actualNetWorth: null as number | null, forecastNetWorth: lastHistorical.actualNetWorth }]
        : [];

    const forecastPoints = (lastHistorical ? forecast.filter(f => f.date > lastHistorical.date) : forecast).map(f => ({
        date: f.date,
        actualNetWorth: null as number | null,
        forecastNetWorth: f.netWorth,
    }));

    return [...historicalPoints, ...bridgePoint, ...forecastPoints];
}
