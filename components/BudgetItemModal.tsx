import React, { useState, ChangeEvent } from 'react';
import { BudgetItem, Liability } from '../types';
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

const BudgetItemModal: React.FC<BudgetItemModalProps> = ({ item, onSave, onClose, liabilities, onDelete, defaultDate, defaultType, occurrenceDate }) => {
    const isConfirmingInterest = !!(item && !item.id && item.name.startsWith('Est.'));

    const getInitialFormData = (): Omit<BudgetItem, 'id'> => {
        const type = item?.type || defaultType || 'expense';
        const defaults: Omit<BudgetItem, 'id'> = {
            name: '',
            category: type === 'income' ? incomeCategories[0] : expenseCategories[0].items[0],
            amount: 0,
            type: type,
            date: defaultDate || new Date().toISOString().split('T')[0],
            isRecurring: false,
            description: '',
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
    const [errors, setErrors] = useState<Record<string, string>>({});
    
    // Check if initial category is one of the "Other" variants
    const initialIsOther = formData.category === 'Other' || formData.category === 'Other (input them here)';
    const [customCategory, setCustomCategory] = useState(initialIsOther ? formData.category : '');

    const isOtherCategory = formData.category === 'Other' || formData.category === 'Other (input them here)';

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (formData.amount <= 0) newErrors.amount = 'Amount must be greater than 0';
        if (!formData.date) newErrors.date = 'Date is required';
        if (isOtherCategory && !customCategory.trim()) newErrors.customCategory = 'Please specify the category';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const finalCategory = isOtherCategory ? customCategory : formData.category;
        const dataToSave = { 
            ...formData, 
            category: finalCategory,
            id: (item && item.id) ? item.id : undefined 
        } as BudgetItem;
        
        onSave(dataToSave, item && item.isRecurring ? updateScope : undefined, occurrenceDate);
    };

    const handleDelete = () => {
        if (item && item.id && onDelete) {
            onDelete(item);
        }
    };

    const formatDoc = (command: string, value?: string) => {
        document.execCommand(command, false, value);
    };
    
    const labelClasses = "block mb-1 text-sm font-medium text-gray-900 dark:text-gray-300";
    const inputClasses = (error?: string) => `block w-full p-2.5 bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500 transition-all`;
    const btnPrimaryClasses = "text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800 transition-colors";
    const btnSecondaryClasses = "text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 transition-colors";
    const btnDangerClasses = "text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 transition-colors";

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-2xl border border-gray-100 dark:border-gray-700 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{item && item.id ? 'Edit' : isConfirmingInterest ? 'Confirm Interest' : 'Add'} Budget Item</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto pr-4 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClasses}>Name <span className="text-red-500 font-bold">*</span></label>
                            <input name="name" type="text" value={formData.name} onChange={handleChange} className={inputClasses(errors.name)} placeholder="e.g. Monthly Rent" />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className={labelClasses}>Type</label>
                            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                                <button type="button" onClick={() => setFormData(p => ({...p, type: 'expense', category: expenseCategories[0].items[0]}))} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.type === 'expense' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Expense</button>
                                <button type="button" onClick={() => setFormData(p => ({...p, type: 'income', category: incomeCategories[0]}))} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.type === 'income' ? 'bg-white dark:bg-gray-600 shadow-sm text-green-600 dark:text-green-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Income</button>
                            </div>
                        </div>
                        <div>
                            <label className={labelClasses}>Amount <span className="text-red-500 font-bold">*</span></label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                <input name="amount" type="number" value={formData.amount} onChange={handleChange} className={`${inputClasses(errors.amount)} pl-7`} step="0.01" />
                            </div>
                            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                        </div>
                        <div>
                             <label className={labelClasses}>Category</label>
                             <select name="category" value={formData.category} onChange={handleChange} className={inputClasses()}>
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

                    {isOtherCategory && (
                        <div className="animate-in slide-in-from-top-2 duration-200">
                            <label className={labelClasses}>Custom Category Name <span className="text-red-500 font-bold">*</span></label>
                            <input 
                                type="text" 
                                value={customCategory} 
                                onChange={(e) => setCustomCategory(e.target.value.substring(0, 128))} 
                                className={inputClasses(errors.customCategory)} 
                                placeholder="Enter category name..."
                                maxLength={128}
                            />
                            {errors.customCategory && <p className="text-red-500 text-xs mt-1">{errors.customCategory}</p>}
                            <p className="text-right text-[10px] text-gray-400 mt-1">{customCategory.length}/128</p>
                        </div>
                    )}

                    <div>
                        <label className={labelClasses}>Date <span className="text-red-500 font-bold">*</span></label>
                        <input name="date" type="date" value={formData.date} onChange={handleChange} className={inputClasses(errors.date)}/>
                        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                    </div>

                    {/* WYSIWYG Description */}
                    <div>
                        <label className={labelClasses}>Description (Notes)</label>
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                            <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-1 space-x-1">
                                <button type="button" onClick={() => formatDoc('bold')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded" title="Bold"><b>B</b></button>
                                <button type="button" onClick={() => formatDoc('italic')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded" title="Italic"><i>I</i></button>
                                <button type="button" onClick={() => formatDoc('underline')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded" title="Underline"><u>U</u></button>
                                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                                <button type="button" onClick={() => formatDoc('insertUnorderedList')} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded" title="Bullet List">• List</button>
                            </div>
                            <div 
                                contentEditable 
                                className="p-3 min-h-[100px] outline-none text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800"
                                onInput={(e) => setFormData(p => ({...p, description: e.currentTarget.innerHTML}))}
                                dangerouslySetInnerHTML={{ __html: formData.description || '' }}
                            />
                        </div>
                    </div>

                    {/* Recurring Switch */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">Recurring Payment</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Repeat this transaction on a schedule</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="isRecurring"
                                checked={formData.isRecurring} 
                                onChange={handleChange} 
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600 transition-all"></div>
                        </label>
                    </div>

                    {item && item.isRecurring && occurrenceDate && (
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                            <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-3">Apply Changes To:</h4>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setUpdateScope('one')} className={`flex-1 p-3 rounded-lg border text-left transition-all ${updateScope === 'one' ? 'bg-white dark:bg-gray-700 border-indigo-500 shadow-sm' : 'border-transparent text-gray-500'}`}>
                                    <span className="block font-bold text-sm">This occurrence only</span>
                                    <span className="text-[10px]">Just for {occurrenceDate}</span>
                                </button>
                                <button type="button" onClick={() => setUpdateScope('future')} className={`flex-1 p-3 rounded-lg border text-left transition-all ${updateScope === 'future' ? 'bg-white dark:bg-gray-700 border-indigo-500 shadow-sm' : 'border-transparent text-gray-500'}`}>
                                    <span className="block font-bold text-sm">All future events</span>
                                    <span className="text-[10px]">Series change from {occurrenceDate}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {formData.isRecurring && (
                        <div className="p-6 bg-gray-50 dark:bg-gray-700/20 border border-gray-200 dark:border-gray-700 rounded-xl space-y-6 animate-in slide-in-from-top-4 duration-300">
                            <h4 className="font-bold text-gray-900 dark:text-white flex items-center">
                                <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Schedule Details
                            </h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClasses}>Frequency</label>
                                    <select name="recurringSettings.frequency" value={formData.recurringSettings?.frequency} onChange={handleChange} className={inputClasses()}>
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
                                    <select name="recurringSettings.endCondition" value={formData.recurringSettings?.endCondition} onChange={handleChange} className={inputClasses()}>
                                        <option value="never">Never</option>
                                        <option value="date">On a specific date</option>
                                        <option value="occurrences">After X times</option>
                                        <option value="liability">When loan paid off</option>
                                    </select>
                                </div>
                                {formData.recurringSettings?.endCondition === 'date' && (
                                    <div className="animate-in slide-in-from-right-2 duration-200">
                                        <label className={labelClasses}>End Date</label>
                                        <input name="recurringSettings.endDate" type="date" value={formData.recurringSettings.endDate} onChange={handleChange} className={inputClasses()}/>
                                    </div>
                                )}
                                {formData.recurringSettings?.endCondition === 'occurrences' && (
                                     <div className="animate-in slide-in-from-right-2 duration-200">
                                        <label className={labelClasses}>Number of Occurrences</label>
                                        <input name="recurringSettings.endOccurrences" type="number" value={formData.recurringSettings.endOccurrences} onChange={handleChange} className={inputClasses()} />
                                    </div>
                                )}
                                {formData.recurringSettings?.endCondition === 'liability' && (
                                     <div className="animate-in slide-in-from-right-2 duration-200">
                                        <label className={labelClasses}>Liability</label>
                                        <select name="recurringSettings.endLiabilityId" value={formData.recurringSettings.endLiabilityId} onChange={handleChange} className={inputClasses()}>
                                            <option>Select a liability</option>
                                            {liabilities.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 sticky bottom-0 z-10 pb-2">
                        <div>
                            {item && item.id && onDelete && (
                                <button type="button" onClick={handleDelete} className={btnDangerClasses}>Delete Item</button>
                            )}
                        </div>
                        <div className="flex space-x-3">
                            <button type="button" onClick={onClose} className={btnSecondaryClasses}>Cancel</button>
                            <button type="submit" className={btnPrimaryClasses}>Save Changes</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BudgetItemModal;