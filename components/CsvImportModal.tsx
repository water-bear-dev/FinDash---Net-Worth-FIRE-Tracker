import React, { useState, useRef } from 'react';
import { BudgetItem, ParsedCsvRow } from '../types';
import { deduplicateRows, parseAndNormalizeCsv, rowsToBudgetItems } from '../services/csvImport';
import { categorizeTransactions } from '../services/geminiCategorize';

interface CsvImportModalProps {
    budgetItems: BudgetItem[];
    geminiApiKey: string;
    addBudgetItem: (item: Omit<BudgetItem, 'id'>) => void;
    onClose: () => void;
}

const CsvImportModal: React.FC<CsvImportModalProps> = ({
    budgetItems,
    geminiApiKey,
    addBudgetItem,
    onClose,
}) => {
    const [rows, setRows] = useState<ParsedCsvRow[]>([]);
    const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
    const [useAi, setUseAi] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [importedCount, setImportedCount] = useState(0);
    const fileRef = useRef<HTMLInputElement>(null);

    const existingCategories = [...new Set(budgetItems.map(b => b.category))];

    const handleFile = async (file: File) => {
        const text = await file.text();
        const { rows: parsed } = parseAndNormalizeCsv(text);
        const unique = deduplicateRows(parsed, budgetItems);
        setRows(unique);
        setStep('preview');
    };

    const handleConfirm = async () => {
        setIsProcessing(true);
        let finalRows = [...rows];

        if (useAi && geminiApiKey) {
            const aiMap = await categorizeTransactions(finalRows, geminiApiKey, existingCategories);
            finalRows = finalRows.map(r => ({
                ...r,
                suggestedCategory: aiMap.get(r.description.toLowerCase().trim()) || r.suggestedCategory,
            }));
            setRows(finalRows);
        }

        const items = rowsToBudgetItems(finalRows);
        items.forEach(item => addBudgetItem(item));
        setImportedCount(items.length);
        setStep('done');
        setIsProcessing(false);
    };

    const toggleRow = (importId: string) => {
        setRows(prev => prev.map(r => r.importId === importId ? { ...r, selected: !r.selected } : r));
    };

    const updateCategory = (importId: string, category: string) => {
        setRows(prev => prev.map(r => r.importId === importId ? { ...r, suggestedCategory: category } : r));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-testid="csv-import-modal">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import Bank CSV</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                </div>

                {step === 'upload' && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500">Upload a CSV bank statement. Supported columns: Date, Description, Amount (or Debit/Credit).</p>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            data-testid="csv-file-input"
                            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                        />
                        <button
                            onClick={() => fileRef.current?.click()}
                            className="w-full py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:border-indigo-500 transition-colors"
                        >
                            Click to select CSV file
                        </button>
                    </div>
                )}

                {step === 'preview' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">{rows.length} rows to import</p>
                            <label className={`flex items-center gap-2 text-sm ${!geminiApiKey ? 'opacity-50' : ''}`} data-testid="ai-categorize-toggle">
                                <input
                                    type="checkbox"
                                    checked={useAi}
                                    onChange={e => setUseAi(e.target.checked)}
                                    disabled={!geminiApiKey}
                                />
                                Enhance with Gemini
                                {!geminiApiKey && <span className="text-xs">(API key required)</span>}
                            </label>
                        </div>
                        <div className="overflow-x-auto max-h-64">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="p-2">Include</th>
                                        <th className="p-2">Date</th>
                                        <th className="p-2">Description</th>
                                        <th className="p-2">Amount</th>
                                        <th className="p-2">Category</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map(row => (
                                        <tr key={row.importId} className="border-t border-gray-200 dark:border-gray-700">
                                            <td className="p-2">
                                                <input type="checkbox" checked={row.selected} onChange={() => toggleRow(row.importId)} />
                                            </td>
                                            <td className="p-2">{row.date}</td>
                                            <td className="p-2">{row.description}</td>
                                            <td className="p-2">{row.amount.toFixed(2)}</td>
                                            <td className="p-2">
                                                <input
                                                    className="bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-full"
                                                    value={row.suggestedCategory}
                                                    onChange={e => updateCategory(row.importId, e.target.value)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setStep('upload')} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600">Back</button>
                            <button
                                onClick={handleConfirm}
                                disabled={isProcessing || rows.filter(r => r.selected).length === 0}
                                className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-50"
                                data-testid="csv-import-confirm"
                            >
                                {isProcessing ? 'Importing...' : `Import ${rows.filter(r => r.selected).length} rows`}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'done' && (
                    <div className="text-center py-8 space-y-4">
                        <p className="text-lg font-semibold text-green-500" data-testid="import-success">
                            Successfully imported {importedCount} transactions.
                        </p>
                        <button onClick={onClose} className="px-6 py-2 bg-indigo-600 text-white rounded-lg">Done</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CsvImportModal;
