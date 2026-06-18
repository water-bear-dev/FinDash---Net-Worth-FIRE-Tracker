import React, { useState } from 'react';
import { CashAccount, Property, Liability, AssetCategory, BudgetItem } from '../types';
import Card from '../components/Card';
import ConfirmationModal from '../components/ConfirmationModal';
import DebtPayoffPlanner from '../components/DebtPayoffPlanner';

type Item = CashAccount | Property | Liability;
type ItemType = 'cash' | 'property' | 'liability';

interface ManageDataPageProps {
    cashAccounts: CashAccount[];
    properties: Property[];
    liabilities: Liability[];
    budgetItems: BudgetItem[];
    addCashAccount: (account: Omit<CashAccount, 'id'>) => void;
    addProperty: (property: Omit<Property, 'id' | 'category'>) => void;
    addLiability: (liability: Omit<Liability, 'id'>) => void;
    updateCashAccount: (account: CashAccount) => void;
    updateProperty: (property: Property) => void;
    updateLiability: (liability: Liability) => void;
    removeCashAccount: (id: string) => void;
    removeProperty: (id: string) => void;
    removeLiability: (id: string) => void;
    formatCurrency: (value: number) => string;
}

const ManageDataPage: React.FC<ManageDataPageProps> = (props) => {
    const { formatCurrency } = props;
    const [activeTab, setActiveTab] = useState('Cash Accounts');
    const tabs = ['Cash Accounts', 'Properties', 'Liabilities'];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [editingItemType, setEditingItemType] = useState<ItemType | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ item: Item; type: ItemType; removeFn: (id: string) => void } | null>(null);


    const [formState, setFormState] = useState({
        cashName: '', cashBalance: '',
        propName: '', propValue: '',
        liaName: '', liaBalance: '', liaRate: ''
    });

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormState({...formState, [e.target.name]: e.target.value });
    };

    const handleEditClick = (item: Item, type: ItemType) => {
        setEditingItem({ ...item });
        setEditingItemType(type);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setEditingItemType(null);
    };

    const handleModalSave = () => {
        if (!editingItem || !editingItemType) return;
        
        switch (editingItemType) {
            case 'cash': props.updateCashAccount(editingItem as CashAccount); break;
            case 'property': props.updateProperty(editingItem as Property); break;
            case 'liability': props.updateLiability(editingItem as Liability); break;
        }
        handleModalClose();
    };
    
    const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingItem) return;
        const { name, value } = e.target;
        setEditingItem(prev => prev ? { ...prev, [name]: name === 'name' ? value : parseFloat(value) || 0 } : null);
    };

    const handleConfirmDelete = () => {
        if (itemToDelete) {
            itemToDelete.removeFn(itemToDelete.item.id);
            setItemToDelete(null);
        }
    };

    const inputClasses = "block w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500";
    const btnPrimaryClasses = "text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
    const btnSecondaryClasses = "text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 transition-colors";
    const btnDangerClasses = "text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 transition-colors";


    const renderAddForm = () => {
        switch (activeTab) {
            case 'Cash Accounts':
                return (
                    <form onSubmit={(e) => { e.preventDefault(); props.addCashAccount({ name: formState.cashName, balance: parseFloat(formState.cashBalance) }); setFormState(s => ({...s, cashName: '', cashBalance: ''}))}} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <input name="cashName" type="text" placeholder="Account Name" value={formState.cashName} onChange={handleFormChange} required className={inputClasses} />
                        <input name="cashBalance" type="number" placeholder="Balance" value={formState.cashBalance} onChange={handleFormChange} required className={inputClasses} />
                        <button type="submit" className={btnPrimaryClasses}>Add Account</button>
                    </form>
                );
             case 'Properties':
                return (
                    <form onSubmit={(e) => { e.preventDefault(); props.addProperty({ name: formState.propName, currentValue: parseFloat(formState.propValue) }); setFormState(s=>({...s, propName: '', propValue: ''})) }} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <input name="propName" type="text" placeholder="Property Name" value={formState.propName} onChange={handleFormChange} required className={inputClasses} />
                        <input name="propValue" type="number" placeholder="Current Value" value={formState.propValue} onChange={handleFormChange} required className={inputClasses} />
                        <button type="submit" className={btnPrimaryClasses}>Add Property</button>
                    </form>
                );
            case 'Liabilities':
                return (
                     <form onSubmit={(e) => { e.preventDefault(); props.addLiability({ name: formState.liaName, outstandingBalance: parseFloat(formState.liaBalance), interestRate: parseFloat(formState.liaRate) }); setFormState(s=>({...s, liaName: '', liaBalance: '', liaRate: ''}))}} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <input name="liaName" type="text" placeholder="Loan Name" value={formState.liaName} onChange={handleFormChange} required className={inputClasses} />
                        <input name="liaBalance" type="number" placeholder="Outstanding Balance" value={formState.liaBalance} onChange={handleFormChange} required className={inputClasses} />
                        <input name="liaRate" type="number" placeholder="Interest Rate (%)" value={formState.liaRate} onChange={handleFormChange} required className={inputClasses} />
                        <button type="submit" className={btnPrimaryClasses}>Add Liability</button>
                    </form>
                );
            default: return null;
        }
    };
    
    const renderTable = () => {
        const renderBody = () => {
            switch (activeTab) {
                case 'Cash Accounts': return props.cashAccounts.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50"><td>{item.name}</td><td className="text-right">{formatCurrency(item.balance)}</td>{commonActions(item, 'cash', props.removeCashAccount)}</tr>
                ));
                case 'Properties': return props.properties.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50"><td>{item.name}</td><td className="text-right">{formatCurrency(item.currentValue)}</td>{commonActions(item, 'property', props.removeProperty)}</tr>
                ));
                case 'Liabilities': return props.liabilities.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50"><td>{item.name}</td><td className="text-right">{formatCurrency(item.outstandingBalance)}</td><td className="text-right">{item.interestRate.toFixed(2)}%</td>{commonActions(item, 'liability', props.removeLiability)}</tr>
                ));
                default: return null;
            }
        };

        const renderHead = () => {
             switch (activeTab) {
                case 'Cash Accounts': return <tr><th>Name</th><th className="text-right">Balance</th><th className="text-right">Actions</th></tr>;
                case 'Properties': return <tr><th>Name</th><th className="text-right">Current Value</th><th className="text-right">Actions</th></tr>;
                case 'Liabilities': return <tr><th>Name</th><th className="text-right">Balance</th><th className="text-right">Rate</th><th className="text-right">Actions</th></tr>;
                default: return null;
            }
        };

        return (<table className="w-full text-left table-auto" data-testid="manage-data-table"><thead className="text-xs text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">{renderHead()}</thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">{renderBody()}</tbody></table>);
    };

    const commonActions = (item: Item, type: ItemType, removeFn: (id: string) => void) => (
        <td className="px-4 py-2 text-right">
            <div className="flex justify-end items-center space-x-2">
                <button onClick={() => handleEditClick(item, type)} className={`${btnSecondaryClasses} w-auto text-xs py-1 px-2`}>Edit</button>
                <button onClick={() => setItemToDelete({ item, type, removeFn })} className={`${btnDangerClasses} w-auto text-xs py-1 px-2`}>Delete</button>
            </div>
        </td>
    );

    const renderModalContent = () => {
        if (!editingItem) return null;
        switch (editingItemType) {
            case 'cash': return <><label className="block"><span className="text-gray-400">Name</span><input type="text" name="name" value={(editingItem as CashAccount).name} onChange={handleModalInputChange} className={`${inputClasses} mt-1`} /></label><label className="block mt-4"><span className="text-gray-400">Balance</span><input type="number" name="balance" value={(editingItem as CashAccount).balance} onChange={handleModalInputChange} className={`${inputClasses} mt-1`} /></label></>;
            case 'property': return <><label className="block"><span className="text-gray-400">Name</span><input type="text" name="name" value={(editingItem as Property).name} onChange={handleModalInputChange} className={`${inputClasses} mt-1`} /></label><label className="block mt-4"><span className="text-gray-400">Current Value</span><input type="number" name="currentValue" value={(editingItem as Property).currentValue} onChange={handleModalInputChange} className={`${inputClasses} mt-1`} /></label></>;
            case 'liability': return <><label className="block"><span className="text-gray-400">Name</span><input type="text" name="name" value={(editingItem as Liability).name} onChange={handleModalInputChange} className={`${inputClasses} mt-1`} /></label><label className="block mt-4"><span className="text-gray-400">Outstanding Balance</span><input type="number" name="outstandingBalance" value={(editingItem as Liability).outstandingBalance} onChange={handleModalInputChange} className={`${inputClasses} mt-1`} /></label><label className="block mt-4"><span className="text-gray-400">Interest Rate (%)</span><input type="number" name="interestRate" value={(editingItem as Liability).interestRate} onChange={handleModalInputChange} className={`${inputClasses} mt-1`} /></label></>;
            default: return null;
        }
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Data</h1>
                <p className="text-gray-500 dark:text-gray-400">Add, edit, or delete your foundational financial data.</p>
            </header>
            <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
                {tabs.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === tab ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                        {tab}
                    </button>
                ))}
            </div>

            <Card title={`Manage ${activeTab}`}>
                <div className="space-y-6">
                    <div><h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Add New</h3>{renderAddForm()}</div>
                    <div><h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Existing Entries</h3><div className="overflow-x-auto">{renderTable()}</div></div>
                </div>
            </Card>

            <DebtPayoffPlanner liabilities={props.liabilities} budgetItems={props.budgetItems} formatCurrency={formatCurrency} />

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={handleModalClose}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit {editingItemType?.replace(/^\w/, c => c.toUpperCase())}</h3>
                        <div className="space-y-4">{renderModalContent()}</div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button type="button" onClick={handleModalClose} className={`${btnSecondaryClasses} w-auto`}>Cancel</button>
                            <button type="button" onClick={handleModalSave} className={`${btnPrimaryClasses} w-auto`}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleConfirmDelete}
                title={`Delete ${itemToDelete?.type}`}
                message={`Are you sure you want to delete "${itemToDelete?.item.name}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default ManageDataPage;