import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ChatbotWidget from './components/ChatbotWidget';
import SetupWizard from './components/SetupWizard';
import DashboardPage from './pages/DashboardPage';
import ManageDataPage from './pages/ManageDataPage';
import TransactionsPage from './pages/TransactionsPage';
import ExpensesPage from './pages/ExpensesPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import IncomesPage from './pages/IncomesPage';
import FIREPage from './pages/FIREPage';
import InvestmentsPage from './pages/InvestmentsPage';
import { 
    CashAccount, Investment, Property, Liability, Transaction, 
    Dividend, BudgetItem, UserProfile, AssetCategory, TargetAllocation, FireSettings, RebalancingSettings, HistoricalNetWorth
} from './types';
import moment from 'moment';
import { generateRecurringEvents } from './services/eventGenerator';
import { v4 as uuidv4 } from 'uuid';

// --- SAMPLE DATA ---

const sampleCashAccounts: CashAccount[] = [
  { id: 'c1', name: 'Main Checking Account', balance: 25480.50 },
  { id: 'c2', name: 'High-Yield Savings', balance: 50210.11 },
];

const sampleProperties: Property[] = [
  { id: 'p1', name: 'Primary Residence', currentValue: 850000, category: AssetCategory.Property },
];

const sampleLiabilities: Liability[] = [
  { id: 'l1', name: 'Mortgage', outstandingBalance: 425000, interestRate: 3.25 },
  { id: 'l2', name: 'Car Loan', outstandingBalance: 15200, interestRate: 5.1 },
];

const sampleTransactions: Transaction[] = [
  { id: 't1', ticker: 'VOO', category: AssetCategory.ETF, type: 'buy', date: '2022-05-10', quantity: 20, pricePerUnit: 380.50 },
  { id: 't2', ticker: 'AAPL', category: AssetCategory.Stock, type: 'buy', date: '2022-06-15', quantity: 50, pricePerUnit: 140.20 },
  { id: 't3', ticker: 'MSFT', category: AssetCategory.Stock, type: 'buy', date: '2023-01-20', quantity: 30, pricePerUnit: 240.00 },
  { id: 't4', ticker: 'VOO', category: AssetCategory.ETF, type: 'buy', date: '2023-03-12', quantity: 15, pricePerUnit: 360.75 },
  { id: 't5', ticker: 'NVDA', category: AssetCategory.Stock, type: 'buy', date: '2023-09-01', quantity: 10, pricePerUnit: 485.00 },
  { id: 't6', ticker: 'AAPL', category: AssetCategory.Stock, type: 'sell', date: '2024-02-28', quantity: 10, pricePerUnit: 180.00 },
  // NOTE: Crypto price fetching is not fully implemented in marketDataService, so this may not show a live value.
  { id: 't7', ticker: 'ETH-USD', category: AssetCategory.Crypto, type: 'buy', date: '2023-11-15', quantity: 2, pricePerUnit: 2000 },
  { id: 't8', ticker: 'CBA.AX', category: AssetCategory.Stock, type: 'buy', date: '2023-10-05', quantity: 100, pricePerUnit: 95.50 },
];

const sampleDividends: Dividend[] = [
  { id: 'd1', ticker: 'VOO', date: '2024-03-20', amount: 55.30 },
  { id: 'd2', ticker: 'AAPL', date: '2024-05-15', amount: 9.60 },
  { id: 'd3', ticker: 'MSFT', date: '2024-05-20', amount: 21.60 },
];

