import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import DashboardPage from './pages/DashboardPage';
import ManageDataPage from './pages/ManageDataPage';
import TransactionsPage from './pages/TransactionsPage';
import ExpensesPage from './pages/ExpensesPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import IncomesPage from './pages/IncomesPage';
import { 
    CashAccount, Investment, Property, Liability, Transaction, 
    Dividend, BudgetItem, UserProfile, AssetCategory
} from './types';
import { fetchInvestmentPrices } from './services/marketDataService';
import moment from 'moment';
import { generateRecurringEvents } from './services/eventGenerator';
import { v4 as uuidv4 } from 'uuid';

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
    const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('userProfile', { name: 'User', email: '' });
    const [fmpApiKey, setFmpApiKey] = useLocalStorage<string>('fmpApiKey', '');
    const [targetAnnualSpending, setTargetAnnualSpending] = useLocalStorage<number>('targetAnnualSpending', 50000);
    const [currency, setCurrency] = useLocalStorage<string>('currency', 'USD');
    const [theme, setTheme] = useLocalStorage<string>('theme', 'dark');

    const [isPricesLoading, setIsPricesLoading] = useState(false);

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
        if (!fmpApiKey || holdings.length === 0) return;
        setIsPricesLoading(true);
        const tickers = holdings.map(h => h.ticker);
        const priceData = await fetchInvestmentPrices(tickers, fmpApiKey);
        
        const priceMap = new Map(priceData.map(p => [p.symbol, p.price]));
        
        setInvestments(holdings.map(inv => ({
            ...inv,
            currentValue: (priceMap.get(inv.ticker) || 0) * inv.quantity
        })));
        setIsPricesLoading(false);
    }, [fmpApiKey, holdings]);

    useEffect(() => {
         const initialInvestments = holdings.map(h => ({ ...h, currentValue: 0 }));
         setInvestments(initialInvestments);
    }, [holdings]);

    useEffect(() => {
        if(fmpApiKey && holdings.length > 0) {
            refreshPrices();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fmpApiKey, holdings.length]);


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
            addOrUpdate(setBudgetItems, budgetItem);
        }
    };

    // Derived calculations
    const totalInvestmentValue = useMemo(() => investments.reduce((sum, inv) => sum + inv.currentValue, 0), [investments]);
    const totalCash = useMemo(() => cashAccounts.reduce((sum, acc) => sum + acc.balance, 0), [cashAccounts]);
    const totalProperties = useMemo(() => properties.reduce((sum, prop) => sum + prop.currentValue, 0), [properties]);
    const totalAssets = totalInvestmentValue + totalCash + totalProperties;
    const totalLiabilities = useMemo(() => liabilities.reduce((sum, lia) => sum + lia.outstandingBalance, 0), [liabilities]);
    const netWorth = totalAssets - totalLiabilities;
    
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

    useEffect(() => {
        document.documentElement.className = theme;
    }, [theme]);

    return (
        <Router>
            <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 ${theme}`}>
                <Sidebar />
                <div className="flex-1 flex flex-col ml-0 sm:ml-64">
                    <TopBar theme={theme} toggleTheme={toggleTheme} userName={userProfile.name} />
                    <main className="flex-1 p-6 overflow-y-auto">
                        <Routes>
                            <Route path="/" element={
                                <DashboardPage
                                    netWorth={netWorth}
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
                                    fmpApiKey={fmpApiKey}
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
                                    addBudgetItem={(item) => addOrUpdate(setBudgetItems, item)}
                                    updateBudgetItem={(item) => addOrUpdate(setBudgetItems, item)}
                                    removeBudgetItem={(id) => remove(setBudgetItems, id)}
                                    formatCurrency={formatCurrency}
                                />
                            } />
                             <Route path="/expenses" element={
                                <ExpensesPage
                                    budgetItems={budgetItems}
                                    liabilities={liabilities}
                                    addBudgetItem={(item) => addOrUpdate(setBudgetItems, item)}
                                    updateBudgetItem={(item) => addOrUpdate(setBudgetItems, item)}
                                    removeBudgetItem={(id) => remove(setBudgetItems, id)}
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
                                />
                            } />
                            <Route path="/settings" element={
                                <SettingsPage
                                    userProfile={userProfile}
                                    saveUserProfile={setUserProfile}
                                    fmpApiKey={fmpApiKey}
                                    saveFmpApiKey={setFmpApiKey}
                                    targetAnnualSpending={targetAnnualSpending}
                                    saveTargetAnnualSpending={setTargetAnnualSpending}
                                    currency={currency}
                                    saveCurrency={setCurrency}
                                />
                            } />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </Router>
    );
};

export default App;