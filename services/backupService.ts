export const BACKUP_STORAGE_KEYS = [
    'cashAccounts',
    'properties',
    'liabilities',
    'transactions',
    'dividends',
    'budgetItems',
    'userProfile',
    'geminiApiKey',
    'isChatbotEnabled',
    'targetAnnualSpending',
    'currency',
    'theme',
    'targetAllocations',
    'fireSettings',
    'rebalancingSettings',
    'historicalNetWorth',
    'emergencyFundTargetMonths',
    'useLocalPriceServer',
    'isSetupComplete',
] as const;

export function gatherBackupData(): Record<string, unknown> {
    const exportData: Record<string, unknown> = {};
    BACKUP_STORAGE_KEYS.forEach(key => {
        const item = window.localStorage.getItem(key);
        if (item) {
            try {
                exportData[key] = JSON.parse(item);
            } catch {
                exportData[key] = item;
            }
        }
    });
    return exportData;
}

export function restoreBackupData(data: Record<string, unknown>): void {
    Object.keys(data).forEach(key => {
        if (key === 'attachments') return;
        window.localStorage.setItem(key, JSON.stringify(data[key]));
    });
}
