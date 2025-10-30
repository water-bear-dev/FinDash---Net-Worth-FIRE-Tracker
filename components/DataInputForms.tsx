
import React, { useState } from 'react';
// FIX: Import AssetCategory to be used for default values.
import { CashAccount, Investment, Property, Liability, AssetCategory } from '../types';

interface DataInputFormsProps {
  addCashAccount: (account: Omit<CashAccount, 'id'>) => void;
  addInvestment: (investment: Omit<Investment, 'id'>) => void;
  addProperty: (property: Omit<Property, 'id'>) => void;
  addLiability: (liability: Omit<Liability, 'id'>) => void;
}

export const DataInputForms: React.FC<DataInputFormsProps> = ({
  addCashAccount,
  addInvestment,
  addProperty,
  addLiability,
}) => {
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

  const handleAddCash = (e: React.FormEvent) => {
    e.preventDefault();
    if (cashName && cashBalance) {
      addCashAccount({ name: cashName, balance: parseFloat(cashBalance) });
      setCashName('');
      setCashBalance('');
    }
  };

  const handleAddInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    if (invTicker && invQty && invCost) {
      // FIX: Add missing 'currentValue' and 'category' properties.
      addInvestment({
        ticker: invTicker.toUpperCase(),
        quantity: parseFloat(invQty),
        costBasisPerUnit: parseFloat(invCost),
        currentValue: parseFloat(invQty) * parseFloat(invCost),
        category: AssetCategory.Stock,
      });
      setInvTicker('');
      setInvQty('');
      setInvCost('');
    }
  };
  
  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (propName && propValue) {
      // FIX: Add missing 'category' property.
      addProperty({ name: propName, currentValue: parseFloat(propValue), category: AssetCategory.Property });
      setPropName('');
      setPropValue('');
    }
  };
  
  const handleAddLiability = (e: React.FormEvent) => {
    e.preventDefault();
    if (liaName && liaBalance && liaRate) {
      addLiability({
        name: liaName,
        outstandingBalance: parseFloat(liaBalance),
        interestRate: parseFloat(liaRate),
      });
      setLiaName('');
      setLiaBalance('');
      setLiaRate('');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddCash} className="space-y-2">
        <h3 className="font-semibold text-gray-300">Add Cash Account</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input type="text" placeholder="Account Name" value={cashName} onChange={(e) => setCashName(e.target.value)} className="input-field" />
          <input type="number" placeholder="Balance" value={cashBalance} onChange={(e) => setCashBalance(e.target.value)} className="input-field" />
          <button type="submit" className="btn-primary">Add Cash</button>
        </div>
      </form>
      <hr className="border-gray-700"/>
      <form onSubmit={handleAddInvestment} className="space-y-2">
        <h3 className="font-semibold text-gray-300">Add Investment</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input type="text" placeholder="Ticker (e.g., VGS)" value={invTicker} onChange={(e) => setInvTicker(e.target.value)} className="input-field" />
          <input type="number" placeholder="Quantity" value={invQty} onChange={(e) => setInvQty(e.target.value)} className="input-field" />
          <input type="number" placeholder="Cost Basis / Unit" value={invCost} onChange={(e) => setInvCost(e.target.value)} className="input-field" />
          <button type="submit" className="btn-primary">Add Investment</button>
        </div>
      </form>
       <hr className="border-gray-700"/>
      <form onSubmit={handleAddProperty} className="space-y-2">
        <h3 className="font-semibold text-gray-300">Add Property / Other Asset</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input type="text" placeholder="Asset Name" value={propName} onChange={(e) => setPropName(e.target.value)} className="input-field" />
          <input type="number" placeholder="Current Value" value={propValue} onChange={(e) => setPropValue(e.target.value)} className="input-field" />
          <button type="submit" className="btn-primary">Add Property</button>
        </div>
      </form>
      <hr className="border-gray-700"/>
      <form onSubmit={handleAddLiability} className="space-y-2">
        <h3 className="font-semibold text-gray-300">Add Liability</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input type="text" placeholder="Loan Name" value={liaName} onChange={(e) => setLiaName(e.target.value)} className="input-field" />
          <input type="number" placeholder="Balance" value={liaBalance} onChange={(e) => setLiaBalance(e.target.value)} className="input-field" />
          <input type="number" placeholder="Interest Rate (%)" value={liaRate} onChange={(e) => setLiaRate(e.target.value)} className="input-field" />
          <button type="submit" className="btn-primary">Add Liability</button>
        </div>
      </form>
    </div>
  );
};