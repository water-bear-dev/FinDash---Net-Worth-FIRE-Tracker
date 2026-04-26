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

export interface UpcomingDividend {
  date: string; // exDate
  ticker: string;
  amount: number;
  recordDate: string;
  paymentDate: string;
  declarationDate: string | null;
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
// FIX: Add CompanyProfile and StockNewsItem interfaces
export interface CompanyProfile {
    symbol: string;
    price: number;
    companyName: string;
    image: string;
    description: string;
    website: string;
    mktCap: number;
    sector: string;
    industry: string;
    range: string;
    volAvg: number;
    ceo: string;
}

export interface StockNewsItem {
    url: string;
    image: string;
    title: string;
    site: string;
    publishedDate: string;
    text: string;
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