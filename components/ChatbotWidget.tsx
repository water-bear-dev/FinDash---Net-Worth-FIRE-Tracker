import React, { useState, useRef, useEffect } from 'react';
import { BudgetItem, Transaction, Liability, FireSettings } from '../types';
import moment from 'moment';

interface ChatbotWidgetProps {
    geminiApiKey: string;
    budgetItems: BudgetItem[];
    transactions: Transaction[];
    liabilities: Liability[];
    netWorth: number;
    fireSettings: FireSettings;
    addBudgetItem: (item: BudgetItem) => void;
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ 
    geminiApiKey, budgetItems, transactions, liabilities, netWorth, fireSettings, addBudgetItem 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: 'Hi! I am your FinDash AI Assistant. How can I help you with your finances today? I can also help you create expenses and earnings.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const quickPrompts = [
        "Add an expense",
        "Add an income",
        "Net worth summary",
        "FIRE progress",
        "Liability breakdown",
        "Freedom Number status",
        "Monthly bill summary"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (overrideInput?: string) => {
        const messageToSend = overrideInput || input;
        if (!messageToSend.trim() || !geminiApiKey) return;

        const userMessage = messageToSend.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            const systemInstruction = `You are an AI financial assistant for the FinDash app. You have access to the user's financial context to answer their questions.
Data Summary:
- Net Worth: $${netWorth.toFixed(2)}
- Total Liabilities: $${liabilities.reduce((sum, l) => sum + l.outstandingBalance, 0).toFixed(2)}
- Budget Items (Income/Expenses): ${budgetItems.length} items. Total monthly income roughly $${budgetItems.filter(b => b.type === 'income').reduce((s, b) => s + b.amount, 0)}. Total monthly expenses roughly $${budgetItems.filter(b => b.type === 'expense').reduce((s, b) => s + b.amount, 0)}.
- FIRE Settings: SWR ${fireSettings.swr}%, Expected Return ${fireSettings.expectedReturn}%

CRITICAL CAPABILITY: CREATE ENTRIES
If the user asks to create, log, or add an earning, income, expense, or bill, you MUST guide them step-by-step. 
Ask for missing information one by one if they didn't provide it:
1. Name (e.g., Groceries, Salary)
2. Amount (number)
3. Type ('income' or 'expense')
4. Category (e.g., Housing, Food, Salary)
5. Date (YYYY-MM-DD format, default to today if they say 'today')
6. Frequency (one-time, monthly, yearly)

ONCE YOU HAVE ALL 6 PIECES OF INFORMATION, you must execute the creation by replying with EXACTLY this JSON block in your message (and you can add a friendly confirmation message outside the block):
[CREATE_BUDGET_ITEM]
{
  "name": "string",
  "amount": number,
  "type": "income" | "expense",
  "category": "string",
  "date": "YYYY-MM-DD",
  "frequency": "one-time" | "monthly" | "yearly"
}
[/CREATE_BUDGET_ITEM]`;

            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            // We append the new user message
            history.push({ role: 'user', parts: [{ text: userMessage }] });

            const requestBody = {
                systemInstruction: { parts: [{ text: systemInstruction }] },
                contents: history,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                }
            };

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message || 'Gemini API Error');
            }

            let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that.";

            // Check for action block
            const actionRegex = /\[CREATE_BUDGET_ITEM\]([\s\S]*?)\[\/CREATE_BUDGET_ITEM\]/;
            const match = responseText.match(actionRegex);

            if (match) {
                try {
                    const itemData = JSON.parse(match[1].trim());
                    // Execute action
                    addBudgetItem({
                        ...itemData,
                        id: Date.now().toString(),
                        isRecurring: itemData.frequency !== 'one-time',
                        recurringSettings: itemData.frequency !== 'one-time' ? { frequency: itemData.frequency } : undefined
                    });
                    
                    // Remove the ugly block from the text shown to the user
                    responseText = responseText.replace(actionRegex, '').trim();
                    if (!responseText) {
                        responseText = `Successfully created ${itemData.type}: ${itemData.name} for $${itemData.amount}!`;
                    }
                } catch (e) {
                    console.error("Failed to parse action JSON from bot", e);
                }
            }

            setMessages(prev => [...prev, { role: 'model', text: responseText }]);

        } catch (error: any) {
            console.error("Chatbot Error:", error);
            setMessages(prev => [...prev, { role: 'model', text: `Error: ${error.message}. Please check your API key.` }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!geminiApiKey) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-80 sm:w-96 h-[500px] mb-4 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 transition-all">
                    {/* Header */}
                    <div className="bg-indigo-600 dark:bg-indigo-700 text-white p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            <h3 className="font-semibold">FinDash AI</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-indigo-200 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-br-none' 
                                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-bl-none shadow-sm'
                                }`}>
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                        {/* Quick Prompts */}
                        <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                            {quickPrompts.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => handleSend(prompt)}
                                    disabled={isLoading}
                                    className="whitespace-nowrap px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-200 dark:border-gray-600 transition-colors"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about finances or add an expense..."
                                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-full py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button 
                                onClick={() => handleSend()}
                                disabled={isLoading || !input.trim()}
                                className="absolute right-1 top-1 bottom-1 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-full transition-colors flex items-center justify-center"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                </button>
            )}
        </div>
    );
};

export default ChatbotWidget;