const sampleBudgetItems: BudgetItem[] = [
  {
    id: 'b1', name: 'Monthly Salary', category: 'Salary', amount: 7500, type: 'income', date: '2024-01-05', isRecurring: true,
    recurringSettings: { frequency: 'monthly', endCondition: 'never' },
  },
  {
    id: 'b2', name: 'Consulting Gig', category: 'Side Job', amount: 1200, type: 'income', date: '2024-05-15', isRecurring: false,
  },
  {
    id: 'b3', name: 'Mortgage Payment', category: 'Rent/Mortgage', amount: 2200, type: 'expense', date: '2024-01-01', isRecurring: true,
    recurringSettings: { frequency: 'monthly', endCondition: 'liability', endLiabilityId: 'l1' },
  },
   {
    id: 'b4', name: 'Car Payment', category: 'Car Payment/Lease', amount: 450, type: 'expense', date: '2024-01-15', isRecurring: true,
    recurringSettings: { frequency: 'monthly', endCondition: 'liability', endLiabilityId: 'l2' },
  },
  {
    id: 'b5', name: 'Groceries', category: 'Groceries & Food Staples', amount: 800, type: 'expense', date: '2024-01-07', isRecurring: true,
    recurringSettings: { frequency: 'monthly', endCondition: 'never' },
  },
  {
    id: 'b6', name: 'Utilities', category: 'Electricity, Gas, Water', amount: 250, type: 'expense', date: '2024-01-10', isRecurring: true,
    recurringSettings: { frequency: 'monthly', endCondition: 'never' },
  },
  {
    id: 'b7', name: 'Internet', category: 'Internet, Phone, Cable', amount: 80, type: 'expense', date: '2024-01-18', isRecurring: true,
    recurringSettings: { frequency: 'monthly', endCondition: 'never' },
  },
  {
    id: 'b8', name: 'Investment Contribution', category: 'Investment Contributions (Non-Retirement)', amount: 1500, type: 'expense', date: '2024-01-05', isRecurring: true,
    recurringSettings: { frequency: 'monthly', endCondition: 'never' },
  },
];

const sampleUserProfile: UserProfile = { name: 'Alex Doe', email: 'alex.doe@example.com' };

// A simple hook for using localStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}

