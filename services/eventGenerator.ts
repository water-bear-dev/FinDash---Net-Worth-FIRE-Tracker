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

    baseItems.forEach(item => {
        // Include one-time items that fall within the range
        if (!item.isRecurring) {
            if (moment(item.date).isBetween(start, end, undefined, '[]')) {
                events.push(item);
            }
            return;
        }

        // Handle recurring items
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
            if (settings.endCondition === 'date' && currentDate.isAfter(settings.endDate)) break;
            if (settings.endCondition === 'occurrences' && occurrences >= (settings.endOccurrences || 0)) break;
            if (settings.endCondition === 'liability') {
                const liability = liabilities.find(l => l.id === settings.endLiabilityId);
                if (!liability || liability.outstandingBalance <= 0) break;
            }

            // Check if the current date is valid for this iteration
            let isValidDate = true;
            if(settings.frequency === 'weekdays' && (currentDate.day() === 0 || currentDate.day() === 6)) isValidDate = false;
            if(settings.frequency === 'weekends' && (currentDate.day() > 0 && currentDate.day() < 6)) isValidDate = false;

            // Add the event if it's within the window and valid
            if (currentDate.isSameOrAfter(start) && isValidDate) {
                 events.push({
                    ...item,
                    id: `${item.id}-${currentDate.format('YYYYMMDD')}`,
                    date: currentDate.format('YYYY-MM-DD'),
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

    return events;
};
