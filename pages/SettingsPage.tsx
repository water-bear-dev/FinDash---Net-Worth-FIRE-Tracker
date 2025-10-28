

import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import Card from '../components/Card';

interface SettingsPageProps {
    userProfile: UserProfile;
    saveUserProfile: (profile: UserProfile) => void;
    fmpApiKey: string;
    saveFmpApiKey: (key: string) => void;
    targetAnnualSpending: number;
    saveTargetAnnualSpending: (value: number) => void;
    currency: string;
    saveCurrency: (currency: string) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ 
    userProfile, 
    saveUserProfile, 
    fmpApiKey, 
    saveFmpApiKey,
    targetAnnualSpending,
    saveTargetAnnualSpending,
    currency,
    saveCurrency,
}) => {
    const [profile, setProfile] = useState<UserProfile>(userProfile);
    const [apiKey, setApiKey] = useState(fmpApiKey);
    const [spending, setSpending] = useState(targetAnnualSpending);
    const [currentCurrency, setCurrentCurrency] = useState(currency);

    useEffect(() => { setProfile(userProfile); }, [userProfile]);
    useEffect(() => { setApiKey(fmpApiKey); }, [fmpApiKey]);
    useEffect(() => { setSpending(targetAnnualSpending); }, [targetAnnualSpending]);
    useEffect(() => { setCurrentCurrency(currency); }, [currency]);

    const handleProfileSubmit = (e: React.FormEvent) => { e.preventDefault(); saveUserProfile(profile); alert('Profile saved!'); };
    const handleApiSubmit = (e: React.FormEvent) => { e.preventDefault(); saveFmpApiKey(apiKey); alert('API Key saved!'); };
    const handleFireSubmit = (e: React.FormEvent) => { e.preventDefault(); saveTargetAnnualSpending(spending); alert('FIRE goal saved!'); };
    const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCurrency = e.target.value;
        setCurrentCurrency(newCurrency);
        saveCurrency(newCurrency);
    }
    
    const inputClasses = "block w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500";
    const btnPrimaryClasses = "text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage your profile and application settings.</p>
            </header>
            
            <Card title="User Profile">
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Name</label>
                        <input type="text" id="name" name="name" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Email</label>
                        <input type="email" id="email" name="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} className={inputClasses} />
                    </div>
                    <button type="submit" className={btnPrimaryClasses}>Save Profile</button>
                </form>
            </Card>

            <Card title="Regional Settings">
                <form>
                    <div>
                        <label htmlFor="currency" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Currency</label>
                        <select id="currency" name="currency" value={currentCurrency} onChange={handleCurrencyChange} className={inputClasses}>
                            <option value="USD">USD - United States Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="JPY">JPY - Japanese Yen</option>
                            <option value="AUD">AUD - Australian Dollar</option>
                            <option value="CAD">CAD - Canadian Dollar</option>
                            <option value="CHF">CHF - Swiss Franc</option>
                            <option value="CNY">CNY - Chinese Yuan</option>
                        </select>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            This will affect how all monetary values are displayed across the application.
                        </p>
                    </div>
                </form>
            </Card>

            <Card title="API Keys">
                 <form onSubmit={handleApiSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="fmpApiKey" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Financial Modeling Prep API Key</label>
                        <input type="password" id="fmpApiKey" name="fmpApiKey" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className={inputClasses} />
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Required to fetch live market prices for your investments. Get a free key from <a href="https://site.financialmodelingprep.com/developer/docs" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">FMP</a>.
                        </p>
                    </div>
                     <button type="submit" className={btnPrimaryClasses}>Save API Key</button>
                </form>
            </Card>
            
            <Card title="Financial Goals (FIRE)">
                 <form onSubmit={handleFireSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="targetAnnualSpending" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Target Annual Spending in Retirement</label>
                        <input type="number" id="targetAnnualSpending" name="targetAnnualSpending" value={spending} onChange={(e) => setSpending(Number(e.target.value))} className={inputClasses} />
                         <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                           Used to calculate your Financial Independence (FI) number, typically based on the 4% rule.
                        </p>
                    </div>
                     <button type="submit" className={btnPrimaryClasses}>Save Goal</button>
                </form>
            </Card>
        </div>
    );
};

export default SettingsPage;