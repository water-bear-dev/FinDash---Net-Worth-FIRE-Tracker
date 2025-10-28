import React, { useState } from 'react';
import { getFinancialInsights, InsightResult } from '../services/geminiService';

const FinancialInsights: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<InsightResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const insightResult = await getFinancialInsights(prompt);
      setResult(insightResult);
    } catch (err) {
      setError('Failed to fetch insights. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask a financial question..."
          className="block w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500 flex-grow"
          disabled={isLoading}
        />
        <button type="submit" className="w-full sm:w-auto text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" disabled={isLoading}>
          {isLoading ? 'Thinking...' : 'Get Insights'}
        </button>
      </form>
      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg">{error}</div>}
      {result && (
        <div className="space-y-4">
          <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-strong:text-gray-100">
             <p>{result.text}</p>
          </div>
          {result.sources.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-300 mb-2">Sources:</h4>
              <ul className="list-disc list-inside space-y-1">
                {result.sources.map((source, index) => (
                  <li key={index}>
                    <a
                      href={source.web.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 hover:underline"
                    >
                      {source.web.title || source.web.uri}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialInsights;