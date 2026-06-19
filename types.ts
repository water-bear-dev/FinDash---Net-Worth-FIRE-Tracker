import { Moment } from "moment";

export enum AssetCategory {
    Stock = 'Stock',
    ETF = 'ETF',
    Crypto = 'Crypto',
    Cash = 'Cash',
    Property = 'Property'
}

export interface CashAccount {
    id: string;
    name: string;
    balance: number;
}

export interface Investment {
    id: string;
    ticker: string;
    quantity: number;
    costBasisPerUnit: number;
    currentValue: number;
    category: AssetCategory;
}

export interface Property {
    id: string;
    name: string;
    currentValue: number;
    category: AssetCategory.Property;
}

export interface Liability {
    id: string;
    name: string;
    outstandingBalance: number;
    interestRate: number;
    lastInterestAppliedDate?: string;
}

export interface Transaction {
    id:string;
    ticker: string;
    category: AssetCategory;
    type: 'buy' | 'sell';
    date: string;
    quantity: number;
    pricePerUnit: number;
}

export interface Dividend {
    id: string;
    ticker: string;
    date: string;
    amount: number;
}


export type RecurringFrequency = 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'yearly' | 'weekdays' | 'weekends' | 'custom';
export type RecurringEndCondition = 'never' | 'date' | 'occurrences' | 'liability';

export interface RecurringSettings {
    frequency: RecurringFrequency;
    endCondition: RecurringEndCondition;
    endDate?: string;
    endOccurrences?: number;
    endLiabilityId?: string;
    customInterval?: number;
    customUnit?: 'days' | 'weeks' | 'months' | 'years';
    exceptionDates?: string[];
}

export interface BudgetItem {
    id: string;
    name: string;
    category: string;
    amount: number;
    type: 'income' | 'expense';
    date: string;
    isRecurring: boolean;
    recurringSettings?: RecurringSettings;
    originalId?: string;
    description?: string;
    attachmentIds?: string[];
    importId?: string;
    importSource?: 'csv' | 'manual';
}

export interface CategoryVariance {
    category: string;
    type: 'income' | 'expense';
    planned: number;
    actual: number;
    variance: number;
    variancePercent: number;
}

export interface MonthlyVarianceSummary {
    month: string;
    totalPlannedExpenses: number;
    totalActualExpenses: number;
    totalPlannedIncome: number;
    totalActualIncome: number;
    byCategory: CategoryVariance[];
}

export interface CategoryTrendPoint {
    month: string;
    category: string;
    amount: number;
    type: 'income' | 'expense';
}

export interface ParsedCsvRow {
    date: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    suggestedCategory: string;
    selected: boolean;
    importId: string;
}

export interface FireScenario {
    id: string;
    name: string;
    monthlySavings: number;
    targetAnnualSpending: number;
    expectedReturn: number;
    swr: number;
    inflationRate: number;
    taxRate: number;
}

export interface FireScenarioResult {
    scenarioId: string;
    scenarioName: string;
    baseTarget: number;
    inflationAdjustedTarget: number;
    preTaxTarget: number;
    probabilityOfSuccess: number;
    yearsToFIRE: number;
}

export type AlertType = 'bill_due' | 'low_cash' | 'rebalance_drift' | 'emergency_fund_met' | 'fire_milestone' | 'budget_over';

export interface FinDashAlert {
    id: string;
    type: AlertType;
    message: string;
    severity: 'info' | 'warning';
    createdAt: string;
    relatedDate?: string;
}

export interface AlertSettings {
    enabled: boolean;
    billDueDaysBefore: number;
    lowCashThreshold: number;
    rebalanceDriftPercent: number;
    budgetOverPercent: number;
    browserNotifications: boolean;
    dismissedAlertIds: string[];
}

export interface BudgetAttachment {
    id: string;
    budgetItemId: string;
    name: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt: string;
    blob: Blob;
}

export interface SavingsRateHistoryPoint {
    month: string;
    savingsRate: number;
    netSavings: number;
    totalIncome: number;
    totalExpenses: number;
}

export interface NetWorthForecastPoint {
    date: string;
    netWorth: number;
    isForecast: boolean;
}

export interface DebtPayoffResult {
    strategy: 'snowball' | 'avalanche';
    payoffDate: string;
    totalInterestPaid: number;
    monthsToPayoff: number;
    schedule: { month: number; date: string; liabilityName: string; payment: number; interest: number; principal: number; remainingBalance: number }[];
}

export interface EncryptedBackupEnvelope {
    findashEncrypted: true;
    salt: string;
    iv: string;
    data: string;
}

export interface UserProfile {
    name: string;
    email: string;
}

export interface FinancialEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    resource: {
        type: 'income' | 'expense' | 'transaction' | 'dividend';
    };
}

export interface TargetAllocation {
    ticker: string;
    targetPercentage: number; // 0-100
}

export interface FireSettings {
    swr: number; // Safe Withdrawal Rate (e.g. 4.0)
    inflationRate: number; // e.g. 2.5
    expectedReturn: number; // e.g. 7.0
    taxRate: number; // e.g. 15.0
    simulationYears: number; // e.g. 30
}

export interface HistoricalNetWorth {
    date: string; // YYYY-MM
    netWorth: number;
}

export interface RebalancingSettings {
    brokerageFee: number;
    expectedReturn: number;
}

export interface TaxLot {
    id: string;
    ticker: string;
    quantity: number;
    remainingQty: number;
    costPerUnit: number;
    acquiredDate: string;
}

export interface RealizedGain {
    ticker: string;
    date: string;
    quantity: number;
    proceeds: number;
    costBasis: number;
    gain: number;
    gainPercent: number;
}

export interface UnrealizedGain {
    ticker: string;
    quantity: number;
    costBasis: number;
    marketValue: number;
    gain: number;
    gainPercent: number;
}

export interface PortfolioAnalyticsSettings {
    benchmarkTicker: string;
    performancePeriod: '1y' | 'all';
}

export interface TickerInfo {
    symbol: string;
    sector: string;
    industry: string;
    country: string;
    currency: string;
}

export interface TaxLossHarvestSuggestion {
    ticker: string;
    unrealizedLoss: number;
    potentialOffset: number;
}