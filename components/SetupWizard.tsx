import React, { useState } from 'react';
import { UserProfile, CashAccount, Property, Liability, AssetCategory } from '../types';

interface SetupWizardProps {
    onComplete: (data: {
        userProfile: UserProfile;
        cashAccounts: CashAccount[];
        properties: Property[];
        liabilities: Liability[];
        targetAnnualSpending: number;
    }) => void;
    onSkip: () => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onSkip }) => {
    const [step, setStep] = useState(1);
    const [profile, setProfile] = useState<UserProfile>({ name: '', email: '' });
    const [cash, setCash] = useState<CashAccount[]>([]);
    const [props, setProps] = useState<Property[]>([]);
    const [liabilities, setLiabilities] = useState<Liability[]>([]);
    const [spending, setSpending] = useState(60000);
    const [currency, setCurrency] = useState('USD');

    // Temp form states
    const [tempName, setTempName] = useState('');
    const [tempVal, setTempVal] = useState('');

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    const handleFinish = () => {
        onComplete({
            userProfile: profile,
            cashAccounts: cash,
            properties: props,
            liabilities,
            targetAnnualSpending: spending,
            currency,
        });
    };

    const inputClasses = "block w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500";
    const btnPrimaryClasses = "text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100";
    const btnSecondaryClasses = "text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-700 transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="my-8 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-300">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-cyan-500/10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to FinDash</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Let's set up your financial universe.</p>
                    </div>
                    <button 
                        onClick={onSkip}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-medium hover:underline transition-all"
                    >
                        Skip for now
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800">
                    <div 
                        className="h-full bg-indigo-600 transition-all duration-500" 
                        style={{ width: `${(step / 5) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="p-8 min-h-[400px] flex flex-col">
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-2 mx-auto">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </div>
                                <h3 className="text-xl font-semibold dark:text-white">Profile & Currency</h3>
                                <p className="text-sm text-gray-500">How should we address you and display values?</p>
                            </div>
                            <div className="space-y-4 max-w-md mx-auto">
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Full Name <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={profile.name} 
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        placeholder="e.g. Satoshi Nakamoto"
                                        className={inputClasses} 
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Currency</label>
                                    <select 
                                        value={currency} 
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className={inputClasses}
                                    >
                                        <option value="USD">USD - United States Dollar</option>
                                        <option value="EUR">EUR - Euro</option>
                                        <option value="GBP">GBP - British Pound</option>
                                        <option value="JPY">JPY - Japanese Yen</option>
                                        <option value="AUD">AUD - Australian Dollar</option>
                                        <option value="CAD">CAD - Canadian Dollar</option>
                                        <option value="CHF">CHF - Swiss Franc</option>
                                        <option value="CNY">CNY - Chinese Yuan</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Email (Optional)</label>
                                    <input 
                                        type="email" 
                                        value={profile.email} 
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                        placeholder="satoshi@bitcoin.org"
                                        className={inputClasses} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-2 mx-auto">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <h3 className="text-xl font-semibold dark:text-white">Cash & Bank Accounts</h3>
                                <p className="text-sm text-gray-500">Add your checking, savings, or emergency fund.</p>
                            </div>
                            
                            <div className="flex gap-2 max-w-md mx-auto">
                                <input type="text" placeholder="Account Name" value={tempName} onChange={(e) => setTempName(e.target.value)} className={inputClasses} />
                                <input type="number" placeholder="Balance" value={tempVal} onChange={(e) => setTempVal(e.target.value)} className={inputClasses} />
                                <button 
                                    onClick={() => {
                                        if (tempName && tempVal) {
                                            setCash([...cash, { id: Date.now().toString(), name: tempName, balance: parseFloat(tempVal) }]);
                                            setTempName('');
                                            setTempVal('');
                                        }
                                    }}
                                    className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                </button>
                            </div>

                            <div className="max-w-md mx-auto space-y-2 mt-4 overflow-y-auto max-h-[150px] pr-2">
                                {cash.map(acc => (
                                    <div key={acc.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <span className="font-medium dark:text-white">{acc.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-indigo-600 dark:text-indigo-400 font-mono">${acc.balance.toLocaleString()}</span>
                                            <button onClick={() => setCash(cash.filter(c => c.id !== acc.id))} className="text-red-400 hover:text-red-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {cash.length === 0 && <p className="text-center text-gray-400 text-xs italic">No accounts added yet.</p>}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2 mx-auto">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l-7 7-7-7M19 10v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                </div>
                                <h3 className="text-xl font-semibold dark:text-white">Properties & Large Assets</h3>
                                <p className="text-sm text-gray-500">Home value, vehicles, or physical gold.</p>
                            </div>
                            
                            <div className="flex gap-2 max-w-md mx-auto">
                                <input type="text" placeholder="Asset Name" value={tempName} onChange={(e) => setTempName(e.target.value)} className={inputClasses} />
                                <input type="number" placeholder="Value" value={tempVal} onChange={(e) => setTempVal(e.target.value)} className={inputClasses} />
                                <button 
                                    onClick={() => {
                                        if (tempName && tempVal) {
                                            setProps([...props, { id: Date.now().toString(), name: tempName, currentValue: parseFloat(tempVal), category: AssetCategory.Property }]);
                                            setTempName('');
                                            setTempVal('');
                                        }
                                    }}
                                    className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                </button>
                            </div>

                            <div className="max-w-md mx-auto space-y-2 mt-4 overflow-y-auto max-h-[150px] pr-2">
                                {props.map(p => (
                                    <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <span className="font-medium dark:text-white">{p.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-indigo-600 dark:text-indigo-400 font-mono">${p.currentValue.toLocaleString()}</span>
                                            <button onClick={() => setProps(props.filter(item => item.id !== p.id))} className="text-red-400 hover:text-red-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {props.length === 0 && <p className="text-center text-gray-400 text-xs italic">No properties added yet.</p>}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-2 mx-auto">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <h3 className="text-xl font-semibold dark:text-white">Debts & Liabilities</h3>
                                <p className="text-sm text-gray-500">Mortgage, car loans, or credit card debt.</p>
                            </div>
                            
                            <div className="flex gap-2 max-w-md mx-auto">
                                <input type="text" placeholder="Loan Name" value={tempName} onChange={(e) => setTempName(e.target.value)} className={inputClasses} />
                                <input type="number" placeholder="Balance" value={tempVal} onChange={(e) => setTempVal(e.target.value)} className={inputClasses} />
                                <button 
                                    onClick={() => {
                                        if (tempName && tempVal) {
                                            setLiabilities([...liabilities, { id: Date.now().toString(), name: tempName, outstandingBalance: parseFloat(tempVal), interestRate: 0 }]);
                                            setTempName('');
                                            setTempVal('');
                                        }
                                    }}
                                    className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                </button>
                            </div>

                            <div className="max-w-md mx-auto space-y-2 mt-4 overflow-y-auto max-h-[150px] pr-2">
                                {liabilities.map(l => (
                                    <div key={l.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <span className="font-medium dark:text-white">{l.name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-red-600 dark:text-red-400 font-mono">${l.outstandingBalance.toLocaleString()}</span>
                                            <button onClick={() => setLiabilities(liabilities.filter(item => item.id !== l.id))} className="text-red-400 hover:text-red-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {liabilities.length === 0 && <p className="text-center text-gray-400 text-xs italic">No liabilities added yet.</p>}
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 mb-2 mx-auto">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>
                                </div>
                                <h3 className="text-xl font-semibold dark:text-white">FIRE Goal</h3>
                                <p className="text-sm text-gray-500">What is your target annual spending in retirement?</p>
                            </div>
                            
                            <div className="max-w-md mx-auto space-y-4">
                                <input 
                                    type="number" 
                                    value={spending} 
                                    onChange={(e) => setSpending(parseFloat(e.target.value))} 
                                    className={`${inputClasses} text-center text-xl font-bold py-4`} 
                                />
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
                                    <p className="text-center text-sm text-indigo-700 dark:text-indigo-300">
                                        Based on the 4% rule, your target FI number is:
                                        <span className="block text-2xl font-black mt-1">${(spending * 25).toLocaleString()}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-auto pt-8 flex justify-between items-center">
                        {step > 1 ? (
                            <button onClick={prevStep} className={btnSecondaryClasses}>Back</button>
                        ) : <div />}
                        
                        {step < 5 ? (
                            <button 
                                onClick={nextStep} 
                                disabled={step === 1 && !profile.name.trim()}
                                className={btnPrimaryClasses}
                            >
                                Next Step
                            </button>
                        ) : (
                            <button onClick={handleFinish} className={`${btnPrimaryClasses} bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700`}>
                                Finish Setup
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetupWizard;
