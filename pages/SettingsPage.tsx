import React, { useState, useEffect } from 'react';
import { UserProfile, Transaction, BudgetItem } from '../types';
import Card from '../components/Card';
import { exportTransactionsToJSON, exportBudgetToJSON } from '../services/exportService';
import { getDirectoryHandle, saveDirectoryHandle, syncDataToDirectory, verifyPermission } from '../services/syncService';
import moment from 'moment';

interface SettingsPageProps {
    userProfile: UserProfile;
    saveUserProfile: (profile: UserProfile) => void;
    geminiApiKey: string;
    saveGeminiApiKey: (key: string) => void;
    isChatbotEnabled: boolean;
    saveIsChatbotEnabled: (enabled: boolean) => void;
    targetAnnualSpending: number;
    saveTargetAnnualSpending: (value: number) => void;
    currency: string;
    saveCurrency: (currency: string) => void;
    useLocalPriceServer: boolean;
    saveUseLocalPriceServer: (enabled: boolean) => void;
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
    geminiApiKey,
    saveGeminiApiKey,
    isChatbotEnabled,
    saveIsChatbotEnabled,
    targetAnnualSpending,
    saveTargetAnnualSpending,
    currency,
    saveCurrency,
    useLocalPriceServer,
    saveUseLocalPriceServer,
}) => {
    const [profile, setProfile] = useState<UserProfile>(userProfile);
    const [localPriceServerEnabled, setLocalPriceServerEnabled] = useState(useLocalPriceServer);
    const [spending, setSpending] = useState(targetAnnualSpending);
    const [geminiKey, setGeminiKey] = useState(geminiApiKey);
    const [chatbotEnabled, setChatbotEnabled] = useState(isChatbotEnabled);
    const [currentCurrency, setCurrentCurrency] = useState(currency);
    const [syncDirName, setSyncDirName] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(window.localStorage.getItem('lastSyncTime'));

    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [importConfirmModal, setImportConfirmModal] = useState<{ isOpen: boolean; data: any }>({ isOpen: false, data: null });

    useEffect(() => { setProfile(userProfile); }, [userProfile]);
    useEffect(() => { setSpending(targetAnnualSpending); }, [targetAnnualSpending]);
    useEffect(() => { setGeminiKey(geminiApiKey); }, [geminiApiKey]);
    useEffect(() => { setChatbotEnabled(isChatbotEnabled); }, [isChatbotEnabled]);
    useEffect(() => { setCurrentCurrency(currency); }, [currency]);
    useEffect(() => { setLocalPriceServerEnabled(useLocalPriceServer); }, [useLocalPriceServer]);

    useEffect(() => {
        getDirectoryHandle().then(handle => {
            if (handle) {
                setSyncDirName(handle.name);
            }
        }).catch(console.error);
    }, []);

    const showSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
    };

    const handleProfileSubmit = (e: React.FormEvent) => { 
        e.preventDefault(); 
        saveUserProfile(profile); 
        showSuccess('Profile saved successfully!');
    };

    const handleApiSubmit = (e: React.FormEvent) => { 
        e.preventDefault(); 
        saveGeminiApiKey(geminiKey); 
        saveIsChatbotEnabled(chatbotEnabled);
        saveUseLocalPriceServer(localPriceServerEnabled);
        showSuccess('API settings saved successfully!');
    };

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCurrency = e.target.value;
        setCurrentCurrency(newCurrency);
        saveCurrency(newCurrency);
    }
    
    const handleExport = () => {
        const keysToExport = ['cashAccounts', 'properties', 'liabilities', 'transactions', 'dividends', 'budgetItems', 'userProfile', 'geminiApiKey', 'isChatbotEnabled', 'targetAnnualSpending', 'currency', 'theme', 'targetAllocations', 'fireSettings'];
        const exportData: Record<string, any> = {};
        keysToExport.forEach(key => {
            const item = window.localStorage.getItem(key);
            if (item) {
                try { exportData[key] = JSON.parse(item); } catch (e) { exportData[key] = item; }
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
                setImportConfirmModal({ isOpen: true, data: importedData });
            } catch (error) {
                console.error("Error importing data: ", error);
                alert("Failed to import data. Please ensure the file is a valid FinDash backup JSON.");
            }
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    const confirmImport = () => {
        if (importConfirmModal.data) {
            Object.keys(importConfirmModal.data).forEach(key => {
                window.localStorage.setItem(key, JSON.stringify(importConfirmModal.data[key]));
            });
            window.location.reload();
        }
    };

    const handleExportTransactionsJSON = () => {
        const transactionsStr = window.localStorage.getItem('transactions');
        if (transactionsStr) exportTransactionsToJSON(JSON.parse(transactionsStr) as Transaction[]);
    };

    const handleExportBudgetJSON = () => {
        const budgetStr = window.localStorage.getItem('budgetItems');
        if (budgetStr) exportBudgetToJSON(JSON.parse(budgetStr) as BudgetItem[]);
    };

    const handleSelectSyncDirectory = async () => {
        try {
            // @ts-ignore
            const directoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            await saveDirectoryHandle(directoryHandle);
            setSyncDirName(directoryHandle.name);
            showSuccess(`Connected to ${directoryHandle.name}`);
        } catch (error) { console.error(error); }
    };

    const handleSyncNow = async () => {
        setIsSyncing(true);
        try {
            const handle = await getDirectoryHandle();
            if (!handle) { setIsSyncing(false); return; }
            const keysToExport = ['cashAccounts', 'properties', 'liabilities', 'transactions', 'dividends', 'budgetItems', 'userProfile', 'avApiKey', 'isAvEnabled', 'targetAnnualSpending', 'currency', 'theme', 'targetAllocations', 'fireSettings'];
            const exportData: Record<string, any> = {};
            keysToExport.forEach(key => {
                const item = window.localStorage.getItem(key);
                if (item) { try { exportData[key] = JSON.parse(item); } catch (e) { exportData[key] = item; } }
            });
            const jsonString = JSON.stringify(exportData, null, 2);
            const success = await syncDataToDirectory(handle, 'findash-sync.json', jsonString);
            if (success) {
                const time = moment().format('YYYY-MM-DD HH:mm:ss');
                setLastSyncTime(time);
                window.localStorage.setItem('lastSyncTime', time);
                showSuccess('Sync completed!');
            }
        } catch (error) { console.error(error); } finally { setIsSyncing(false); }
    };
    
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetStep, setResetStep] = useState(1);
    const [resetInputText, setResetInputText] = useState('');

    const handleResetAllData = () => {
        setIsResetModalOpen(true);
        setResetStep(1);
        setResetInputText('');
    };

    const confirmReset = () => {
        if (resetInputText === 'delete my data') {
            window.localStorage.clear();
            window.location.reload();
        }
    };
    
    const inputClasses = "block w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500 transition-all";
    const btnPrimaryClasses = "text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
    const btnSecondaryClasses = "text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700 transition-all";

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage your profile and application settings.</p>
            </header>
            
            <Card title="User Profile">
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Name <span className="text-red-500">*</span></label>
                        <input type="text" id="name" name="name" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className={inputClasses} required />
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
                        <label htmlFor="currency" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Currency <span className="text-red-500">*</span></label>
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
                    </div>
                </form>
            </Card>

            <Card title="API Keys & Integrations">
                 <form onSubmit={handleApiSubmit} className="space-y-4">
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-300">Local yfinance Server</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Fetch free market prices via local Python microservice (port 8000).</p>
                            </div>
                            <Switch enabled={localPriceServerEnabled} onChange={setLocalPriceServerEnabled} />
                        </div>
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
                            <div className="pl-4 border-l-2 border-indigo-100 dark:border-indigo-900 mt-4 space-y-2 animate-in slide-in-from-left-2 duration-300">
                                <label htmlFor="geminiApiKey" className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Google Gemini API Key <span className="text-red-500">*</span></label>
                                <input type="password" id="geminiApiKey" name="geminiApiKey" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} className={inputClasses} required />
                            </div>
                        )}
                    </div>
                     <button type="submit" className={btnPrimaryClasses}>Save Settings</button>
                </form>
            </Card>

            <Card title="Data Backup & Export">
                <div className="space-y-6 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">JSON Exports</h4>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button type="button" onClick={handleExportTransactionsJSON} className={btnSecondaryClasses}>Export Transactions</button>
                            <button type="button" onClick={handleExportBudgetJSON} className={btnSecondaryClasses}>Export Budget</button>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Full Backup</h4>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button type="button" onClick={handleExport} className={btnSecondaryClasses}>Export Full Backup</button>
                            <div className="relative">
                                <input type="file" accept=".json" onChange={handleImport} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <button type="button" className={btnSecondaryClasses}>Import Backup</button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="Automated Directory Sync">
                <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                    <p>Sync your data automatically with a local folder (Google Drive, iCloud, etc).</p>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <span className="font-medium text-gray-900 dark:text-white">Active Folder: </span>
                                <span className={syncDirName ? "text-green-600 dark:text-green-400" : "text-gray-500"}>{syncDirName || 'None'}</span>
                                {lastSyncTime && <p className="text-[10px] mt-1">Last sync: {lastSyncTime}</p>}
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={handleSelectSyncDirectory} className={btnSecondaryClasses}>Select Folder</button>
                                {syncDirName && <button type="button" onClick={handleSyncNow} disabled={isSyncing} className={btnPrimaryClasses}>{isSyncing ? 'Syncing...' : 'Sync Now'}</button>}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card title="Danger Zone">
                <div className="p-4 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-xl flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-red-600 dark:text-red-400">Reset All Data</h4>
                        <p className="text-xs text-red-500/80">Permanently delete everything. This cannot be undone.</p>
                    </div>
                    <button type="button" onClick={handleResetAllData} className="text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-sm px-5 py-2.5">Wipe Everything</button>
                </div>
            </Card>

            {/* Modals */}
            {isResetModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-red-100 dark:border-red-900/30 animate-in zoom-in duration-300">
                        <div className="p-6 text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-2">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            {resetStep === 1 ? (
                                <>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete All Data?</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">This will permanently wipe your history, accounts, and settings.</p>
                                    <div className="flex gap-3 pt-4">
                                        <button onClick={() => setIsResetModalOpen(false)} className={`${btnSecondaryClasses} flex-1`}>Cancel</button>
                                        <button onClick={() => setResetStep(2)} className="flex-1 text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-sm px-5 py-2.5">Continue</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Are you REALLY sure?</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">To confirm, please type <span className="font-bold text-gray-900 dark:text-white italic">delete my data</span> below:</p>
                                    <input type="text" value={resetInputText} onChange={(e) => setResetInputText(e.target.value)} placeholder="Type 'delete my data'" className={inputClasses} />
                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => setResetStep(1)} className={`${btnSecondaryClasses} flex-1`}>Wait, No!</button>
                                        <button onClick={confirmReset} disabled={resetInputText !== 'delete my data'} className="flex-1 text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 font-medium rounded-lg text-sm px-5 py-2.5 transition-colors">Wipe it All</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <div className="fixed bottom-10 right-10 z-[200] animate-in slide-in-from-bottom-10 duration-500">
                    <div className="bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        <span className="font-bold">{successMessage}</span>
                    </div>
                </div>
            )}

            {importConfirmModal.isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in duration-300">
                        <div className="p-6 text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-2">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirm Data Import</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">This will overwrite everything and reload the application.</p>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setImportConfirmModal({ isOpen: false, data: null })} className={`${btnSecondaryClasses} flex-1`}>Cancel</button>
                                <button onClick={confirmImport} className="flex-1 text-white bg-indigo-600 hover:bg-indigo-700 font-medium rounded-lg text-sm px-5 py-2.5">Overwrite & Reload</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;