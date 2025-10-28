import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, TableCellsIcon, DocumentChartBarIcon, BanknotesIcon, CalendarIcon, Cog6ToothIcon, ArrowTrendingUpIcon, CreditCardIcon } from '@heroicons/react/24/outline';


const Sidebar: React.FC = () => {
    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `flex items-center p-3 rounded-lg transition-colors text-sm font-medium ${
            isActive
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`;

    const iconClasses = "h-5 w-5 mr-3";

    return (
        <aside className="w-64 bg-gray-800 text-white p-4 flex-col fixed h-full z-20 hidden sm:flex">
            <div className="text-2xl font-bold mb-10 text-white flex items-center gap-2">
                <BanknotesIcon className="h-8 w-8 text-indigo-400"/>
                <span>FinDash</span>
            </div>
            <nav className="flex flex-col space-y-2 flex-grow">
                <NavLink to="/" className={navLinkClasses}>
                    <HomeIcon className={iconClasses} />
                    Dashboard
                </NavLink>
                <NavLink to="/manage" className={navLinkClasses}>
                    <TableCellsIcon className={iconClasses} />
                    Manage Data
                </NavLink>
                <NavLink to="/transactions" className={navLinkClasses}>
                    <DocumentChartBarIcon className={iconClasses} />
                    Investment & Trading
                </NavLink>
                <NavLink to="/incomes" className={navLinkClasses}>
                     <ArrowTrendingUpIcon className={iconClasses} />
                    Incomes
                </NavLink>
                <NavLink to="/expenses" className={navLinkClasses}>
                     <CreditCardIcon className={iconClasses} />
                    Expenses
                </NavLink>
                <NavLink to="/calendar" className={navLinkClasses}>
                    <CalendarIcon className={iconClasses} />
                    Calendar
                </NavLink>
            </nav>
            <div className="mt-auto">
                 <NavLink to="/settings" className={navLinkClasses}>
                    <Cog6ToothIcon className={iconClasses} />
                    Settings
                </NavLink>
            </div>
        </aside>
    );
};

export default Sidebar;