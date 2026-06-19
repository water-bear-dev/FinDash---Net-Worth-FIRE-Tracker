import {
    AssetCategory,
    BudgetItem,
    CashAccount,
    Dividend,
    FireSettings,
    HistoricalNetWorth,
    Liability,
    Property,
    TargetAllocation,
    Transaction,
    UserProfile,
} from '../types';

export interface MockProfile {
    userProfile: UserProfile;
    cashAccounts: CashAccount[];
    properties: Property[];
    liabilities: Liability[];
    transactions: Transaction[];
    dividends: Dividend[];
    budgetItems: BudgetItem[];
    targetAnnualSpending: number;
    currency: string;
    targetAllocations: TargetAllocation[];
    historicalNetWorth: HistoricalNetWorth[];
    fireSettings: FireSettings;
    emergencyFundTargetMonths: number;
}

export function getMockProfile(): MockProfile {
    return {
        userProfile: { name: 'Alex Doe', email: 'alex.demo@example.com' },
        cashAccounts: [
            { id: 'c1', name: 'Main Checking Account', balance: 25480.5 },
            { id: 'c2', name: 'High-Yield Savings', balance: 50210.11 },
        ],
        properties: [
            { id: 'p1', name: 'Primary Residence', currentValue: 850000, category: AssetCategory.Property },
        ],
        liabilities: [
            { id: 'l1', name: 'Mortgage', outstandingBalance: 425000, interestRate: 3.25 },
            { id: 'l2', name: 'Car Loan', outstandingBalance: 15200, interestRate: 5.1 },
        ],
        transactions: [
            { id: 't1', ticker: 'VOO', category: AssetCategory.ETF, type: 'buy', date: '2022-05-10', quantity: 20, pricePerUnit: 380.5 },
            { id: 't2', ticker: 'AAPL', category: AssetCategory.Stock, type: 'buy', date: '2022-06-15', quantity: 50, pricePerUnit: 140.2 },
            { id: 't3', ticker: 'MSFT', category: AssetCategory.Stock, type: 'buy', date: '2023-01-20', quantity: 30, pricePerUnit: 240 },
            { id: 't4', ticker: 'VOO', category: AssetCategory.ETF, type: 'buy', date: '2023-03-12', quantity: 15, pricePerUnit: 360.75 },
            { id: 't5', ticker: 'NVDA', category: AssetCategory.Stock, type: 'buy', date: '2023-09-01', quantity: 10, pricePerUnit: 485 },
            { id: 't6', ticker: 'AAPL', category: AssetCategory.Stock, type: 'sell', date: '2024-02-28', quantity: 10, pricePerUnit: 180 },
            { id: 't7', ticker: 'ETH-USD', category: AssetCategory.Crypto, type: 'buy', date: '2023-11-15', quantity: 2, pricePerUnit: 2000 },
        ],
        dividends: [
            { id: 'd1', ticker: 'VOO', date: '2024-03-20', amount: 55.3 },
            { id: 'd2', ticker: 'AAPL', date: '2024-05-15', amount: 9.6 },
            { id: 'd3', ticker: 'MSFT', date: '2024-05-20', amount: 21.6 },
        ],
        budgetItems: [
            {
                id: 'b1', name: 'Monthly Salary', category: 'Salary', amount: 7500, type: 'income',
                date: '2024-01-05', isRecurring: true,
                recurringSettings: { frequency: 'monthly', endCondition: 'never' },
            },
            {
                id: 'b2', name: 'Consulting Gig', category: 'Side Job', amount: 1200, type: 'income',
                date: '2024-05-15', isRecurring: false,
            },
            {
                id: 'b3', name: 'Mortgage Payment', category: 'Rent/Mortgage', amount: 2200, type: 'expense',
                date: '2024-01-01', isRecurring: true,
                recurringSettings: { frequency: 'monthly', endCondition: 'liability', endLiabilityId: 'l1' },
            },
            {
                id: 'b4', name: 'Car Payment', category: 'Car Payment/Lease', amount: 450, type: 'expense',
                date: '2024-01-15', isRecurring: true,
                recurringSettings: { frequency: 'monthly', endCondition: 'liability', endLiabilityId: 'l2' },
            },
            {
                id: 'b5', name: 'Groceries', category: 'Groceries & Food Staples', amount: 800, type: 'expense',
                date: '2024-01-07', isRecurring: true,
                recurringSettings: { frequency: 'monthly', endCondition: 'never' },
            },
            {
                id: 'b6', name: 'Utilities', category: 'Electricity, Gas, Water', amount: 250, type: 'expense',
                date: '2024-01-10', isRecurring: true,
                recurringSettings: { frequency: 'monthly', endCondition: 'never' },
            },
            {
                id: 'b7', name: 'Internet', category: 'Internet, Phone, Cable', amount: 80, type: 'expense',
                date: '2024-01-18', isRecurring: true,
                recurringSettings: { frequency: 'monthly', endCondition: 'never' },
            },
            {
                id: 'b8', name: 'Investment Contribution', category: 'Investment Contributions (Non-Retirement)',
                amount: 1500, type: 'expense', date: '2024-01-05', isRecurring: true,
                recurringSettings: { frequency: 'monthly', endCondition: 'never' },
            },
        ],
        targetAnnualSpending: 72000,
        currency: 'USD',
        targetAllocations: [
            { ticker: 'VOO', targetPercentage: 50 },
            { ticker: 'AAPL', targetPercentage: 25 },
            { ticker: 'MSFT', targetPercentage: 15 },
            { ticker: 'NVDA', targetPercentage: 10 },
        ],
        historicalNetWorth: [
            { date: '2024-01', netWorth: 380000 },
            { date: '2024-04', netWorth: 395000 },
            { date: '2024-07', netWorth: 410000 },
            { date: '2024-10', netWorth: 428000 },
            { date: '2025-01', netWorth: 445000 },
            { date: '2025-04', netWorth: 462000 },
            { date: '2025-07', netWorth: 478000 },
            { date: '2025-10', netWorth: 495000 },
            { date: '2026-01', netWorth: 512000 },
            { date: '2026-04', netWorth: 528000 },
        ],
        fireSettings: {
            swr: 4.0,
            inflationRate: 2.5,
            expectedReturn: 7.0,
            taxRate: 15.0,
            simulationYears: 30,
        },
        emergencyFundTargetMonths: 6,
    };
}

