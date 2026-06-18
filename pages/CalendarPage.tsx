import React, { useState, useMemo, useCallback } from 'react';
import moment, { Moment } from 'moment';
import { BudgetItem, Dividend, Liability, Transaction } from '../types';
import { generateRecurringEvents } from '../services/eventGenerator';
import BudgetItemModal from '../components/BudgetItemModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/solid';

interface CalendarPageProps {
    budgetItems: BudgetItem[];
    liabilities: Liability[];
    transactions: Transaction[];
    dividends: Dividend[];
    formatCurrency: (value: number) => string;
    addBudgetItem: (item: Omit<BudgetItem, 'id'>) => void;
    updateBudgetItem: (item: BudgetItem, scope?: 'one' | 'future', occurrenceDate?: string) => void;
    removeBudgetItem: (item: BudgetItem, scope?: 'one' | 'future', occurrenceDate?: string) => void;
}

type CalendarEvent = {
    id: string;
    title: string;
    start: Date;
    amount: number;
    type: 'income' | 'expense' | 'transaction' | 'dividend';
    originalItem: BudgetItem | Transaction | Dividend;
};

type View = 'month' | 'week' | 'day';

const CalendarPage: React.FC<CalendarPageProps> = (props) => {
    const { budgetItems, liabilities, transactions, dividends, formatCurrency, addBudgetItem, updateBudgetItem, removeBudgetItem } = props;

    const [currentDate, setCurrentDate] = useState(moment());
    const [view, setView] = useState<View>('month');
    const [hoveredEvent, setHoveredEvent] = useState<{ event: CalendarEvent; position: { x: number; y: number } } | null>(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<(BudgetItem & { occurrenceDate?: string }) | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ item: BudgetItem; occurrenceDate: string; isRecurring: boolean; } | null>(null);


    const { calendarEvents, viewRange } = useMemo(() => {
        const start = moment(currentDate).startOf(view);
        const end = moment(currentDate).endOf(view);

        // For month view, we need to pad the start/end to full weeks for the grid
        const viewStart = view === 'month' ? start.clone().startOf('week') : start;
        const viewEnd = view === 'month' ? end.clone().endOf('week') : end;

        const recurringBudgetEvents = generateRecurringEvents(budgetItems, liabilities, viewStart.toDate(), viewEnd.toDate());

        const allEvents: CalendarEvent[] = [];

        recurringBudgetEvents.forEach(item => {
            allEvents.push({
                id: item.id,
                title: item.name,
                start: moment(item.date).toDate(),
                amount: item.amount,
                type: item.type,
                originalItem: item,
            });
        });

        transactions.forEach(t => {
            const tDate = moment(t.date);
            if (tDate.isBetween(viewStart, viewEnd, undefined, '[]')) {
                allEvents.push({
                    id: t.id,
                    title: `${t.type.toUpperCase()} ${t.ticker}`,
                    start: tDate.toDate(),
                    amount: t.quantity * t.pricePerUnit,
                    type: 'transaction',
                    originalItem: t,
                });
            }
        });

        dividends.forEach(d => {
            const dDate = moment(d.date);
            if (dDate.isBetween(viewStart, viewEnd, undefined, '[]')) {
                 allEvents.push({
                    id: d.id,
                    title: `Dividend: ${d.ticker}`,
                    start: dDate.toDate(),
                    amount: d.amount,
                    type: 'dividend',
                    originalItem: d,
                });
            }
        });
        
        return { 
            calendarEvents: allEvents.sort((a, b) => a.start.getTime() - b.start.getTime()),
            viewRange: { start: viewStart, end: viewEnd }
        };

    }, [currentDate, view, budgetItems, liabilities, transactions, dividends]);
    
    const handlePrev = useCallback(() => setCurrentDate(prev => prev.clone().subtract(1, view)), [view]);
    const handleNext = useCallback(() => setCurrentDate(prev => prev.clone().add(1, view)), [view]);
    const handleToday = useCallback(() => setCurrentDate(moment()), []);

    const handleEventMouseEnter = (event: CalendarEvent, domEvent: React.MouseEvent) => {
        setHoveredEvent({ event, position: { x: domEvent.clientX, y: domEvent.clientY } });
    };
    const handleEventMouseLeave = () => setHoveredEvent(null);

    const handleCreateClick = () => {
        setEditingItem(null); // Null item signifies creation mode
        setIsModalOpen(true);
    };

    const handleEventClick = (event: CalendarEvent) => {
        if (event.type !== 'income' && event.type !== 'expense') {
            return;
        }

        const occurrence = event.originalItem as BudgetItem;
        
        // Handle estimated interest events: treat as a template for a new, real expense
        if (occurrence.originalId?.startsWith('liability-')) {
            const newItemTemplate: BudgetItem = {
                id: '', // Empty ID signifies a new item
                name: occurrence.name, // Pass with "Est." so modal can identify it
                category: occurrence.category,
                amount: occurrence.amount,
                type: 'expense',
                date: occurrence.date,
                isRecurring: false,
            };
            setEditingItem(newItemTemplate);
            setIsModalOpen(true);
            return;
        }
        
        // Handle regular recurring/one-off budget items
        const originalId = occurrence.originalId || occurrence.id;
        const originalBudgetItem = budgetItems.find(item => item.id === originalId);
        if (originalBudgetItem) {
            setEditingItem({ ...originalBudgetItem, occurrenceDate: occurrence.date });
            setIsModalOpen(true);
        }
    };

    const handleModalSave = (item: BudgetItem | Omit<BudgetItem, 'id'>, scope?: 'one' | 'future', occurrenceDate?: string) => {
        if (editingItem?.id && 'id' in item && item.id) {
            updateBudgetItem(item, scope, occurrenceDate);
        } else {
            addBudgetItem(item);
        }
        setIsModalOpen(false);
    };

    const handleModalDelete = (item: BudgetItem) => {
        if (editingItem?.occurrenceDate) {
            setItemToDelete({ item, occurrenceDate: editingItem.occurrenceDate, isRecurring: item.isRecurring });
        }
        setIsModalOpen(false); // Close edit modal
    };
    
    const handleConfirmDelete = (scope?: 'one' | 'future') => {
        if (itemToDelete) {
            removeBudgetItem(itemToDelete.item, scope, itemToDelete.occurrenceDate);
            setItemToDelete(null);
        }
    };

    const getEventColor = (type: CalendarEvent['type']) => ({
        'income': 'bg-green-600 hover:bg-green-500',
        'expense': 'bg-red-600 hover:bg-red-500',
        'transaction': 'bg-blue-600 hover:bg-blue-500',
        'dividend': 'bg-purple-600 hover:bg-purple-500',
    }[type]);

    const renderHeader = () => {
        let title = '';
        if (view === 'month') title = currentDate.format('MMMM YYYY');
        else if (view === 'week') {
            const startOfWeek = currentDate.clone().startOf('week');
            const endOfWeek = currentDate.clone().endOf('week');
            title = `${startOfWeek.format('MMM D')} - ${endOfWeek.format('D, YYYY')}`;
        } else title = currentDate.format('dddd, MMMM D, YYYY');

        return (
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
                <div className="flex items-center gap-2">
                    <button onClick={handlePrev} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeftIcon className="h-5 w-5"/></button>
                    <button onClick={handleNext} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronRightIcon className="h-5 w-5"/></button>
                    <button onClick={handleToday} className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">Today</button>
                    <h2 className="text-xl font-bold ml-4">{title}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                        {(['month', 'week', 'day'] as View[]).map(v => (
                            <button key={v} onClick={() => setView(v)} className={`px-3 py-1 text-sm font-medium rounded-md capitalize transition-colors ${view === v ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                                {v}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleCreateClick} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                        <PlusIcon className="h-4 w-4" />
                        <span>Create</span>
                    </button>
                </div>
            </div>
        );
    };

    const renderMonthView = () => {
        const days: Moment[] = [];
        let day = viewRange.start.clone();
        while (day.isSameOrBefore(viewRange.end, 'day')) {
            days.push(day.clone());
            day.add(1, 'day');
        }
        
        const dayNames = moment.weekdaysShort();

        return (
            <div className="grid grid-cols-7 border-t border-l border-gray-200 dark:border-gray-700">
                {dayNames.map(name => <div key={name} className="p-2 text-center text-xs font-bold uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">{name}</div>)}
                {days.map(d => {
                    const eventsForDay = calendarEvents.filter(e => moment(e.start).isSame(d, 'day'));
                    const isToday = d.isSame(moment(), 'day');
                    const isCurrentMonth = d.isSame(currentDate, 'month');

                    return (
                        <div key={d.format('YYYY-MM-DD')} className={`relative min-h-[120px] p-2 border-b border-r border-gray-200 dark:border-gray-700 ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                            <span className={`text-sm ${isToday ? 'bg-indigo-600 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold' : isCurrentMonth ? 'text-gray-900 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                                {d.date()}
                            </span>
                            <div className="mt-1 space-y-1">
                                {eventsForDay.map(e => (
                                    <div key={e.id}
                                        onMouseEnter={(ev) => handleEventMouseEnter(e, ev)}
                                        onMouseLeave={handleEventMouseLeave}
                                        onClick={() => handleEventClick(e)}
                                        className={`p-1 rounded-md text-white text-xs truncate cursor-pointer ${getEventColor(e.type)}`}
                                    >
                                        {e.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderWeekView = () => {
        const days: Moment[] = [];
        let day = currentDate.clone().startOf('week');
        for (let i = 0; i < 7; i++) {
            days.push(day.clone());
            day.add(1, 'day');
        }

        return (
            <div className="border-t border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                {days.map(d => {
                    const eventsForDay = calendarEvents.filter(e => moment(e.start).isSame(d, 'day'));
                    const isToday = d.isSame(moment(), 'day');
                    return (
                        <div key={d.format()} className="p-4">
                            <h3 className={`font-semibold mb-2 ${isToday ? 'text-indigo-500 dark:text-indigo-400' : ''}`}>{d.format('dddd, MMM D')}</h3>
                            {eventsForDay.length > 0 ? (
                                <div className="space-y-2">
                                    {eventsForDay.map(e => (
                                        <div key={e.id}
                                            onMouseEnter={(ev) => handleEventMouseEnter(e, ev)}
                                            onMouseLeave={handleEventMouseLeave}
                                            onClick={() => handleEventClick(e)}
                                            className={`p-2 rounded-md text-white flex justify-between items-center cursor-pointer ${getEventColor(e.type)}`}
                                        >
                                            <span className="font-medium">{e.title}</span>
                                            <span className="font-mono">{formatCurrency(e.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-gray-500">No events scheduled.</p>}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderDayView = () => {
        const eventsForDay = calendarEvents.filter(e => moment(e.start).isSame(currentDate, 'day'));
         return (
             <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                {eventsForDay.length > 0 ? (
                    <div className="space-y-2">
                        {eventsForDay.map(e => (
                            <div key={e.id}
                                onMouseEnter={(ev) => handleEventMouseEnter(e, ev)}
                                onMouseLeave={handleEventMouseLeave}
                                onClick={() => handleEventClick(e)}
                                className={`p-2 rounded-md text-white flex justify-between items-center cursor-pointer ${getEventColor(e.type)}`}
                            >
                                <span className="font-medium">{e.title}</span>
                                <span className="font-mono">{formatCurrency(e.amount)}</span>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-sm text-gray-500">No events scheduled for this day.</p>}
             </div>
         );
    };

    const renderPopover = () => {
        if (!hoveredEvent) return null;
        const { event, position } = hoveredEvent;
        return (
            <div className="fixed bg-gray-900 border border-gray-600 rounded-lg shadow-lg p-3 text-sm text-white z-50 pointer-events-none"
                 style={{ top: position.y + 10, left: position.x + 10 }}>
                <p className="font-bold">{event.title}</p>
                <p className="capitalize">{event.type}: <span className="font-mono">{formatCurrency(event.amount)}</span></p>
            </div>
        );
    };

    return (
        <>
            <div className="space-y-6">
                <header>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar</h1>
                    <p className="text-gray-500 dark:text-gray-400">View your financial events on a calendar.</p>
                </header>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    {renderHeader()}
                    {view === 'month' && renderMonthView()}
                    {view === 'week' && renderWeekView()}
                    {view === 'day' && renderDayView()}
                </div>
            </div>
            {renderPopover()}
            {isModalOpen && (
                <BudgetItemModal 
                    item={editingItem}
                    onSave={handleModalSave}
                    onClose={() => setIsModalOpen(false)}
                    onDelete={handleModalDelete}
                    liabilities={liabilities}
                    occurrenceDate={editingItem?.occurrenceDate}
                    defaultDate={view === 'day' ? currentDate.format('YYYY-MM-DD') : undefined}
                />
            )}
            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleConfirmDelete}
                title={`Delete ${itemToDelete?.item.type}`}
                message={itemToDelete?.isRecurring ? `You are deleting an occurrence of a recurring item.` : `Are you sure you want to delete "${itemToDelete?.item.name}"? This action cannot be undone.`}
                showScopeOptions={itemToDelete?.isRecurring}
                occurrenceDate={itemToDelete?.occurrenceDate}
            />
        </>
    );
};

export default CalendarPage;