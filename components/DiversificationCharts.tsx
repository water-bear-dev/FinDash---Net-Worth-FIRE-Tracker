import React, { useEffect, useState } from 'react';
import { Investment } from '../types';
import Card from './Card';
import AllocationDonutChart from './AllocationDonutChart';
import { aggregateByField, fetchTickerInfo } from '../services/diversification';

interface DiversificationChartsProps {
    holdings: Investment[];
    formatCurrency: (value: number) => string;
}

type Tab = 'sector' | 'country' | 'currency' | 'category';

const TABS: { id: Tab; label: string }[] = [
    { id: 'sector', label: 'Sector' },
    { id: 'country', label: 'Geography' },
    { id: 'currency', label: 'Currency' },
    { id: 'category', label: 'Asset Class' },
];

const DiversificationCharts: React.FC<DiversificationChartsProps> = ({ holdings, formatCurrency }) => {
    const [activeTab, setActiveTab] = useState<Tab>('sector');
    const [infoMap, setInfoMap] = useState(() => new Map());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (holdings.length === 0) return;
        let cancelled = false;
        setLoading(true);
        fetchTickerInfo(holdings.map(h => h.ticker)).then(map => {
            if (!cancelled) {
                setInfoMap(map);
                setLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, [holdings]);

    if (holdings.length === 0) return null;

    const data = aggregateByField(holdings, infoMap, activeTab);

    return (
        <Card title="Diversification">
            <div className="flex flex-wrap gap-2 mb-4">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-1 text-xs rounded-lg border ${
                            activeTab === tab.id
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            {loading ? (
                <p className="text-sm text-gray-500">Loading metadata...</p>
            ) : (
                <div data-testid={`diversification-${activeTab}`}>
                    <AllocationDonutChart data={data} height={220} formatCurrency={formatCurrency} />
                </div>
            )}
        </Card>
    );
};

export default DiversificationCharts;
