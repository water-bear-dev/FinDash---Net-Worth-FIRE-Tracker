import moment from 'moment';
import { BudgetItem, Liability } from '../types';

export const generateRecurringEvents = (
    baseItems: BudgetItem[],
    liabilities: Liability[],
    startDate: Date,
    endDate: Date
): BudgetItem[] => {
    const events: BudgetItem[] = [];
    const start = moment(startDate);
    const end = moment(endDate);

    const recurringItems = baseItems.filter(item => item.isRecurring);
    const oneTimeItemsAndExceptions = baseItems.filter(item => !item.isRecurring);

    // Add one-time items and exceptions that fall within the range
    oneTimeItemsAndExceptions.forEach(item => {
        if (moment(item.date).isBetween(start, end, undefined, '[]')) {
            events.push({ ...item, originalId: item.originalId || item.id });
        }
    });

    recurringItems.forEach(item => {
        const settings = item.recurringSettings;
        if (!settings) return;

        let currentDate = moment(item.date);

        // Fast-forward to the start of the current window if the item started in the past
        if (currentDate.isBefore(start)) {
             switch (settings.frequency) {
                case 'daily':
                case 'weekdays':
                case 'weekends':
                     currentDate = start.clone().startOf('day');
                    break;
                case 'weekly':
                    currentDate.add(start.diff(currentDate, 'weeks'), 'weeks');
                    break;
                case 'fortnightly':
                    currentDate.add(Math.floor(start.diff(currentDate, 'weeks') / 2) * 2, 'weeks');
                    break;
                case 'monthly':
                     currentDate.add(start.diff(currentDate, 'months'), 'months');
                    break;
                case 'quarterly':
                    currentDate.add(start.diff(currentDate, 'months') / 3, 'quarters');
                    break;
                case 'yearly':
                     currentDate.add(start.diff(currentDate, 'years'), 'years');
                    break;
                case 'custom':
                    const interval = settings.customInterval || 1;
                    const unit = settings.customUnit || 'months';
                    const diff = start.diff(currentDate, unit);
                    if (diff > 0) {
                        currentDate.add(Math.floor(diff / interval) * interval, unit);
                    }
                    break;
            }
        }
        
        let occurrences = 0;
        
        while (currentDate.isBefore(end)) {
            // Check all end conditions before adding the event
            if (settings.endCondition === 'date' && settings.endDate && moment(settings.endDate).isValid() && currentDate.isAfter(settings.endDate, 'day')) break;
            if (settings.endCondition === 'occurrences' && occurrences >= (settings.endOccurrences || 0)) break;
            if (settings.endCondition === 'liability') {
                const liability = liabilities.find(l => l.id === settings.endLiabilityId);
                if (!liability || liability.outstandingBalance <= 0) break;
            }

            let isValidDate = true;
            if(settings.frequency === 'weekdays' && (currentDate.day() === 0 || currentDate.day() === 6)) isValidDate = false;
            if(settings.frequency === 'weekends' && (currentDate.day() > 0 && currentDate.day() < 6)) isValidDate = false;
            
            const eventDateStr = currentDate.format('YYYY-MM-DD');
            const isOverridden = oneTimeItemsAndExceptions.some(ex => ex.originalId === item.id && ex.date === eventDateStr);
            const isException = settings.exceptionDates?.includes(eventDateStr);


            if (currentDate.isSameOrAfter(start) && isValidDate && !isOverridden && !isException) {
                 events.push({
                    ...item,
                    originalId: item.id,
                    id: `${item.id}-${eventDateStr}`,
                    date: eventDateStr,
                 });
                 occurrences++;
            }
            
            // Move to the next date
            switch (settings.frequency) {
                case 'daily': currentDate.add(1, 'day'); break;
                case 'weekdays':
                case 'weekends':
                     currentDate.add(1, 'day'); break;
                case 'weekly': currentDate.add(1, 'week'); break;
                case 'fortnightly': currentDate.add(2, 'weeks'); break;
                case 'monthly': currentDate.add(1, 'month'); break;
                case 'quarterly': currentDate.add(3, 'months'); break;
                case 'yearly': currentDate.add(1, 'year'); break;
                case 'custom': currentDate.add(settings.customInterval || 1, settings.customUnit || 'months'); break;
            }
        }
    });

    // --- Generate estimated monthly interest payments for mortgages with simulated balance reduction ---
    const mortgageLiabilities = liabilities.filter(l => l.name.toLowerCase().includes('mortgage') && l.outstandingBalance > 0);

    if (mortgageLiabilities.length > 0) {
        const mortgagePaymentItems = baseItems.filter(item =>
            item.type === 'expense' &&
            item.recurringSettings?.endCondition === 'liability' &&
            mortgageLiabilities.some(l => l.id === item.recurringSettings?.endLiabilityId)
        );

        const simulatedBalances = new Map<string, number>(
            mortgageLiabilities.map(l => [l.id, l.outstandingBalance])
        );

        let monthIterator = moment(startDate).startOf('month');
        const endOfMonthView = moment(endDate).endOf('month');

        while (monthIterator.isSameOrBefore(endOfMonthView, 'month')) {
            mortgageLiabilities.forEach(mortgage => {
                const currentBalance = simulatedBalances.get(mortgage.id);
                if (!currentBalance || currentBalance <= 0) {
                    return;
                }

                const monthlyInterest = (currentBalance * (mortgage.interestRate / 100)) / 12;

                // Check if a user-confirmed interest payment already exists for this month.
                const confirmedInterestName = `${mortgage.name} Interest`;
                const hasConfirmedInterest = baseItems.some(item =>
                    !item.isRecurring &&
                    item.name === confirmedInterestName &&
                    moment(item.date).isSame(monthIterator, 'month')
                );
                
                if (!hasConfirmedInterest) {
                    let paymentDate = monthIterator.clone().endOf('month');
                    const dayOfWeek = paymentDate.day();
                    if (dayOfWeek === 6) { paymentDate.subtract(1, 'day');
                    } else if (dayOfWeek === 0) { paymentDate.subtract(2, 'days');
                    }
                    
                    if (paymentDate.isBetween(start, end, undefined, '[]')) {
                        const estimatedInterestEvent: BudgetItem = {
                            id: `interest-${mortgage.id}-${monthIterator.format('YYYY-MM')}`,
                            name: `Est. ${mortgage.name} Interest`,
                            category: 'Rent/Mortgage',
                            amount: monthlyInterest,
                            type: 'expense',
                            date: paymentDate.format('YYYY-MM-DD'),
                            isRecurring: true, 
                            recurringSettings: { 
                                frequency: 'monthly',
                                endCondition: 'liability',
                                endLiabilityId: mortgage.id,
                            },
                            originalId: `liability-${mortgage.id}`,
                        };
                        events.push(estimatedInterestEvent);
                    }
                }

                // Simulate balance reduction for the *next* month's calculation, regardless of event generation.
                const paymentItem = mortgagePaymentItems.find(p => p.recurringSettings?.endLiabilityId === mortgage.id);
                if (paymentItem) {
                    const principalPaid = paymentItem.amount - monthlyInterest;
                    if (principalPaid > 0) {
                        const nextBalance = currentBalance - principalPaid;
                        simulatedBalances.set(mortgage.id, nextBalance > 0 ? nextBalance : 0);
                    }
                }
            });

            monthIterator.add(1, 'month');
        }
    }


    return events;
};

