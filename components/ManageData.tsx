import React, { useState, useEffect } from 'react';
import { CashAccount, Investment, Property, Liability } from '../types';
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
        switch (activeTab) {
            case 'Cash Accounts':
                return (
                    <form onSubmit={(e) => { e.preventDefault(); props.addCashAccount({ name: cashName, balance: parseFloat(cashBalance) }); setCashName(''); setCashBalance(''); }} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-4 bg-gray-700/50 rounded-lg">
                        <input type="text" placeholder="Account Name" value={cashName} onChange={e => setCashName(e.target.value)} required className="input-field" />
                        <input type="number" placeholder="Balance" value={cashBalance} onChange={e => setCashBalance(e.target.value)} required className="input-field" />
                        <button type="submit" className="btn-primary">Add Account</button>
                    </form>
                );
            case 'Investments':
                return (
                     <form onSubmit={(e) => { e.preventDefault(); props.addInvestment({ ticker: invTicker.toUpperCase(), quantity: parseFloat(invQty), costBasisPerUnit: parseFloat(invCost) }); setInvTicker(''); setInvQty(''); setInvCost(''); }} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-4 bg-gray-700/50 rounded-lg">
                        <input type="text" placeholder="Ticker" value={invTicker} onChange={e => setInvTicker(e.target.value)} required className="input-field" />
                        <input type="number" placeholder="Quantity" value={invQty} onChange={e => setInvQty(e.target.value)} required className="input-field" />
                        <input type="number" placeholder="Cost Basis / Unit" value={invCost} onChange={e => setInvCost(e.target.value)} required className="input-field" />
                        <button type="submit" className="btn-primary">Add Investment</button>
                    </form>
                );
             case 'Properties':
                return (
                    <form onSubmit={(e) => { e.preventDefault(); props.addProperty({ name: propName, currentValue: parseFloat(propValue) }); setPropName(''); setPropValue(''); }} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-4 bg-gray-700/50 rounded-lg">
                        <input type="text" placeholder="Property Name" value={propName} onChange={e => setPropName(e.target.value)} required className="input-field" />
                        <input type="number" placeholder="Current Value" value={propValue} onChange={e => setPropValue(e.target.value)} required className="input-field" />
                        <button type="submit" className="btn-primary">Add Property</button>
                    </form>
                );
            case 'Liabilities':
                return (
                     <form onSubmit={(e) => { e.preventDefault(); props.addLiability({ name: liaName, outstandingBalance: parseFloat(liaBalance), interestRate: parseFloat(liaRate) }); setLiaName(''); setLiaBalance(''); setLiaRate(''); }} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-4 bg-gray-700/50 rounded-lg">
                        <input type="text" placeholder="Loan Name" value={liaName} onChange={e => setLiaName(e.target.value)} required className="input-field" />
                        <input type="number" placeholder="Outstanding Balance" value={liaBalance} onChange={e => setLiaBalance(e.target.value)} required className="input-field" />
                        <input type="number" placeholder="Interest Rate (%)" value={liaRate} onChange={e => setLiaRate(e.target.value)} required className="input-field" />
                        <button type="submit" className="btn-primary">Add Liability</button>
                    </form>
                );
            default: return null;
        }
    };
    
    const renderTable = () => {
        const commonActions = (item: Item, type: ItemType, removeFn: (id: string) => void) => (
            <td className="px-4 py-2 text-right">
                <div className="flex justify-end items-center space-x-2">
                    <button onClick={() => handleEditClick(item, type)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded">Edit</button>
                    <button onClick={() => removeFn(item.id)} className="text-xs bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded">Delete</button>
                </div>
            </td>
        );

        const renderBody = () => {
            switch (activeTab) {
                case 'Cash Accounts': return props.cashAccounts.map(item => (
                    <tr key={item.id}><td>{item.name}</td><td className="text-right">{formatCurrency(item.balance)}</td>{commonActions(item, 'cash', props.removeCashAccount)}</tr>
                ));
                case 'Investments': return props.investments.map(item => (
                    <tr key={item.id}><td>{item.ticker}</td><td className="text-right">{item.quantity}</td><td className="text-right">{formatCurrency(item.costBasisPerUnit)}</td>{commonActions(item, 'investment', props.removeInvestment)}</tr>
                ));
                case 'Properties': return props.properties.map(item => (
                    <tr key={item.id}><td>{item.name}</td><td className="text-right">{formatCurrency(item.currentValue)}</td>{commonActions(item, 'property', props.removeProperty)}</tr>
                ));
                case 'Liabilities': return props.liabilities.map(item => (
                    <tr key={item.id}><td>{item.name}</td><td className="text-right">{formatCurrency(item.outstandingBalance)}</td><td className="text-right">{item.interestRate.toFixed(2)}%</td>{commonActions(item, 'liability', props.removeLiability)}</tr>
                ));
                default: return null;
            }
        };

        const renderHead = () => {
             switch (activeTab) {
                case 'Cash Accounts': return <tr><th>Name</th><th className="text-right">Balance</th><th className="text-right">Actions</th></tr>;
                case 'Investments': return <tr><th>Ticker</th><th className="text-right">Quantity</th><th className="text-right">Cost/Unit</th><th className="text-right">Actions</th></tr>;
                case 'Properties': return <tr><th>Name</th><th className="text-right">Current Value</th><th className="text-right">Actions</th></tr>;
                case 'Liabilities': return <tr><th>Name</th><th className="text-right">Balance</th><th className="text-right">Rate</th><th className="text-right">Actions</th></tr>;
                default: return null;
            }
        };

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                        {renderHead()}
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {renderBody()?.map((row, index) => React.cloneElement(row, { className: 'hover:bg-gray-700/50' }))}
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
