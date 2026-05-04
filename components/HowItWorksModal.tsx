import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface HowItWorksModalProps {
    isOpen: boolean;
    onClose: () => void;
    section: 'FIRE' | 'INVESTMENTS';
}

const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose, section }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        How It Works
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6 text-gray-700 dark:text-gray-300">
                    {section === 'FIRE' && (
                        <>
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Monte Carlo Simulator</h3>
                                <p className="mb-3">
                                    The Monte Carlo simulator is an advanced statistical tool that helps you understand the probability of your portfolio surviving through your retirement years.
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><strong>Why use it?</strong> Financial markets are unpredictable. Instead of assuming a flat 7% return every year, the simulator runs hundreds of randomized market scenarios (some with crashes, some with bull runs).</li>
                                    <li><strong>How it calculates:</strong> It takes your current Net Worth, your selected Safe Withdrawal Rate (SWR), and simulates your portfolio balance month-by-month over your retirement duration.</li>
                                    <li><strong>Success Rate:</strong> If 900 out of 1000 simulated paths end with a positive balance, your success probability is 90%. A rate of 95%+ is generally considered highly safe.</li>
                                </ul>
                            </section>
                            
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Safe Withdrawal Rate (SWR)</h3>
                                <p className="mb-3">
                                    The SWR determines how much of your initial portfolio you can withdraw each year in retirement (adjusted for inflation) without running out of money. The famous "4% Rule" suggests that a 4% withdrawal rate is safe for a 30-year retirement.
                                </p>
                            </section>
                        </>
                    )}

                    {section === 'INVESTMENTS' && (
                        <>
                            <section>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Target Allocations</h3>
                                <p className="mb-3">
                                    Target Allocation is your ideal portfolio split. For example, you might want 80% in Stocks (like VOO or VTI) and 20% in Bonds. 
                                </p>
                                <p className="mb-3">
                                    Over time, as market prices fluctuate, your actual portfolio will drift away from this ideal target. Setting these targets allows the engine to calculate how off-balance you are.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Rebalancing Engine & Recommended Actions</h3>
                                <p className="mb-3">
                                    The Rebalancing Engine takes the emotion and complex math out of portfolio management by calculating the exact trades needed to reach your target allocation.
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><strong>New Capital Injection:</strong> If you input new money to invest (e.g., your monthly savings), the engine calculates the "Next Best Buy." It tells you exactly how many shares of which asset to buy to push your portfolio back toward its target—without selling anything and incurring taxes.</li>
                                    <li><strong>Full Rebalance:</strong> If your portfolio is severely drifted, the engine will recommend both Buy and Sell actions to force the portfolio into exact alignment with your targets.</li>
                                    <li><strong>Tolerance Bands:</strong> Assets within the set tolerance percentage (e.g., ±5%) will not trigger rebalancing recommendations, saving you from unnecessary trading fees.</li>
                                </ul>
                            </section>
                        </>
                    )}
                </div>
                
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HowItWorksModal;