/** Recurring template projections only — no one-time items, overrides, or synthetic mortgage interest. */
export const generatePlannedEvents = (
    baseItems: BudgetItem[],
    liabilities: Liability[],
    startDate: Date,
    endDate: Date
): BudgetItem[] => {
    const events: BudgetItem[] = [];
    const start = moment(startDate);
    const end = moment(endDate);
    const recurringItems = baseItems.filter(item => item.isRecurring);

    recurringItems.forEach(item => {
        const settings = item.recurringSettings;
        if (!settings) return;

        let currentDate = moment(item.date);

        if (currentDate.isBefore(start)) {
            switch (settings.frequency) {
                case 'daily':
                case 'weekdays':
                case 'weekends':
                    currentDate = start.clone().startOf('day');
                    break;
                case 'weekly':
                    currentDate.add(start.diff(currentDate, 'weeks'), 'weeks');
                    break;
                case 'fortnightly':
                    currentDate.add(Math.floor(start.diff(currentDate, 'weeks') / 2) * 2, 'weeks');
                    break;
                case 'monthly':
                    currentDate.add(start.diff(currentDate, 'months'), 'months');
                    break;
                case 'quarterly':
                    currentDate.add(start.diff(currentDate, 'months') / 3, 'quarters');
                    break;
                case 'yearly':
                    currentDate.add(start.diff(currentDate, 'years'), 'years');
                    break;
                case 'custom': {
                    const interval = settings.customInterval || 1;
                    const unit = settings.customUnit || 'months';
                    const diff = start.diff(currentDate, unit);
                    if (diff > 0) {
                        currentDate.add(Math.floor(diff / interval) * interval, unit);
                    }
                    break;
                }
            }
        }

        let occurrences = 0;

        while (currentDate.isBefore(end)) {
            if (settings.endCondition === 'date' && settings.endDate && moment(settings.endDate).isValid() && currentDate.isAfter(settings.endDate, 'day')) break;
            if (settings.endCondition === 'occurrences' && occurrences >= (settings.endOccurrences || 0)) break;
            if (settings.endCondition === 'liability') {
                const liability = liabilities.find(l => l.id === settings.endLiabilityId);
                if (!liability || liability.outstandingBalance <= 0) break;
            }

            let isValidDate = true;
            if (settings.frequency === 'weekdays' && (currentDate.day() === 0 || currentDate.day() === 6)) isValidDate = false;
            if (settings.frequency === 'weekends' && (currentDate.day() > 0 && currentDate.day() < 6)) isValidDate = false;

            const eventDateStr = currentDate.format('YYYY-MM-DD');
            const isException = settings.exceptionDates?.includes(eventDateStr);

            if (currentDate.isSameOrAfter(start) && isValidDate && !isException) {
                events.push({
                    ...item,
                    originalId: item.id,
                    id: `${item.id}-planned-${eventDateStr}`,
                    date: eventDateStr,
                });
                occurrences++;
            }

            switch (settings.frequency) {
                case 'daily': currentDate.add(1, 'day'); break;
                case 'weekdays':
                case 'weekends': currentDate.add(1, 'day'); break;
                case 'weekly': currentDate.add(1, 'week'); break;
                case 'fortnightly': currentDate.add(2, 'weeks'); break;
                case 'monthly': currentDate.add(1, 'month'); break;
                case 'quarterly': currentDate.add(3, 'months'); break;
                case 'yearly': currentDate.add(1, 'year'); break;
                case 'custom': currentDate.add(settings.customInterval || 1, settings.customUnit || 'months'); break;
            }
        }
    });

    return events;
};