export function applyMockProfileToStorage(): void {
    const mock = getMockProfile();
    const entries: Record<string, unknown> = {
        userProfile: mock.userProfile,
        cashAccounts: mock.cashAccounts,
        properties: mock.properties,
        liabilities: mock.liabilities,
        transactions: mock.transactions,
        dividends: mock.dividends,
        budgetItems: mock.budgetItems,
        targetAnnualSpending: mock.targetAnnualSpending,
        currency: mock.currency,
        targetAllocations: mock.targetAllocations,
        historicalNetWorth: mock.historicalNetWorth,
        fireSettings: mock.fireSettings,
        emergencyFundTargetMonths: mock.emergencyFundTargetMonths,
        useLocalPriceServer: true,
        isChatbotEnabled: false,
        geminiApiKey: '',
        theme: 'dark',
        rebalancingSettings: { brokerageFee: 9.5, expectedReturn: 7.0 },
        dripSettings: { VOO: true },
        portfolioAnalyticsSettings: { benchmarkTicker: 'VOO', performancePeriod: '1y' },
        fireScenarios: [],
        alertSettings: {
            enabled: true,
            billDueDaysBefore: 3,
            lowCashThreshold: 1000,
            rebalanceDriftPercent: 5,
            budgetOverPercent: 10,
            browserNotifications: false,
            dismissedAlertIds: [],
        },
        achievedMilestones: [25],
        isDemoMode: true,
        isSetupComplete: true,
    };

    Object.entries(entries).forEach(([key, value]) => {
        window.localStorage.setItem(key, JSON.stringify(value));
    });
}

export function clearAppDataForSetup(): void {
    window.localStorage.clear();
}
