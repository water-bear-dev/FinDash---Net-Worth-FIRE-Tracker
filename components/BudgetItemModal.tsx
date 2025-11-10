import React, { useState, ChangeEvent } from 'react';
import { BudgetItem, RecurringFrequency, RecurringEndCondition, Liability } from '../types';
import { expenseCategories, incomeCategories } from '../data/categories';

interface BudgetItemModalProps {
    item: BudgetItem | null;
    onSave: (item: Omit<BudgetItem, 'id'> | BudgetItem, scope?: 'one' | 'future', occurrenceDate?: string) => void;
    onClose: () => void;
    liabilities: Liability[];
    onDelete?: (item: BudgetItem) => void;
    defaultDate?: string;
    defaultType?: 'income' | 'expense';
    occurrenceDate?: string;
}

const BudgetItemModal: React.FC<BudgetItemModalProps> = ({ item, onSave, onClose, liabilities, onDelete, defaultDate, defaultType = 'expense', occurrenceDate }) => {
    const isConfirmingInterest = !!(item && !item.id && item.name.startsWith('Est.'));

    const getInitialFormData = (): Omit<BudgetItem, 'id'> => {
        const type = item?.type || defaultType;
        const defaults: Omit<BudgetItem, 'id'> = {
            name: '',
            category: type === 'income' ? incomeCategories[0] : expenseCategories[0].items[0],
            amount: 0,
            type: type,
            date: defaultDate || new Date().toISOString().split('T')[0],
            isRecurring: false,
            recurringSettings: {
                frequency: 'monthly',
                endCondition: 'never',
            }
        };
        if (item) {
             return {
                ...defaults,
                ...item,
                name: isConfirmingInterest ? item.name.replace('Est. ', '') : item.name,
                date: item.date,
                recurringSettings: { ...defaults.recurringSettings, ...item.recurringSettings }
            };
        }
        return defaults;
    };
    
    const [formData, setFormData] = useState<Omit<BudgetItem, 'id'>>(getInitialFormData);
    const [updateScope, setUpdateScope] = useState<'one' | 'future'>('future');


    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type: inputType } = e.target;
        if (name.startsWith('recurringSettings.')) {
            const key = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                recurringSettings: { 
                    ...(prev.recurringSettings!), 
                    [key]: inputType === 'number' ? parseFloat(value) || 0 : value 
                }
            }));
        } else {
             const isCheckbox = inputType === 'checkbox';
             const isNumber = inputType === 'number';
             
            if (name === 'type') {
                const newType = value as 'income' | 'expense';
                setFormData(prev => ({
                    ...prev,
                    type: newType,
                    category: newType === 'income' ? incomeCategories[0] : expenseCategories[0].items[0],
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    [name]: isCheckbox ? (e.target as HTMLInputElement).checked : (isNumber ? parseFloat(value) || 0 : value),
                }));
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = (item && item.id) ? { ...formData, id: item.id } : formData;
        onSave(dataToSave, item && item.isRecurring ? updateScope : undefined, occurrenceDate);
    };

    const handleDelete = () => {
        if (item && item.id && onDelete) {
            onDelete(item);
        }
    };
    
    const labelClasses = "block mb-1 text-sm font-medium text-gray-900 dark:text-gray-300";
    const inputClasses = "block w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500";
    const btnPrimaryClasses = "text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800";
    const btnSecondaryClasses = "text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700";
    const btnDangerClasses = "text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800";

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{item && item.id ? 'Edit' : isConfirmingInterest ? 'Confirm Interest Expense' : 'Add'} Budget Item</h3>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClasses}>Name</label>
                            <input name="name" type="text" value={formData.name} onChange={handleChange} required className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClasses}>Type</label>
                            <select name="type" value={formData.type} onChange={handleChange} className={inputClasses} disabled={!!defaultType && !item}>
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClasses}>Amount</label>
                            <input name="amount" type="number" value={formData.amount} onChange={handleChange} required className={inputClasses} step="0.01"/>
                        </div>
                        <div>
                             <label className={labelClasses}>Category</label>
                             <select name="category" value={formData.category} onChange={handleChange} className={inputClasses}>
                                {formData.type === 'income' ? (
                                    incomeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                                ) : (
                                    expenseCategories.map(group => (
                                        <optgroup label={group.name} key={group.name}>
                                            {group.items.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </optgroup>
                                    ))
                                )}
                             </select>
                        </div>
                    </div>
                    <div>
                        <label className={labelClasses}>Date (acts as start date for recurring)</label>
                        <input name="date" type="date" value={formData.date} onChange={handleChange} required className={inputClasses}/>
                    </div>
                    <div className="flex items-center">
                        <input name="isRecurring" type="checkbox" checked={formData.isRecurring} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" id="isRecurring" />
                        <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Is this a recurring item?</label>
                    </div>

                    {item && item.isRecurring && occurrenceDate && (
                        <div className="p-4 bg-indigo-50 dark:bg-gray-700/50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Apply Changes To:</h4>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <input id="scope-one" type="radio" value="one" name="updateScope" checked={updateScope === 'one'} onChange={(e) => setUpdateScope(e.target.value as 'one' | 'future')} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"/>
                                    <label htmlFor="scope-one" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        This occurrence only
                                        <span className="block text-xs text-gray-500 dark:text-gray-400">Creates a one-time exception for {occurrenceDate}.</span>
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input id="scope-future" type="radio" value="future" name="updateScope" checked={updateScope === 'future'} onChange={(e) => setUpdateScope(e.target.value as 'one' | 'future')} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"/>
                                    <label htmlFor="scope-future" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        This and all future occurrences
                                        <span className="block text-xs text-gray-500 dark:text-gray-400">Ends the current series and starts a new one from {occurrenceDate}.</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {formData.isRecurring && (
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white">Recurring Settings</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClasses}>Frequency</label>
                                    <select name="recurringSettings.frequency" value={formData.recurringSettings?.frequency} onChange={handleChange} className={inputClasses}>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="fortnightly">Fortnightly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="yearly">Yearly</option>
                                        <option value="weekdays">Weekdays</option>
                                        <option value="weekends">Weekends</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClasses}>End Condition</label>
                                    <select name="recurringSettings.endCondition" value={formData.recurringSettings?.endCondition} onChange={handleChange} className={inputClasses}>
                                        <option value="never">Never</option>
                                        <option value="date">On a specific date</option>
                                        <option value="occurrences">After a number of occurrences</option>
                                        <option value="liability">When a liability is paid off</option>
                                    </select>
                                </div>
                                {formData.recurringSettings?.endCondition === 'date' && (
                                    <div>
                                        <label className={labelClasses}>End Date</label>
                                        <input name="recurringSettings.endDate" type="date" value={formData.recurringSettings.endDate} onChange={handleChange} className={inputClasses}/>
                                    </div>
                                )}
                                {formData.recurringSettings?.endCondition === 'occurrences' && (
                                     <div>
                                        <label className={labelClasses}>Number of Occurrences</label>
                                        <input name="recurringSettings.endOccurrences" type="number" value={formData.recurringSettings.endOccurrences} onChange={handleChange} className={inputClasses} />
                                    </div>
                                )}
                                {formData.recurringSettings?.endCondition === 'liability' && (
                                     <div>
                                        <label className={labelClasses}>Liability</label>
                                        <select name="recurringSettings.endLiabilityId" value={formData.recurringSettings.endLiabilityId} onChange={handleChange} className={inputClasses}>
                                            <option>Select a liability</option>
                                            {liabilities.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="mt-6 flex justify-between items-center">
                        <div>
                            {item && item.id && onDelete && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className={`${btnDangerClasses} w-auto`}
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                        <div className="flex justify-end space-x-4">
                            <button type="button" onClick={onClose} className={`${btnSecondaryClasses} w-auto`}>Cancel</button>
                            <button type="submit" className={`${btnPrimaryClasses} w-auto`}>Save</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BudgetItemModal;