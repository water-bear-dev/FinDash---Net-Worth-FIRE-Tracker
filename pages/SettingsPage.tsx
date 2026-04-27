

import React, { useState, useEffect } from 'react';
import { UserProfile, Transaction, BudgetItem } from '../types';
import Card from '../components/Card';
import { exportTransactionsToJSON, exportBudgetToJSON } from '../services/exportService';
import { getDirectoryHandle, saveDirectoryHandle, syncDataToDirectory, verifyPermission } from '../services/syncService';
import moment from 'moment';

interface SettingsPageProps {
    userProfile: UserProfile;
    saveUserProfile: (profile: UserProfile) => void;
    avApiKey: string;
    saveAvApiKey: (key: string) => void;
    isAvEnabled: boolean;
    saveIsAvEnabled: (enabled: boolean) => void;
    geminiApiKey: string;
    saveGeminiApiKey: (key: string) => void;
    isChatbotEnabled: boolean;
    saveIsChatbotEnabled: (enabled: boolean) => void;
    targetAnnualSpending: number;
    saveTargetAnnualSpending: (value: number) => void;
    currency: string;
    saveCurrency: (currency: string) => void;
}

const Switch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={enabled} onChange={(e) => onChange(e.target.checked)} />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
    </label>
);

const SettingsPage: React.FC<SettingsPageProps> = ({ 
    userProfile, 
    saveUserProfile, 
    avApiKey, 
    saveAvApiKey,
    isAvEnabled,
    saveIsAvEnabled,
    geminiApiKey,
    saveGeminiApiKey,
    isChatbotEnabled,
    saveIsChatbotEnabled,
    targetAnnualSpending,
    saveTargetAnnualSpending,
    currency,
    saveCurrency,
}) => {
    const [profile, setProfile] = useState<UserProfile>(userProfile);
    const [apiKey, setApiKey] = useState(avApiKey);
    const [avEnabled, setAvEnabled] = useState(isAvEnabled);
    const [spending, setSpending] = useState(targetAnnualSpending);
    const [geminiKey, setGeminiKey] = useState(geminiApiKey);
    const [chatbotEnabled, setChatbotEnabled] = useState(isChatbotEnabled);
    const [currentCurrency, setCurrentCurrency] = useState(currency);
    const [syncDirName, setSyncDirName] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(window.localStorage.getItem('lastSyncTime'));

    useEffect(() => { setProfile(userProfile); }, [userProfile]);
    useEffect(() => { setApiKey(avApiKey); }, [avApiKey]);
    useEffect(() => { setAvEnabled(isAvEnabled); }, [isAvEnabled]);
    useEffect(() => { setSpending(targetAnnualSpending); }, [targetAnnualSpending]);
    useEffect(() => { setGeminiKey(geminiApiKey); }, [geminiApiKey]);
    useEffect(() => { setChatbotEnabled(isChatbotEnabled); }, [isChatbotEnabled]);
    useEffect(() => { setCurrentCurrency(currency); }, [currency]);

    useEffect(() => {
        // Check if we have a saved directory handle
        getDirectoryHandle().then(handle => {
            if (handle) {
                setSyncDirName(handle.name);
            }
        }).catch(console.error);
    }, []);

    const handleProfileSubmit = (e: React.FormEvent) => { e.preventDefault(); saveUserProfile(profile); alert('Profile saved!'); };
    const handleApiSubmit = (e: React.FormEvent) => { 
        e.preventDefault(); 
        saveAvApiKey(apiKey); 
        saveIsAvEnabled(avEnabled);
        saveGeminiApiKey(geminiKey);
        saveIsChatbotEnabled(chatbotEnabled);
        alert('API Keys and settings saved!'); 
    };
    const handleFireSubmit = (e: React.FormEvent) => { e.preventDefault(); saveTargetAnnualSpending(spending); alert('FIRE goal saved!'); };
    const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCurrency = e.target.value;
        setCurrentCurrency(newCurrency);
        saveCurrency(newCurrency);
    }
    
    const handleExport = () => {
            const keysToExport = ['cashAccounts', 'properties', 'liabilities', 'transactions', 'dividends', 'budgetItems', 'userProfile', 'avApiKey', 'isAvEnabled', 'geminiApiKey', 'isChatbotEnabled', 'targetAnnualSpending', 'currency', 'theme', 'targetAllocations', 'fireSettings'];
        const exportData: Record<string, any> = {};
        
        keysToExport.forEach(key => {
            const item = window.localStorage.getItem(key);
            if (item) {
                try {
                    exportData[key] = JSON.parse(item);
                } catch (e) {
                    exportData[key] = item;
                }
            }
        });

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "findash-backup.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target?.result as string);
                
                if (typeof importedData !== 'object' || importedData === null) {
                    throw new Error("Invalid backup file format");
                }

                if (window.confirm("Are you sure you want to import this data? This will overwrite your current data and reload the page.")) {
                    Object.keys(importedData).forEach(key => {
                        window.localStorage.setItem(key, JSON.stringify(importedData[key]));
                    });
                    
                    alert("Data imported successfully. The page will now reload.");
                    window.location.reload();
                }
            } catch (error) {
                console.error("Error importing data: ", error);
                alert("Failed to import data. Please ensure the file is a valid FinDash backup JSON.");
            }
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    const handleExportTransactionsJSON = () => {
        const transactionsStr = window.localStorage.getItem('transactions');
        if (transactionsStr) {
            exportTransactionsToJSON(JSON.parse(transactionsStr) as Transaction[]);
        } else {
            alert('No transactions found to export.');
        }
    };

    const handleExportBudgetJSON = () => {
        const budgetStr = window.localStorage.getItem('budgetItems');
        if (budgetStr) {
            exportBudgetToJSON(JSON.parse(budgetStr) as BudgetItem[]);
        } else {
            alert('No budget items found to export.');
        }
    };

    const handleSelectSyncDirectory = async () => {
        try {
            // @ts-ignore
            const directoryHandle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });
            await saveDirectoryHandle(directoryHandle);
            setSyncDirName(directoryHandle.name);
            alert(`Successfully connected to folder: ${directoryHandle.name}`);
        } catch (error) {
            console.error('Error selecting directory:', error);
            // User probably cancelled the prompt
        }
    };

    const handleSyncNow = async () => {
        setIsSyncing(true);
        try {
            const handle = await getDirectoryHandle();
            if (!handle) {
                alert('Please select a sync directory first.');
                setIsSyncing(false);
                return;
            }

            // Gather full backup JSON
            const keysToExport = ['cashAccounts', 'properties', 'liabilities', 'transactions', 'dividends', 'budgetItems', 'userProfile', 'avApiKey', 'isAvEnabled', 'targetAnnualSpending', 'currency', 'theme', 'targetAllocations', 'fireSettings'];
            const exportData: Record<string, any> = {};
            keysToExport.forEach(key => {
                const item = window.localStorage.getItem(key);
                if (item) {
                    try { exportData[key] = JSON.parse(item); } 
                    catch (e) { exportData[key] = item; }
                }
            });

            const jsonString = JSON.stringify(exportData, null, 2);
            const success = await syncDataToDirectory(handle, 'findash-sync.json', jsonString);

            if (success) {
                const time = moment().format('YYYY-MM-DD HH:mm:ss');
                setLastSyncTime(time);
                window.localStorage.setItem('lastSyncTime', time);
                alert('Sync completed successfully!');
            } else {
                alert('Sync failed. Please ensure you have granted browser permissions to the folder.');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred during sync.');
        } finally {
            setIsSyncing(false);
        }
    };
    
    const inputClasses = "block w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500";
    const btnPrimaryClasses = "text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
    const btnSecondaryClasses = "text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 transition-colors";

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

            <Card title="API Keys & Integrations">
                 <form onSubmit={handleApiSubmit} className="space-y-4">
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Alpha Vantage API</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Fetch live market prices for your investments.</p>
                            </div>
                            <Switch enabled={avEnabled} onChange={setAvEnabled} />
                        </div>
                        {avEnabled && (
                            <div className="pl-4 border-l-2 border-indigo-100 dark:border-indigo-900 mt-2 space-y-2">
                                <label htmlFor="avApiKey" className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Alpha Vantage API Key</label>
                                <input type="password" id="avApiKey" name="avApiKey" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className={inputClasses} />
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">Get a free key here.</a>
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Google Gemini Chatbot</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">AI insights and automated entry creation.</p>
                            </div>
                            <Switch enabled={chatbotEnabled} onChange={setChatbotEnabled} />
                        </div>
                        {chatbotEnabled && (
                            <div className="pl-4 border-l-2 border-indigo-100 dark:border-indigo-900 mt-4 space-y-2">
                                <label htmlFor="geminiApiKey" className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Google Gemini API Key</label>
                                <input type="password" id="geminiApiKey" name="geminiApiKey" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} className={inputClasses} />
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">Get a free key from Google AI Studio.</a>
                                </p>
                            </div>
                        )}
                    </div>
                     <button type="submit" className={btnPrimaryClasses}>Save Settings</button>
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

            <Card title="Data Backup & Export">
                <div className="space-y-6 text-sm text-gray-600 dark:text-gray-400">
                    <p className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg text-indigo-700 dark:text-indigo-300 text-xs">
                        <strong>Migration Guide:</strong> To move your data to a new device, use "Export Full Backup" to get a JSON file, then use "Import Backup" on the new device to restore everything.
                    </p>
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">JSON Exports</h4>
                        <p className="mb-3">Download your raw data as JSON files.</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button type="button" onClick={handleExportTransactionsJSON} className={`${btnSecondaryClasses} w-full sm:w-auto`}>
                                Export Transactions (JSON)
                            </button>
                            <button type="button" onClick={handleExportBudgetJSON} className={`${btnSecondaryClasses} w-full sm:w-auto`}>
                                Export Budget Items (JSON)
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Full System Backup (JSON)</h4>
                        <p className="mb-3">Export all application data including settings to a single file, or import an existing backup.</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button type="button" onClick={handleExport} className={`${btnSecondaryClasses} w-full sm:w-auto`}>
                                Export Full Backup
                            </button>
                            
                            <div className="relative w-full sm:w-auto">
                                <input 
                                    type="file" 
                                    accept=".json" 
                                    onChange={handleImport} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    title="Import Backup"
                                />
                                <button type="button" className={`${btnSecondaryClasses} w-full sm:w-auto`}>
                                    Import Backup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="Automated Directory Sync">
                <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                    <p>
                        Select a folder on your computer (e.g., a Google Drive desktop sync folder, iCloud Drive, or Dropbox folder). FinDash will save an up-to-date <code>findash-sync.json</code> file to this location.
                    </p>
                    <p className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-300 text-xs">
                        <strong>Tip:</strong> If no file exists in the folder, a new one will be created automatically. This ensures your data is always backed up to your cloud storage.
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                        * Note: This uses the File System Access API. Your browser may occasionally ask you to re-verify permissions for security reasons.
                    </p>

                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <span className="font-medium text-gray-900 dark:text-white">Active Sync Folder: </span>
                                {syncDirName ? (
                                    <span className="text-green-600 dark:text-green-400 font-mono">{syncDirName}</span>
                                ) : (
                                    <span className="text-gray-500">None Selected</span>
                                )}
                                {lastSyncTime && (
                                    <p className="text-xs mt-1">Last synced: {lastSyncTime}</p>
                                )}
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button type="button" onClick={handleSelectSyncDirectory} className={btnSecondaryClasses}>
                                    {syncDirName ? 'Change Folder' : 'Select Folder'}
                                </button>
                                {syncDirName && (
                                    <button 
                                        type="button" 
                                        onClick={handleSyncNow} 
                                        disabled={isSyncing}
                                        className={`${btnPrimaryClasses} ${isSyncing ? 'opacity-50 cursor-wait' : ''}`}
                                    >
                                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SettingsPage;