import moment from 'moment';
import { BudgetItem, ParsedCsvRow } from '../types';

function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}

export function parseCsvFile(text: string): { headers: string[]; rows: string[][] } {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return { headers: [], rows: [] };
    const headers = parseCsvLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => parseCsvLine(line).map(c => c.replace(/^"|"$/g, '')));
    return { headers, rows };
}

export interface ColumnMap {
    date: number;
    description: number;
    amount?: number;
    debit?: number;
    credit?: number;
}

const DATE_HEADERS = ['date', 'transaction date', 'posted date', 'posting date'];
const DESC_HEADERS = ['description', 'memo', 'narrative', 'details', 'payee'];
const AMOUNT_HEADERS = ['amount', 'value', 'transaction amount'];
const DEBIT_HEADERS = ['debit', 'withdrawal', 'money out'];
const CREDIT_HEADERS = ['credit', 'deposit', 'money in'];

function findColumn(headers: string[], candidates: string[]): number {
    const lower = headers.map(h => h.toLowerCase().trim());
    for (const c of candidates) {
        const idx = lower.findIndex(h => h === c || h.includes(c));
        if (idx >= 0) return idx;
    }
    return -1;
}

export function detectColumns(headers: string[]): ColumnMap | null {
    const date = findColumn(headers, DATE_HEADERS);
    const description = findColumn(headers, DESC_HEADERS);
    const amount = findColumn(headers, AMOUNT_HEADERS);
    const debit = findColumn(headers, DEBIT_HEADERS);
    const credit = findColumn(headers, CREDIT_HEADERS);

    if (date < 0 || description < 0) return null;
    if (amount < 0 && debit < 0 && credit < 0) return null;

    return { date, description, amount: amount >= 0 ? amount : undefined, debit: debit >= 0 ? debit : undefined, credit: credit >= 0 ? credit : undefined };
}

function parseAmount(val: string): number {
    const cleaned = val.replace(/[$,]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.abs(num);
}

function parseDate(val: string): string {
    const formats = ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY', 'M/D/YYYY', 'D/M/YYYY', 'YYYY/MM/DD'];
    for (const fmt of formats) {
        const m = moment(val, fmt, true);
        if (m.isValid()) return m.format('YYYY-MM-DD');
    }
    const fallback = new Date(val);
    if (!isNaN(fallback.getTime())) {
        return moment(fallback).format('YYYY-MM-DD');
    }
    return val;
}

const CATEGORY_KEYWORDS: [RegExp, string][] = [
    [/amazon|amzn/i, 'Shopping'],
    [/uber|lyft|fuel|gas station|shell|bp /i, 'Transport'],
    [/salary|payroll|wages|direct deposit/i, 'Salary'],
    [/grocery|woolworths|coles|whole foods|trader/i, 'Groceries & Food Staples'],
    [/netflix|spotify|disney|hulu/i, 'Subscriptions & Memberships'],
    [/electric|gas bill|water bill|utility/i, 'Electricity, Gas, Water'],
    [/rent|mortgage|landlord/i, 'Rent/Mortgage'],
    [/restaurant|doordash|grubhub|mcdonald|starbucks/i, 'Dining Out & Takeaway'],
    [/insurance/i, 'Insurance Premiums'],
    [/interest|dividend/i, 'Investment Contributions (Non-Retirement)'],
];

export function categorizeByKeywords(description: string): string {
    for (const [pattern, category] of CATEGORY_KEYWORDS) {
        if (pattern.test(description)) return category;
    }
    return 'Uncategorized';
}

export function buildImportId(date: string, amount: number, description: string): string {
    return `${date}|${amount}|${description.toLowerCase().trim()}`;
}

export function normalizeRow(raw: string[], columnMap: ColumnMap): ParsedCsvRow | null {
    const dateStr = parseDate(raw[columnMap.date] || '');
    const description = raw[columnMap.description] || 'Unknown';

    let amount = 0;
    let type: 'income' | 'expense' = 'expense';

    if (columnMap.amount !== undefined) {
        const rawAmount = parseAmount(raw[columnMap.amount]);
        const signed = parseFloat((raw[columnMap.amount] || '').replace(/[$,]/g, ''));
        amount = rawAmount;
        type = signed < 0 ? 'expense' : 'income';
    } else {
        const debit = columnMap.debit !== undefined ? parseAmount(raw[columnMap.debit] || '') : 0;
        const credit = columnMap.credit !== undefined ? parseAmount(raw[columnMap.credit] || '') : 0;
        if (debit > 0) {
            amount = debit;
            type = 'expense';
        } else if (credit > 0) {
            amount = credit;
            type = 'income';
        } else {
            return null;
        }
    }

    if (amount <= 0 || !dateStr) return null;

    return {
        date: dateStr,
        description,
        amount,
        type,
        suggestedCategory: categorizeByKeywords(description),
        selected: true,
        importId: buildImportId(dateStr, amount, description),
    };
}

export function deduplicateRows(rows: ParsedCsvRow[], existingBudgetItems: BudgetItem[]): ParsedCsvRow[] {
    const existingIds = new Set(existingBudgetItems.filter(b => b.importId).map(b => b.importId!));
    const seen = new Set<string>();
    return rows.filter(row => {
        if (existingIds.has(row.importId) || seen.has(row.importId)) return false;
        seen.add(row.importId);
        return true;
    });
}

export function rowsToBudgetItems(rows: ParsedCsvRow[]): Omit<BudgetItem, 'id'>[] {
    return rows.filter(r => r.selected).map(row => ({
        name: row.description,
        category: row.suggestedCategory,
        amount: row.amount,
        type: row.type,
        date: row.date,
        isRecurring: false,
        importId: row.importId,
        importSource: 'csv' as const,
    }));
}

export function parseAndNormalizeCsv(text: string, columnMap?: ColumnMap): { rows: ParsedCsvRow[]; headers: string[]; detectedMap: ColumnMap | null } {
    const { headers, rows: rawRows } = parseCsvFile(text);
    const detectedMap = columnMap || detectColumns(headers);
    if (!detectedMap) return { rows: [], headers, detectedMap: null };

    const rows = rawRows
        .map(raw => normalizeRow(raw, detectedMap))
        .filter((r): r is ParsedCsvRow => r !== null);

    return { rows, headers, detectedMap };
}
