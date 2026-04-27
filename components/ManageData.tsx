import React, { useState, useEffect } from 'react';
// FIX: Import AssetCategory to be used for default values.
import { CashAccount, Investment, Property, Liability, AssetCategory } from '../types';
import Card from './Card';

type Item = CashAccount | Investment | Property | Liability;
type ItemType = 'cash' | 'investment' | 'property' | 'liability';

interface ManageDataProps {
    cashAccounts: CashAccount[];
    investments: Investment[];
    properties: Property[];
    liabilities: Liability[];
    addCashAccount: (account: Omit<CashAccount, 'id'>) => void;
    addInvestment: (investment: Omit<Investment, 'id'>) => void;
    addProperty: (property: Omit<Property, 'id'>) => void;
    addLiability: (liability: Omit<Liability, 'id'>) => void;
    updateCashAccount: (account: CashAccount) => void;
    updateInvestment: (investment: Investment) => void;
    updateProperty: (property: Property) => void;
    updateLiability: (liability: Liability) => void;
    removeCashAccount: (id: string) => void;
    removeInvestment: (id: string) => void;
    removeProperty: (id: string) => void;
    removeLiability: (id: string) => void;
    formatCurrency: (value: number) => string;
}

const ManageData: React.FC<ManageDataProps> = (props) => {
    const { formatCurrency } = props;
    const [activeTab, setActiveTab] = useState('Cash Accounts');
    const tabs = ['Cash Accounts', 'Investments', 'Properties', 'Liabilities'];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [editingItemType, setEditingItemType] = useState<ItemType | null>(null);

    // Form states for adding new items
    const [cashName, setCashName] = useState('');
    const [cashBalance, setCashBalance] = useState('');
    const [invTicker, setInvTicker] = useState('');
    const [invQty, setInvQty] = useState('');
    const [invCost, setInvCost] = useState('');
    const [propName, setPropName] = useState('');
    const [propValue, setPropValue] = useState('');
    const [liaName, setLiaName] = useState('');
    const [liaBalance, setLiaBalance] = useState('');
    const [liaRate, setLiaRate] = useState('');

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
            case 'cash':
                props.updateCashAccount(editingItem as CashAccount);
                break;
            case 'investment':
                props.updateInvestment(editingItem as Investment);
                break;
            case 'property':
                props.updateProperty(editingItem as Property);
                break;
            case 'liability':
                props.updateLiability(editingItem as Liability);
                break;
        }
        handleModalClose();
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingItem) return;
        const { name, value } = e.target;
        setEditingItem(prev => prev ? { ...prev, [name]: name === 'name' || name === 'ticker' ? value : parseFloat(value) || 0 } : null);
    };

    const renderAddForm = () => {
        const inputClasses = "w-full p-2.5 bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition-all";
        const labelClass = "block mb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider";
        const asterisk = <span className="text-red-500 ml-0.5">*</span>;

        switch (activeTab) {
            case 'Cash Accounts':
                return (
                    <form onSubmit={(e) => { e.preventDefault(); props.addCashAccount({ name: cashName, balance: parseFloat(cashBalance) }); setCashName(''); setCashBalance(''); }} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-gray-800/40 border border-gray-700 rounded-xl mb-6 shadow-sm">
                        <div>
                            <label className={labelClass}>Account Name {asterisk}</label>
                            <input type="text" placeholder="e.g. My Savings" value={cashName} onChange={e => setCashName(e.target.value)} required className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClass}>Initial Balance {asterisk}</label>
                            <input type="number" placeholder="0.00" value={cashBalance} onChange={e => setCashBalance(e.target.value)} required className={inputClasses} />
                        </div>
                        <div className="flex items-end">
                            <button type="submit" className="w-full text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg text-sm px-5 py-2.5 transition-all shadow-lg shadow-indigo-500/10 active:scale-95">Add Account</button>
                        </div>
                    </form>
                );
            case 'Investments':
                return (
                    <form onSubmit={(e) => { e.preventDefault(); props.addInvestment({ ticker: invTicker.toUpperCase(), quantity: parseFloat(invQty), costBasisPerUnit: parseFloat(invCost), category: AssetCategory.Stock, currentValue: parseFloat(invQty) * parseFloat(invCost) }); setInvTicker(''); setInvQty(''); setInvCost(''); }} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-gray-800/40 border border-gray-700 rounded-xl mb-6 shadow-sm">
                        <div>
                            <label className={labelClass}>Ticker {asterisk}</label>
                            <input type="text" placeholder="e.g. VOO" value={invTicker} onChange={e => setInvTicker(e.target.value)} required className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClass}>Quantity {asterisk}</label>
                            <input type="number" placeholder="0.00" value={invQty} onChange={e => setInvQty(e.target.value)} required className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClass}>Cost / Unit {asterisk}</label>
                            <input type="number" placeholder="0.00" value={invCost} onChange={e => setInvCost(e.target.value)} required className={inputClasses} />
                        </div>
                        <div className="flex items-end">
                            <button type="submit" className="w-full text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg text-sm px-5 py-2.5 transition-all shadow-lg shadow-indigo-500/10 active:scale-95">Add Investment</button>
                        </div>
                    </form>
                );
             case 'Properties':
                return (
                    <form onSubmit={(e) => { e.preventDefault(); props.addProperty({ name: propName, currentValue: parseFloat(propValue), category: AssetCategory.Property }); setPropName(''); setPropValue(''); }} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-gray-800/40 border border-gray-700 rounded-xl mb-6 shadow-sm">
                        <div>
                            <label className={labelClass}>Property Name {asterisk}</label>
                            <input type="text" placeholder="e.g. My House" value={propName} onChange={e => setPropName(e.target.value)} required className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClass}>Current Value {asterisk}</label>
                            <input type="number" placeholder="0.00" value={propValue} onChange={e => setPropValue(e.target.value)} required className={inputClasses} />
                        </div>
                        <div className="flex items-end">
                            <button type="submit" className="w-full text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg text-sm px-5 py-2.5 transition-all shadow-lg shadow-indigo-500/10 active:scale-95">Add Property</button>
                        </div>
                    </form>
                );
            case 'Liabilities':
                return (
                     <form onSubmit={(e) => { e.preventDefault(); props.addLiability({ name: liaName, outstandingBalance: parseFloat(liaBalance), interestRate: parseFloat(liaRate) }); setLiaName(''); setLiaBalance(''); setLiaRate(''); }} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-gray-800/40 border border-gray-700 rounded-xl mb-6 shadow-sm">
                        <div>
                            <label className={labelClass}>Loan Name {asterisk}</label>
                            <input type="text" placeholder="e.g. Mortgage" value={liaName} onChange={e => setLiaName(e.target.value)} required className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClass}>Balance {asterisk}</label>
                            <input type="number" placeholder="0.00" value={liaBalance} onChange={e => setLiaBalance(e.target.value)} required className={inputClasses} />
                        </div>
                        <div>
                            <label className={labelClass}>Interest Rate (%) {asterisk}</label>
                            <input type="number" placeholder="e.g. 5.5" value={liaRate} onChange={e => setLiaRate(e.target.value)} required className={inputClasses} />
                        </div>
                        <div className="flex items-end">
                            <button type="submit" className="w-full text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-sm px-5 py-2.5 transition-all shadow-lg shadow-red-500/10 active:scale-95">Add Liability</button>
                        </div>
                    </form>
                );
            default: return null;
        }
    };
    
    const renderTable = () => {
        const commonActions = (item: Item, type: ItemType, removeFn: (id: string) => void) => (
            <td className="px-4 py-3 text-right w-1/4">
                <div className="flex justify-end items-center space-x-3">
                    <button onClick={() => handleEditClick(item, type)} className="text-xs font-semibold bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white py-1.5 px-3 rounded-lg transition-all">Edit</button>
                    <button onClick={() => removeFn(item.id)} className="text-xs font-semibold bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white py-1.5 px-3 rounded-lg transition-all">Delete</button>
                </div>
            </td>
        );

        const renderBody = () => {
            switch (activeTab) {
                case 'Cash Accounts': return props.cashAccounts.map(item => (
                    <tr key={item.id} className="hover:bg-gray-700/30 transition-colors border-b border-gray-700/50">
                        <td className="px-4 py-4 w-1/2 font-medium text-gray-200">{item.name}</td>
                        <td className="px-4 py-4 w-1/4 text-right font-mono text-green-400">{formatCurrency(item.balance)}</td>
                        {commonActions(item, 'cash', props.removeCashAccount)}
                    </tr>
                ));
                case 'Investments': return props.investments.map(item => (
                    <tr key={item.id} className="hover:bg-gray-700/30 transition-colors border-b border-gray-700/50">
                        <td className="px-4 py-4 w-1/4 font-bold text-indigo-400">{item.ticker}</td>
                        <td className="px-4 py-4 w-1/4 text-right text-gray-300">{item.quantity}</td>
                        <td className="px-4 py-4 w-1/4 text-right font-mono text-gray-300">{formatCurrency(item.costBasisPerUnit)}</td>
                        {commonActions(item, 'investment', props.removeInvestment)}
                    </tr>
                ));
                case 'Properties': return props.properties.map(item => (
                    <tr key={item.id} className="hover:bg-gray-700/30 transition-colors border-b border-gray-700/50">
                        <td className="px-4 py-4 w-1/2 font-medium text-gray-200">{item.name}</td>
                        <td className="px-4 py-4 w-1/4 text-right font-mono text-indigo-400">{formatCurrency(item.currentValue)}</td>
                        {commonActions(item, 'property', props.removeProperty)}
                    </tr>
                ));
                case 'Liabilities': return props.liabilities.map(item => (
                    <tr key={item.id} className="hover:bg-gray-700/30 transition-colors border-b border-gray-700/50">
                        <td className="px-4 py-4 w-1/2 font-medium text-gray-200">{item.name}</td>
                        <td className="px-4 py-4 w-1/4 text-right font-mono text-red-400">{formatCurrency(item.outstandingBalance)}</td>
                        <td className="px-4 py-4 w-1/8 text-right text-gray-400">{item.interestRate.toFixed(2)}%</td>
                        {commonActions(item, 'liability', props.removeLiability)}
                    </tr>
                ));
                default: return null;
            }
        };

        const renderHead = () => {
             switch (activeTab) {
                case 'Cash Accounts': return <tr><th className="px-4 py-3 w-1/2">Name</th><th className="px-4 py-3 w-1/4 text-right">Balance</th><th className="px-4 py-3 w-1/4 text-right">Actions</th></tr>;
                case 'Investments': return <tr><th className="px-4 py-3 w-1/4">Ticker</th><th className="px-4 py-3 w-1/4 text-right">Quantity</th><th className="px-4 py-3 w-1/4 text-right">Cost/Unit</th><th className="px-4 py-3 w-1/4 text-right">Actions</th></tr>;
                case 'Properties': return <tr><th className="px-4 py-3 w-1/2">Name</th><th className="px-4 py-3 w-1/4 text-right">Current Value</th><th className="px-4 py-3 w-1/4 text-right">Actions</th></tr>;
                case 'Liabilities': return <tr><th className="px-4 py-3 w-1/2">Name</th><th className="px-4 py-3 w-1/4 text-right">Balance</th><th className="px-4 py-3 w-1/8 text-right">Rate</th><th className="px-4 py-3 w-1/4 text-right">Actions</th></tr>;
                default: return null;
            }
        };

        return (
            <div className="overflow-hidden rounded-xl border border-gray-700">
                <table className="w-full text-left table-fixed border-collapse">
                    <thead className="text-[10px] font-bold text-gray-400 uppercase bg-gray-800/50 border-b border-gray-700">
                        {renderHead()}
                    </thead>
                    <tbody className="bg-gray-800/20">
                        {renderBody()}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderModalContent = () => {
        if (!editingItem) return null;

        const commonFields = <div className="space-y-4">
            <label className="block">
                <span className="text-gray-400">{editingItemType === 'investment' ? 'Ticker' : 'Name'}</span>
                <input type="text" name={editingItemType === 'investment' ? 'ticker' : 'name'} value={(editingItem as any).name || (editingItem as any).ticker} onChange={handleInputChange} className="input-field mt-1" />
            </label>
        </div>;

        switch (editingItemType) {
            case 'cash': return <> {commonFields} <label className="block mt-4"><span className="text-gray-400">Balance</span><input type="number" name="balance" value={(editingItem as CashAccount).balance} onChange={handleInputChange} className="input-field mt-1" /></label></>;
            case 'investment': return <> {commonFields}
                <label className="block mt-4"><span className="text-gray-400">Quantity</span><input type="number" name="quantity" value={(editingItem as Investment).quantity} onChange={handleInputChange} className="input-field mt-1" /></label>
                <label className="block mt-4"><span className="text-gray-400">Cost Basis / Unit</span><input type="number" name="costBasisPerUnit" value={(editingItem as Investment).costBasisPerUnit} onChange={handleInputChange} className="input-field mt-1" /></label>
            </>;
            case 'property': return <> {commonFields} <label className="block mt-4"><span className="text-gray-400">Current Value</span><input type="number" name="currentValue" value={(editingItem as Property).currentValue} onChange={handleInputChange} className="input-field mt-1" /></label></>;
            case 'liability': return <> {commonFields}
                <label className="block mt-4"><span className="text-gray-400">Outstanding Balance</span><input type="number" name="outstandingBalance" value={(editingItem as Liability).outstandingBalance} onChange={handleInputChange} className="input-field mt-1" /></label>
                <label className="block mt-4"><span className="text-gray-400">Interest Rate (%)</span><input type="number" name="interestRate" value={(editingItem as Liability).interestRate} onChange={handleInputChange} className="input-field mt-1" /></label>
            </>;
            default: return null;
        }
    }

    return (
        <div>
            <div className="mb-6 flex space-x-1 border-b border-gray-700">
                {tabs.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === tab ? 'bg-gray-800 text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:bg-gray-700/50'}`}>
                        {tab}
                    </button>
                ))}
            </div>

            <Card title={`Manage ${activeTab}`}>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Add New</h3>
                        {renderAddForm()}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Existing Entries</h3>
                        {renderTable()}
                    </div>
                </div>
            </Card>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 transition-opacity duration-300" onClick={handleModalClose}>
                    <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4 text-white">Edit {editingItemType?.replace(/^\w/, c => c.toUpperCase())}</h3>
                        <div className="space-y-4">
                           {renderModalContent()}
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button type="button" onClick={handleModalClose} className="btn-secondary" style={{width: 'auto'}}>Cancel</button>
                            <button type="button" onClick={handleModalSave} className="btn-primary" style={{width: 'auto'}}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageData;