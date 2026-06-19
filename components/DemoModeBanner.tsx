import React from 'react';

interface DemoModeBannerProps {
    onContinueSetup: () => void;
}

const DemoModeBanner: React.FC<DemoModeBannerProps> = ({ onContinueSetup }) => {
    return (
        <div
            className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3"
            data-testid="demo-mode-banner"
        >
            <div className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-200">
                <span className="text-lg" aria-hidden="true">✨</span>
                <span>
                    <strong>Demo mode</strong> — you&apos;re exploring FinDash with sample data. Nothing here is your real finances.
                </span>
            </div>
            <button
                onClick={onContinueSetup}
                className="shrink-0 text-sm font-medium px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                data-testid="continue-real-setup-btn"
            >
                Continue setup with my data
            </button>
        </div>
    );
};

export default DemoModeBanner;
