import React, { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { FinDashAlert } from '../types';

interface AlertBellProps {
    alerts: FinDashAlert[];
    onDismiss: (id: string) => void;
}

const AlertBell: React.FC<AlertBellProps> = ({ alerts, onDismiss }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref} data-testid="alert-bell">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Alerts"
            >
                <BellIcon className="h-6 w-6" />
                {alerts.length > 0 && (
                    <span
                        className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                        data-testid="alert-badge"
                    >
                        {alerts.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-sm">
                        Alerts ({alerts.length})
                    </div>
                    {alerts.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500 text-center">No active alerts</p>
                    ) : (
                        <ul>
                            {alerts.map(alert => (
                                <li key={alert.id} className="p-3 border-b border-gray-100 dark:border-gray-700 text-sm flex justify-between gap-2">
                                    <div>
                                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                                        {alert.message}
                                    </div>
                                    <button
                                        onClick={() => onDismiss(alert.id)}
                                        className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
                                        data-testid={`dismiss-alert-${alert.id}`}
                                    >
                                        Dismiss
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default AlertBell;
