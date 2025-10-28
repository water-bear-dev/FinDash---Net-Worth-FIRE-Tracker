

import React, { useState, useMemo } from 'react';
import moment from 'moment';
import { BudgetItem, Liability, Transaction, Dividend, FinancialEvent } from '../types';
import Card from '../components/Card';
import { generateRecurringEvents } from '../services/eventGenerator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CalendarPageProps {
    budgetItems: BudgetItem[];
    liabilities: Liability[];
    transactions: Transaction[];
    dividends: Dividend[];
    formatCurrency: (value: number) => string;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ budgetItems, liabilities, transactions, dividends, formatCurrency }) => {
    const [currentDate, setCurrentDate] = useState(moment());
    const [forecastSettings, setForecastSettings] = useState({
        liabilityId: '',
        repaymentValue: '500',
        repaymentFrequency: 'monthly' as 'weekly' | 'fortnightly' | 'monthly'
    });

    const financialEvents = useMemo<FinancialEvent[]>(() => {
        const start = currentDate.clone().startOf('month').startOf('week').toDate();
        const end = currentDate.clone().endOf('month').endOf('week').toDate();
        
        // FIX: Update budgetEvents to match FinancialEvent interface
        const budgetEvents: FinancialEvent[] = generateRecurringEvents(budgetItems, liabilities, start, end).map(item => ({
            id: item.id,
            title: `${item.type === 'income' ? '+' : '-'} ${formatCurrency(item.amount)}: ${item.name}`,
            start: moment(item.date).toDate(),
            end: moment(item.date).toDate(),
            allDay: true,
            resource: {
                type: item.type
            }
        }));

        // FIX: Update transactionEvents to match FinancialEvent interface
        const transactionEvents: FinancialEvent[] = transactions
            .filter(t => moment(t.date).isBetween(start, end, undefined, '[]'))
            .map(t => ({
                id: t.id,
                title: `${t.type.toUpperCase()} ${t.ticker}`,
                start: moment(t.date).toDate(),
                end: moment(t.date).toDate(),
                allDay: true,
                resource: {
                    type: 'transaction'
                }
            }));
        
        // FIX: Update dividendEvents to match FinancialEvent interface
        const dividendEvents: FinancialEvent[] = dividends
            .filter(d => moment(d.date).isBetween(start, end, undefined, '[]'))
            .map(d => ({
                id: d.id,
                title: `Div: ${d.ticker} ${formatCurrency(d.amount)}`,
                start: moment(d.date).toDate(),
                end: moment(d.date).toDate(),
                allDay: true,
                resource: {
                    type: 'dividend'
                }
            }));

        return [...budgetEvents, ...transactionEvents, ...dividendEvents];
      }, [currentDate, budgetItems, transactions, dividends, liabilities, formatCurrency]);

    const loanForecastData = useMemo(() => {
        const { liabilityId, repaymentValue, repaymentFrequency } = forecastSettings;
        if (!liabilityId) return [];

        const selectedLiability = liabilities.find(l => l.id === liabilityId);
        if (!selectedLiability || !repaymentValue || parseFloat(repaymentValue) <= 0) return [];

        const data = [];
        let currentBalance = selectedLiability.outstandingBalance;
        let currentDate = moment();
        const paymentAmount = parseFloat(repaymentValue);

        for (let i = 0; i < 60; i++) { // Forecast for 5 years
            data.push({
                date: currentDate.format('MMM YYYY'),
                balance: Math.max(0, currentBalance),
            });
            if (currentBalance <= 0) break;

            const monthlyInterest = currentBalance * (selectedLiability.interestRate / 100 / 12);
            currentBalance += monthlyInterest;
            
            if (repaymentFrequency === 'monthly') {
                currentBalance -= paymentAmount;
            } else if (repaymentFrequency === 'fortnightly') {
                currentBalance -= paymentAmount * 2; // Simplified
            } else if (repaymentFrequency === 'weekly') {
                currentBalance -= paymentAmount * 4; // Simplified
            }
            
            currentDate.add(1, 'month');
        }

        return data;
    }, [forecastSettings, liabilities]);

    const startOfMonth = currentDate.clone().startOf('month');
    const endOfMonth = currentDate.clone().endOf('month');
    const startOfWeek = startOfMonth.clone().startOf('week');

    const calendarDays = [];
    let day = startOfWeek.clone();
    while (calendarDays.length < 42) { // Ensure 6 weeks are always rendered
        calendarDays.push(day.clone());
        day.add(1, 'day');
    }

    const getEventsForDay = (date: moment.Moment) => {
        return financialEvents.filter(event => moment(event.start).isSame(date, 'day'));
    };

    // FIX: Update function signature to use resource.type
    const getEventTypeColor = (type: FinancialEvent['resource']['type']) => {
        switch (type) {
            case 'income': return 'bg-green-500/80 dark:bg-green-600/80';
            case 'expense': return 'bg-red-500/80 dark:bg-red-600/80';
            case 'dividend': return 'bg-blue-500/80 dark:bg-blue-600/80';
            case 'transaction': return 'bg-indigo-500/80 dark:bg-indigo-600/80';
            default: return 'bg-gray-500/80 dark:bg-gray-600/80';
        }
    };
    
    const inputClasses = "block w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500";
    const btnSecondaryClasses = "w-full sm:w-auto text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 transition-colors";


    return (
        <div className="space-y-6">
             <header>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Calendar</h1>
                <p className="text-gray-500 dark:text-gray-400">Visualize your upcoming financial events and forecast loan repayments.</p>
            </header>
            
            <Card title="Calendar View">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setCurrentDate(currentDate.clone().subtract(1, 'month'))} className={btnSecondaryClasses}>&lt; Prev</button>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{currentDate.format('MMMM YYYY')}</h2>
                    <button onClick={() => setCurrentDate(currentDate.clone().add(1, 'month'))} className={btnSecondaryClasses}>Next &gt;</button>
                </div>
                
                <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
                        <div key={dayName} className="text-center font-semibold py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs sm:text-sm">{dayName}</div>
                    ))}
                    {calendarDays.map(d => {
                        const isCurrentMonth = d.isSame(currentDate, 'month');
                        const isToday = d.isSame(moment(), 'day');
                        const dayEvents = getEventsForDay(d);

                        return (
                            <div key={d.format('YYYY-MM-DD')} className={`p-1.5 h-24 sm:h-32 flex flex-col bg-white dark:bg-gray-800 ${!isCurrentMonth ? 'opacity-50' : ''}`}>
                                <div className={`text-xs sm:text-sm font-semibold ${isToday ? 'text-indigo-500' : 'text-gray-900 dark:text-white'}`}>{d.format('D')}</div>
                                <div className="flex-grow overflow-y-auto text-xs space-y-1 mt-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                                    {dayEvents.slice(0, 3).map(event => (
                                        // FIX: Update call to getEventTypeColor to pass event.resource.type
                                        <div key={event.id} title={event.title} className={`p-1 rounded text-white truncate ${getEventTypeColor(event.resource.type)}`}>
                                            <span className="hidden sm:inline">{event.title}</span>
                                            <span className="sm:hidden">{event.title.split(':')[0]}</span>
                                        </div>
                                    ))}
                                     {dayEvents.length > 3 && ( <div className="text-center text-gray-500 dark:text-gray-400">+{dayEvents.length - 3} more</div> )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            <Card title="Loan Repayment Forecast">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                     <select name="liabilityId" value={forecastSettings.liabilityId} onChange={(e) => setForecastSettings({...forecastSettings, liabilityId: e.target.value})} className={inputClasses}>
                        <option value="">Select a Liability</option>
                        {liabilities.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                    <input name="repaymentValue" type="number" placeholder="Repayment Value" value={forecastSettings.repaymentValue} onChange={(e) => setForecastSettings({...forecastSettings, repaymentValue: e.target.value})} className={inputClasses} />
                    <select name="repaymentFrequency" value={forecastSettings.repaymentFrequency} onChange={(e) => setForecastSettings({...forecastSettings, repaymentFrequency: e.target.value as any})} className={inputClasses}>
                        <option value="weekly">Weekly</option>
                        <option value="fortnightly">Fortnightly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={loanForecastData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                            <XAxis dataKey="date" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" tickFormatter={(value) => formatCurrency(Number(value)).replace(/\.00$/, '')} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                                formatter={(value: number) => [formatCurrency(value), 'Balance']}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="balance" stroke="#6366F1" strokeWidth={2} activeDot={{ r: 8 }} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

export default CalendarPage;