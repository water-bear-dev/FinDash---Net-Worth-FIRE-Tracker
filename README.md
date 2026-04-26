<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# FinDash - Net Worth & FIRE Tracker

**FinDash** is a modern, privacy-focused personal finance dashboard designed to help you track your **Net Worth** and monitor your progress toward **FIRE** (Financial Independence, Retire Early).

Built with **React**, **TypeScript**, and **Vite**, it runs entirely in your browser. Your financial data is stored securely in your browser's local storage—no external database required.

## 🚀 Key Features

*   **📊 Net Worth Dashboard**: Visualize your financial health in real-time. Automatically aggregates your **Assets** (Cash, Stocks, Crypto, Property) and **Liabilities** (Loans, Mortgages) to calculate your Net Worth.
*   **🔥 Dedicated FIRE Dashboard & Monte Carlo Simulator**: 
    *   Track your "Freedom Number" and journey to early retirement. 
    *   **Advanced Engine**: Set custom Safe Withdrawal Rates (SWR), account for inflation, and simulate pre-tax vs post-tax requirements.
    *   **Monte Carlo Probabilities**: Runs thousands of simulated market paths to calculate the exact probability your portfolio will survive your chosen retirement duration.
*   **📈 Advanced Investment Portfolio & Rebalancing Engine**: 
    *   Dedicated holdings page to track buy/sell transactions and live pricing.
    *   **Algorithmic Rebalancing**: Define target allocations (e.g. 80% VOO, 20% AAPL), input new capital, and the engine will calculate the exact buy/sell trades required to reach equilibrium.
    *   Visual Pie Charts comparing Current vs Target Allocation.
*   **💰 Budgeting Engine**: 
    *   Manage recurring Incomes and Expenses (e.g., salary, rent, subscriptions).
    *   Smart projections: Automatically generates future financial events based on your recurring settings.
*   **📊 Comprehensive Data Visualization**: 
    *   **Historical Net Worth Tracking**: Automatically records your net worth monthly, visualized via a dynamic Line Chart.
    *   **Asset Allocation Heatmap**: An interactive Treemap that visualizes the proportion of your entire portfolio.
    *   **Financial Calendar**: A visual calendar view of your month. See exactly when bills are due, when income arrives, and when dividends are paid.
*   **🔎 Market Research**: Look up company profiles, financial news, and stock metrics directly within the app.
*   **🌗 Theming**: Fully responsive design with native Dark and Light modes.
*   **☁️ Data Portability & Automated Sync**: 
    *   **Zero-Knowledge Architecture**: All data lives strictly in your browser (`localStorage`). No external databases.
    *   **Automated Backups**: Connect a local folder (like your Google Drive desktop folder) and FinDash will silently back up your complete profile to a JSON file every hour.
    *   **CSV Exports**: Export tabular data for transactions and budgets for use in Excel or other tools.
    *   **Full JSON Import/Export**: Instantly transfer your profile to a new device.

## 🛠️ Tech Stack

*   **Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Charts**: [Recharts](https://recharts.org/)
*   **Routing**: [React Router v7](https://reactrouter.com/)
*   **Data Persistence**: LocalStorage (Browser)
*   **APIs**: 
    *   [Financial Modeling Prep](https://site.financialmodelingprep.com/) (Market Data)
    *   [Google Gemini](https://ai.google.dev/) (AI Insights)

## 🏁 Getting Started

### Prerequisites
*   Node.js (v18 or higher recommended)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/FinDash-Net-Worth-FIRE-Tracker.git
    cd FinDash-Net-Worth-FIRE-Tracker
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Variable Setup (Optional - for AI features):**
    Create a `.env.local` file in the root directory and add your Google Gemini API key:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

4.  **Run the app:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

### 🧪 Testing

This project includes End-to-End (E2E) tests using **Playwright**.

To run the tests, refer to [TECHNICAL_TESTING.md](./TECHNICAL_TESTING.md).

Quick command to run E2E tests:
```bash
python3 scripts/with_server.py --server "npm run dev" --port 3000 -- python3 tests/e2e/test_dashboard.py
```

## ⚙️ Configuration

To unlock the full power of the dashboard, you need to configure a few settings inside the app:

1.  **Market Data (Stock Prices)**:
    *   Go to the **Settings** page within the app.
    *   Enter your **Financial Modeling Prep (FMP)** API Key.
    *   *Note: You can get a free API key from [financialmodelingprep.com](https://site.financialmodelingprep.com/developer/docs).*
    
2.  **Profile & Goals**:
    *   In **Settings**, set your **Target Annual Spending** (this drives the FIRE progress calculations).
    *   Set your preferred **Currency** (e.g., USD, AUD, EUR).

## 🛡️ Privacy & Data Portability

This application is designed with privacy first. **All your financial data is stored locally in your browser's LocalStorage.** No personal financial data is ever sent to a remote server or database managed by this project. API calls are made directly from your browser to the data providers (FMP).

### Data Backup & Migration (Export / Import)
Since there is no centralized database, your data does not automatically sync across devices. To migrate your data (e.g., from your laptop to your phone) or create a safe backup:
1. Go to **Settings**.
2. Scroll down to **Data Backup & Restore**.
3. Click **Export Backup (JSON)** to download your current data.
4. On your new device, click **Import Backup** and select the `.json` file. Your browser will instantly load your data.

**Technical Specifications & Considerations:**
*   **Storage Limits**: Your browser's LocalStorage typically has a limit of around 5MB. Because FinDash only stores text/JSON data, it is extremely difficult to hit this limit through normal usage, ensuring years of seamless tracking.
*   **Security**: The exported `.json` backup file is **unencrypted plain text**. It contains all your detailed financial data. Please ensure you store this exported file securely on your local device or inside an encrypted vault/password manager.