const App: React.FC = () => {
    // State management using custom hook
    const [cashAccounts, setCashAccounts] = useLocalStorage<CashAccount[]>('cashAccounts', []);
    const [properties, setProperties] = useLocalStorage<Property[]>('properties', []);
    const [liabilities, setLiabilities] = useLocalStorage<Liability[]>('liabilities', []);
    const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
    const [dividends, setDividends] = useLocalStorage<Dividend[]>('dividends', []);
    const [budgetItems, setBudgetItems] = useLocalStorage<BudgetItem[]>('budgetItems', []);
    const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('userProfile', { name: '', email: '' });
    const [useLocalPriceServer, setUseLocalPriceServer] = useLocalStorage<boolean>('useLocalPriceServer', true);
    const [geminiApiKey, setGeminiApiKey] = useLocalStorage<string>('geminiApiKey', '');
    const [isChatbotEnabled, setIsChatbotEnabled] = useLocalStorage<boolean>('isChatbotEnabled', false);
    const [targetAnnualSpending, setTargetAnnualSpending] = useLocalStorage<number>('targetAnnualSpending', 60000);
    const [fireSettings, setFireSettings] = useLocalStorage<FireSettings>('fireSettings', {
        swr: 4.0,
        inflationRate: 2.5,
        expectedReturn: 7.0,
        taxRate: 15.0,
        simulationYears: 30
    });
    const [currency, setCurrency] = useLocalStorage<string>('currency', 'USD');
    const [theme, setTheme] = useLocalStorage<string>('theme', 'dark');
    const [targetAllocations, setTargetAllocations] = useLocalStorage<TargetAllocation[]>('targetAllocations', []);
    const [rebalancingSettings, setRebalancingSettings] = useLocalStorage<RebalancingSettings>('rebalancingSettings', {
        brokerageFee: 9.50, // Default for many platforms
        expectedReturn: 7.0
    });
    const [historicalNetWorth, setHistoricalNetWorth] = useLocalStorage<HistoricalNetWorth[]>('historicalNetWorth', []);
    const [isSetupComplete, setIsSetupComplete] = useLocalStorage<boolean>('isSetupComplete', false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isPricesLoading, setIsPricesLoading] = useState(false);

    const completeSetup = (data: { 
        userProfile: UserProfile; 
        cashAccounts: CashAccount[]; 
        properties: Property[]; 
        liabilities: Liability[]; 
        targetAnnualSpending: number;
        currency: string;
    }) => {
        setUserProfile(data.userProfile);
        setCashAccounts(data.cashAccounts);
        setProperties(data.properties);
        setLiabilities(data.liabilities);
        setTargetAnnualSpending(data.targetAnnualSpending);
        setCurrency(data.currency);
        setIsSetupComplete(true);
    };

    // Background Auto Sync
    useEffect(() => {
        const attemptSync = async () => {
            try {
                // Dynamic import to avoid strict dependency if running in non-browser env
                const { getDirectoryHandle, syncDataToDirectory } = await import('./services/syncService');
                const handle = await getDirectoryHandle();
                if (!handle) return;

                // Gather full backup JSON
                const keysToExport = ['cashAccounts', 'properties', 'liabilities', 'transactions', 'dividends', 'budgetItems', 'userProfile', 'geminiApiKey', 'isChatbotEnabled', 'targetAnnualSpending', 'currency', 'theme', 'targetAllocations', 'fireSettings'];
                const exportData: Record<string, any> = {};
                keysToExport.forEach(key => {
                    const item = window.localStorage.getItem(key);
                    if (item) {
                        try { exportData[key] = JSON.parse(item); } 
                        catch (e) { exportData[key] = item; }
                    }
                });

                const jsonString = JSON.stringify(exportData, null, 2);
                
                // Silent sync attempt (won't prompt the user if permission is missing, will just fail silently)
                const success = await syncDataToDirectory(handle, 'findash-sync.json', jsonString, true);
                if (success) {
                    const time = moment().format('YYYY-MM-DD HH:mm:ss');
                    window.localStorage.setItem('lastSyncTime', time);
                    console.log(`[AutoSync] Background sync successful at ${time}`);
                }
            } catch (err) {
                console.error('[AutoSync] Background sync failed:', err);
            }
        };

        // Attempt sync on initial load
        attemptSync();

        // Attempt sync every hour (3600000 ms)
        const intervalId = setInterval(attemptSync, 3600000);
        return () => clearInterval(intervalId);
    }, [
        // Re-run the effect if core data changes significantly, or just rely on interval?
        // Let's rely on the interval and initial load to avoid aggressive write cycles.
    ]);

    // Derived state for investments (holdings)
    const holdings = useMemo<Omit<Investment, 'currentValue'>[]>(() => {
        const holdingsMap = new Map<string, { quantity: number; totalCost: number; category: AssetCategory }>();

        transactions.forEach(t => {
            const holding = holdingsMap.get(t.ticker) || { quantity: 0, totalCost: 0, category: t.category };
            if (t.type === 'buy') {
                holding.quantity += t.quantity;
                holding.totalCost += t.quantity * t.pricePerUnit;
            } else { // sell
                const avgCost = holding.quantity > 0 ? holding.totalCost / holding.quantity : 0;
                holding.quantity -= t.quantity;
                holding.totalCost -= t.quantity * avgCost;
            }
            holdingsMap.set(t.ticker, { ...holding, category: t.category });
        });

        return Array.from(holdingsMap.entries())
            .filter(([, h]) => h.quantity > 0.000001) // Filter out tiny residual quantities
            .map(([ticker, h]) => ({
                id: ticker,
                ticker,
                quantity: h.quantity,
                costBasisPerUnit: h.quantity > 0 ? h.totalCost / h.quantity : 0,
                category: h.category
            }));
    }, [transactions]);
    
    const [investments, setInvestments] = useState<Investment[]>([]);

    // Refresh investment prices
    const refreshPrices = useCallback(async () => {
        if (holdings.length === 0) return;
        
        // If local server is not enabled, we can't fetch
        if (!useLocalPriceServer) {
             return;
        }

        setIsPricesLoading(true);
        const tickers = holdings.map(h => h.ticker);
        let results: { symbol: string; price: number }[] = [];

        try {
            if (useLocalPriceServer) {
                const response = await fetch(`http://localhost:8001/prices?tickers=${tickers.join(',')}`);
                if (!response.ok) throw new Error('Local server responded with an error');
                results = await response.json();
            }
            
            const priceMap = new Map(results.map(p => [p.symbol, p.price]));
            
            setInvestments(holdings.map(inv => ({
                ...inv,
                currentValue: (priceMap.get(inv.ticker) || 0) * inv.quantity
            })));
        } catch (error) {
            console.error('Error refreshing prices:', error);
        } finally {
            setIsPricesLoading(false);
        }
    }, [useLocalPriceServer, holdings]);

    useEffect(() => {
         const initialInvestments = holdings.map(h => ({ ...h, currentValue: 0 }));
         setInvestments(initialInvestments);
    }, [holdings]);

    useEffect(() => {
        if(useLocalPriceServer && holdings.length > 0) {
            refreshPrices();

            // Automated checking of tickers every 5 minutes (300,000 ms)
            const intervalId = setInterval(() => {
                refreshPrices();
            }, 300000);

            return () => clearInterval(intervalId);
        }
    }, [useLocalPriceServer, holdings.length, refreshPrices]);


    // CRUD functions
    const addOrUpdate = <T extends { id?: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, item: Omit<T, 'id'> | T) => {
        setter(prev => {
            if ('id' in item && item.id) {
                return prev.map(i => i.id === item.id ? item as T : i);
            }
            const newItem = { ...item, id: uuidv4() } as T;
            return [...prev, newItem];
        });
    };
    const remove = <T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: string) => {
        setter(prev => prev.filter(i => i.id !== id));
    };

    const updateBudgetItemWithScope = (item: BudgetItem, scope?: 'one' | 'future', occurrenceDate?: string) => {
        // If it's a new item (no ID), just add it.
        if (!('id' in item) || !item.id) {
            addOrUpdate(setBudgetItems, item);
            return;
        }

        const originalItem = budgetItems.find(bi => bi.id === item.id);
        
        // If not recurring, not an edit of a recurring item, or no scope provided, do a simple update
        if (!originalItem || !originalItem.isRecurring || !scope || !occurrenceDate) {
            setBudgetItems(prev => prev.map(i => i.id === item.id ? item : i));
            return;
        }

        if (scope === 'one') {
            // Create a one-time exception
            const exceptionItem: Omit<BudgetItem, 'id'> = {
                ...item,
                date: occurrenceDate,
                isRecurring: false,
                recurringSettings: undefined,
                originalId: item.id,
            };
            addOrUpdate(setBudgetItems, exceptionItem);
        } else if (scope === 'future') {
            // Split the series: end the old one, create a new one
            setBudgetItems(prev => {
                const newItems = [...prev];
                const originalItemIndex = newItems.findIndex(i => i.id === item.id);
                if (originalItemIndex === -1) return prev; 

                // 1. End the old series the day before the change
                const modifiedOriginalItem = { ...newItems[originalItemIndex] };
                modifiedOriginalItem.recurringSettings = {
                    ...(modifiedOriginalItem.recurringSettings!),
                    endCondition: 'date',
                    endDate: moment(occurrenceDate).subtract(1, 'day').format('YYYY-MM-DD'),
                };
                
                // If the new end date is before the series start date, it effectively archives the old series
                // which is correct if the user edits the very first occurrence.
                newItems[originalItemIndex] = modifiedOriginalItem;

                // 2. Create the new series starting from the occurrence date
                const newSeriesItem: BudgetItem = {
                    ...item,
                    id: uuidv4(),
                    date: occurrenceDate,
                    originalId: undefined, // This is a new base item now
                };

                newItems.push(newSeriesItem);
                
                return newItems;
            });
        }
    };
    
    const deleteBudgetItemWithScope = (item: BudgetItem, scope?: 'one' | 'future', occurrenceDate?: string) => {
        if (!item.isRecurring || !scope || !occurrenceDate) {
            remove(setBudgetItems, item.id);
            return;
        }

        setBudgetItems(prev => {
            const newItems = [...prev];
            const originalItemIndex = newItems.findIndex(i => i.id === item.id);
            if (originalItemIndex === -1) return prev;

            const updatedItem = { ...newItems[originalItemIndex] };
            updatedItem.recurringSettings = { ...updatedItem.recurringSettings! };
            
            if (scope === 'one') {
                if (!updatedItem.recurringSettings.exceptionDates) {
                    updatedItem.recurringSettings.exceptionDates = [];
                }
                updatedItem.recurringSettings.exceptionDates.push(occurrenceDate);
            } else if (scope === 'future') {
                 updatedItem.recurringSettings.endCondition = 'date';
                 updatedItem.recurringSettings.endDate = moment(occurrenceDate).subtract(1, 'day').format('YYYY-MM-DD');
            }
            
            newItems[originalItemIndex] = updatedItem;
            return newItems;
        });
    };
    const addBudgetItemAndUpdateCash = (item: BudgetItem | Omit<BudgetItem, 'id'>) => {
        addOrUpdate(setBudgetItems, item);
        
        // Auto-update Net Worth (Cash Account) for realized, non-recurring transactions
        const itemDate = moment(item.date);
        if (itemDate.isSameOrBefore(moment(), 'day') && !item.isRecurring) {
            setCashAccounts(prev => {
                const change = item.type === 'income' ? item.amount : -item.amount;
                if (prev.length === 0) {
                    return [{ id: Date.now().toString(), name: 'Main Wallet', balance: change }];
                }
                const newAccounts = [...prev];
                newAccounts[0] = { ...newAccounts[0], balance: newAccounts[0].balance + change };
                return newAccounts;
            });
        }
    };

    const addTransactionAndUpdateBudget = (transaction: Omit<Transaction, 'id'>) => {
        addOrUpdate(setTransactions, transaction);
        if (transaction.type === 'buy') {
            const budgetItem: Omit<BudgetItem, 'id'> = {
                name: `Buy ${transaction.ticker}`,
                amount: transaction.quantity * transaction.pricePerUnit,
                category: 'Investment Contributions (Non-Retirement)',
                date: transaction.date,
                type: 'expense',
                isRecurring: false
            };
            addBudgetItemAndUpdateCash(budgetItem);
        }
    };

    // Derived calculations
    const totalInvestmentValue = useMemo(() => investments.reduce((sum, inv) => sum + inv.currentValue, 0), [investments]);
    const totalCash = useMemo(() => cashAccounts.reduce((sum, acc) => sum + acc.balance, 0), [cashAccounts]);
    const totalProperties = useMemo(() => properties.reduce((sum, prop) => sum + prop.currentValue, 0), [properties]);
    const totalAssets = totalInvestmentValue + totalCash + totalProperties;
    const totalLiabilities = useMemo(() => liabilities.reduce((sum, lia) => sum + lia.outstandingBalance, 0), [liabilities]);
    const netWorth = totalAssets - totalLiabilities;
    
    // Automatically track Historical Net Worth for the current month
    useEffect(() => {
        // Wait until prices are loaded so we don't save a 0 net worth
        if (isPricesLoading || investments.length === 0 && cashAccounts.length === 0) return;

        const currentMonth = moment().format('YYYY-MM');
        setHistoricalNetWorth(prev => {
            const existingEntryIndex = prev.findIndex(entry => entry.date === currentMonth);
            if (existingEntryIndex >= 0) {
                // Update current month if value changed significantly to avoid excessive writes
                if (Math.abs(prev[existingEntryIndex].netWorth - netWorth) > 10) {
                    const newHistory = [...prev];
                    newHistory[existingEntryIndex] = { date: currentMonth, netWorth };
                    return newHistory;
                }
                return prev;
            } else {
                // Add new month
                return [...prev, { date: currentMonth, netWorth }];
            }
        });
    }, [netWorth, isPricesLoading, investments.length, cashAccounts.length, setHistoricalNetWorth]);

    const budgetSummary = useMemo(() => {
        const start = moment().startOf('month').toDate();
        const end = moment().endOf('month').toDate();
        const monthlyEvents = generateRecurringEvents(budgetItems, liabilities, start, end);
        const totalIncome = monthlyEvents.filter(e => e.type === 'income').reduce((acc, item) => acc + item.amount, 0);
        const totalExpenses = monthlyEvents.filter(e => e.type === 'expense').reduce((acc, item) => acc + item.amount, 0);
        return { totalExpenses, netMonthlySavings: totalIncome - totalExpenses };
    }, [budgetItems, liabilities]);
    
    const monthlyIncome = useMemo(() => {
        const start = moment().startOf('month').toDate();
        const end = moment().endOf('month').toDate();
        return generateRecurringEvents(budgetItems.filter(i => i.type === 'income'), liabilities, start, end)
            .reduce((acc, item) => acc + item.amount, 0);
    }, [budgetItems, liabilities]);


    // Helper functions
    const formatCurrency = useCallback((value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value), [currency]);
    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    useEffect(() => {
        document.documentElement.className = theme;
    }, [theme]);

    if (!isSetupComplete) {
        return (
            <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${theme}`}>
                <SetupWizard 
                    onComplete={completeSetup} 
                    onSkip={() => setIsSetupComplete(true)} 
                />
            </div>
        );
    }

    return (
        <Router>
            <div className={`flex h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 ${theme}`}>
                <Sidebar isCollapsed={isSidebarCollapsed} />
                <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'ml-0 sm:ml-20' : 'ml-0 sm:ml-64'}`}>
                    <TopBar theme={theme} toggleTheme={toggleTheme} userName={userProfile.name} toggleSidebar={toggleSidebar} />
                    <main className="flex-1 p-6 overflow-y-auto">
                        <Routes>
                            <Route path="/" element={
                                <DashboardPage
                                    netWorth={netWorth}
                                    historicalNetWorth={historicalNetWorth}
                                    totalAssets={totalAssets}
                                    totalLiabilities={totalLiabilities}
                                    fireData={{ targetAnnualSpending, monthlySavings: budgetSummary.netMonthlySavings }}
                                    holdings={investments}
                                    cashAccounts={cashAccounts}
                                    properties={properties}
                                    budgetSummary={budgetSummary}
                                    monthlyIncome={monthlyIncome}
                                    refreshPrices={refreshPrices}
                                    isPricesLoading={isPricesLoading}
                                    formatCurrency={formatCurrency}
                                />
                            } />
                            <Route path="/manage" element={
                                <ManageDataPage
                                    cashAccounts={cashAccounts}
                                    properties={properties}
                                    liabilities={liabilities}
                                    addCashAccount={(item) => addOrUpdate(setCashAccounts, item)}
                                    addProperty={(item) => addOrUpdate(setProperties, {...item, category: AssetCategory.Property})}
                                    addLiability={(item) => addOrUpdate(setLiabilities, item)}
                                    updateCashAccount={(item) => addOrUpdate(setCashAccounts, item)}
                                    updateProperty={(item) => addOrUpdate(setProperties, item)}
                                    updateLiability={(item) => addOrUpdate(setLiabilities, item)}
                                    removeCashAccount={(id) => remove(setCashAccounts, id)}
                                    removeProperty={(id) => remove(setProperties, id)}
                                    removeLiability={(id) => remove(setLiabilities, id)}
                                    formatCurrency={formatCurrency}
                                />
                            } />
                             <Route path="/transactions" element={
                                <TransactionsPage
                                    transactions={transactions}
                                    investments={investments}
                                    addTransactionAndUpdateBudget={addTransactionAndUpdateBudget}
                                    removeTransaction={(id) => remove(setTransactions, id)}
                                    dividends={dividends}
                                    addDividend={(item) => addOrUpdate(setDividends, item)}
                                    removeDividend={(id) => remove(setDividends, id)}
                                    formatCurrency={formatCurrency}
                                />
                            } />
                             <Route path="/incomes" element={
                                <IncomesPage
                                    budgetItems={budgetItems}
                                    liabilities={liabilities}
                                    addBudgetItem={addBudgetItemAndUpdateCash}
                                    updateBudgetItem={updateBudgetItemWithScope}
                                    removeBudgetItem={deleteBudgetItemWithScope}
                                    formatCurrency={formatCurrency}
                                />
                            } />
                             <Route path="/expenses" element={
                                <ExpensesPage
                                    budgetItems={budgetItems}
                                    liabilities={liabilities}
                                    addBudgetItem={addBudgetItemAndUpdateCash}
                                    updateBudgetItem={updateBudgetItemWithScope}
                                    removeBudgetItem={deleteBudgetItemWithScope}
                                    formatCurrency={formatCurrency}
                                />
                            } />
                            <Route path="/calendar" element={
                                <CalendarPage
                                    budgetItems={budgetItems}
                                    liabilities={liabilities}
                                    transactions={transactions}
                                    dividends={dividends}
                                    formatCurrency={formatCurrency}
                                    addBudgetItem={addBudgetItemAndUpdateCash}
                                    updateBudgetItem={updateBudgetItemWithScope}
                                    removeBudgetItem={deleteBudgetItemWithScope}
                                />
                            } />
                            <Route path="/fire" element={
                                <FIREPage
                                    netWorth={netWorth}
                                    fireData={{ targetAnnualSpending, monthlySavings: budgetSummary.netMonthlySavings }}
                                    fireSettings={fireSettings}
                                    setFireSettings={setFireSettings}
                                    setTargetAnnualSpending={setTargetAnnualSpending}
                                    formatCurrency={formatCurrency}
                                />
                            } />
                            <Route path="/investments" element={
                                <InvestmentsPage 
                                    holdings={investments} 
                                    refreshPrices={refreshPrices} 
                                    isPricesLoading={isPricesLoading}
                                    targetAllocations={targetAllocations}
                                    setTargetAllocations={setTargetAllocations}
                                    rebalancingSettings={rebalancingSettings}
                                    setRebalancingSettings={setRebalancingSettings}
                                    monthlySavings={budgetSummary.netMonthlySavings}
                                    formatCurrency={formatCurrency}
                                />
                            } />
                            <Route path="/settings" element={
                                <SettingsPage
                                    userProfile={userProfile}
                                    saveUserProfile={setUserProfile}
                                    geminiApiKey={geminiApiKey}
                                    saveGeminiApiKey={setGeminiApiKey}
                                    isChatbotEnabled={isChatbotEnabled}
                                    saveIsChatbotEnabled={setIsChatbotEnabled}
                                    targetAnnualSpending={targetAnnualSpending}
                                    saveTargetAnnualSpending={setTargetAnnualSpending}
                                    currency={currency}
                                    saveCurrency={setCurrency}
                                    useLocalPriceServer={useLocalPriceServer}
                                    saveUseLocalPriceServer={setUseLocalPriceServer}
                                />
                            } />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                    {isChatbotEnabled && (
                        <ChatbotWidget
                            geminiApiKey={geminiApiKey}
                            budgetItems={budgetItems}
                            transactions={transactions}
                            liabilities={liabilities}
                            netWorth={netWorth}
                            fireSettings={fireSettings}
                            addBudgetItem={(item) => addOrUpdate(setBudgetItems, item)}
                        />
                    )}
                </div>
            </div>
        </Router>
    );
};

export default App;