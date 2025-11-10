import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface ApiKeyWarningProps {
    featureName: string;
}

const ApiKeyWarning: React.FC<ApiKeyWarningProps> = ({ featureName }) => {
    return (
        <div className="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-500" role="alert">
            <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="font-medium">API Key Required!</span>
            </div>
            <p className="mt-2 ml-8">
                To use the {featureName} feature, you need to add a free Financial Modeling Prep API key.
                Please <Link to="/settings" className="font-semibold underline hover:text-yellow-400">go to the Settings page</Link> to add your key.
            </p>
        </div>
    );
};

export default ApiKeyWarning;
