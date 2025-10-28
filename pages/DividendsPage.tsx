
import React from 'react';
import Card from '../components/Card';

const DividendsPage: React.FC = () => {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dividends</h1>
                <p className="text-gray-500 dark:text-gray-400">This page is under construction.</p>
            </header>
            <Card title="Coming Soon">
                <p className="text-gray-600 dark:text-gray-400">
                    A dedicated page for analyzing dividend income is coming soon!
                </p>
            </Card>
        </div>
    );
};

export default DividendsPage;
