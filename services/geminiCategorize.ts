import { ParsedCsvRow } from '../types';

const BATCH_SIZE = 20;

export async function categorizeTransactions(
    rows: ParsedCsvRow[],
    geminiApiKey: string,
    existingCategories: string[]
): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    if (!geminiApiKey || rows.length === 0) return result;

    const categories = [...new Set([...existingCategories, 'Uncategorized', 'Shopping', 'Transport', 'Salary', 'Groceries & Food Staples'])];

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const prompt = `Categorize each bank transaction into one of these categories: ${categories.join(', ')}.
Reply with JSON array only: [{"description":"...","category":"..."}]
Transactions:
${batch.map(r => `- "${r.description}" ($${r.amount}, ${r.type})`).join('\n')}`;

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
                    }),
                }
            );

            const data = await response.json();
            if (data.error) continue;

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) continue;

            const parsed: { description: string; category: string }[] = JSON.parse(jsonMatch[0]);
            parsed.forEach(item => {
                if (item.description && item.category) {
                    result.set(item.description.toLowerCase().trim(), item.category);
                }
            });
        } catch {
            // fall through — caller keeps rule-based categories
        }
    }

    return result;
}
