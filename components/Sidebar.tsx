import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, TableCellsIcon, DocumentChartBarIcon, BanknotesIcon, CalendarIcon, Cog6ToothIcon, ArrowTrendingUpIcon, CreditCardIcon, MagnifyingGlassIcon, ChartPieIcon, FireIcon } from '@heroicons/react/24/outline';

interface SidebarProps {
    isCollapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `flex items-center p-3 rounded-lg transition-colors text-sm font-medium ${isCollapsed ? 'justify-center' : ''} ${
            isActive
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`;

    const iconClasses = `h-6 w-6 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`;
    const brandIconClasses = `h-8 w-8 text-indigo-400 flex-shrink-0 ${isCollapsed ? '' : 'mr-2'}`;
    const textClasses = `whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`;
    const sectionHeadingClasses = `text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-4 ml-3 ${isCollapsed ? 'hidden' : ''}`;

    return (
        <aside className={`bg-gray-800 text-white p-4 flex-col fixed h-full z-20 hidden sm:flex transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div className={`text-2xl font-bold mb-10 text-white flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                <BanknotesIcon className={brandIconClasses}/>
                <span className={textClasses}>FinDash</span>
            </div>
            <nav className="flex flex-col space-y-1 flex-grow overflow-y-auto no-scrollbar">
                <NavLink to="/" className={navLinkClasses} title={isCollapsed ? 'Dashboard' : undefined}>
                    <HomeIcon className={iconClasses} />
                    <span className={textClasses}>Dashboard</span>
                </NavLink>

                {/* Section: Daily Tracking */}
                <div className={sectionHeadingClasses}>Daily Tracking</div>
                <NavLink to="/incomes" className={navLinkClasses} title={isCollapsed ? 'Incomes' : undefined}>
                     <ArrowTrendingUpIcon className={iconClasses} />
                    <span className={textClasses}>Incomes</span>
                </NavLink>
                <NavLink to="/expenses" className={navLinkClasses} title={isCollapsed ? 'Expenses' : undefined}>
                     <CreditCardIcon className={iconClasses} />
                    <span className={textClasses}>Expenses</span>
                </NavLink>
                <NavLink to="/calendar" className={navLinkClasses} title={isCollapsed ? 'Calendar' : undefined}>
                    <CalendarIcon className={iconClasses} />
                    <span className={textClasses}>Calendar</span>
                </NavLink>

                {/* Section: Ledger and Investments */}
                <div className={sectionHeadingClasses}>Ledger & Investments</div>
                <NavLink to="/transactions" className={navLinkClasses} title={isCollapsed ? 'Ledger' : undefined}>
                    <DocumentChartBarIcon className={iconClasses} />
                    <span className={textClasses}>Ledger</span>
                </NavLink>
                <NavLink to="/investments" className={navLinkClasses} title={isCollapsed ? 'Investments' : undefined}>
                    <ChartPieIcon className={iconClasses} />
                    <span className={textClasses}>Investments</span>
                </NavLink>

                {/* Section: FIRE */}
                <div className={sectionHeadingClasses}>FIRE</div>
                <NavLink to="/fire" className={navLinkClasses} title={isCollapsed ? 'FIRE Journey' : undefined}>
                    <FireIcon className={iconClasses} />
                    <span className={textClasses}>FIRE Journey</span>
                </NavLink>
            </nav>

            <div className="mt-auto space-y-1">
                 <NavLink to="/manage" className={navLinkClasses} title={isCollapsed ? 'Manage Data' : undefined}>
                    <TableCellsIcon className={iconClasses} />
                    <span className={textClasses}>Manage Data</span>
                </NavLink>
                 <NavLink to="/settings" className={navLinkClasses} title={isCollapsed ? 'Settings' : undefined}>
                    <Cog6ToothIcon className={iconClasses} />
                    <span className={textClasses}>Settings</span>
                </NavLink>
            </div>
        </aside>
    );
};

export default Sidebar;
