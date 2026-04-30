# Changelog

All notable changes to the **FinDash** project will be documented in this file.

## [Unreleased]

### Added
- **Price Server Hardening**:
  - Migrated price server to port `8001` to prevent conflicts with other financial projects.
  - Implemented thread-safe batch processing with `yfinance` for significantly faster portfolio refreshes.
  - Added historical price fallbacks (5-day window) to ensure data availability on weekends and market holidays.
  - Added `/search` endpoint for real-time ticker and company name lookup.
  - Upgraded `yfinance` to `v1.2.0+` to resolve Yahoo Finance API connection issues.

### Removed
- **Alpha Vantage Integration**:
  - Completely decoupled the application from Alpha Vantage.
  - Removed all `avApiKey` and `isAvEnabled` state, UI components, and logic.
  - Eliminated the "Missing API Key" warnings across all pages.
- **FinOps Observability**:
  - Removed legacy AI cost tracking and token observability features to simplify the codebase for personal use.

### Changed
- **Default Pricing Engine**: Set the Local Price Server as the default (and only) market data provider.
- **Stability Fixes**: Resolved "white screen" rendering issues caused by dangling Alpha Vantage references in the dashboard.

### Added
- **Local yfinance Price Server**:
  - Built a local Python/FastAPI microservice (`price-server`) to fetch real-time market prices without hitting cloud API limits.
  - Implemented a "Local yfinance Server" toggle in Settings to seamlessly bypass Alpha Vantage integration.
- **Advanced Portfolio Rebalancing**:
  - Implemented the "Square Root Rule" for optimal rebalancing frequency mathematically balancing brokerage fees vs opportunity costs.
  - Added "Next Best Buy" highlighting to visually indicate which asset is most deficient from its target allocation.
- **Data Deletion Confirmation**: Added an explicit text confirmation ("delete my data") prompt when resetting the application data to prevent accidental loss.

- **Google Gemini Chatbot Assistant**:
  - Global floating chat widget powered by Google Gemini (BYO API Key).
  - Context-aware financial assistant that understands your net worth, expenses, and FIRE progress.
  - **Quick Prompts**: Integrated clickable chips for common queries and actions to speed up interactions.
  - Guided step-by-step assistant capable of creating and logging new budget items (expenses/earnings) directly via chat conversation.
- **Phase 5: Premium UI & Data Visualization**:
  - **Glassmorphism Overhaul**: Transformed the primary UI cards with `backdrop-blur` and translucent backgrounds for a modern look.
  - **Micro-animations**: Integrated `framer-motion` for buttery smooth spring transitions on hover states.
  - **Historical Net Worth Chart**: Added automated, month-by-month Net Worth tracking visualized via a `recharts` line chart on the dashboard.
  - **Asset Allocation Heatmap**: Introduced a new `Treemap` visualization on the dashboard to visualize proportional portfolio sizes.
- **Data Portability & Sync**:
  - Transitioned export capabilities for Transactions and Budget Items from CSV to JSON format.
  - Integration with the File System Access API to connect a local folder (e.g., Google Drive Desktop folder) as an "Always True" sync directory.
  - Hourly background synchronization service that silently dumps a full JSON backup into the selected local directory without manual intervention.
- `FIRESimulator.tsx` and `fireSimulation.ts`: Integrated an advanced FIRE engine with Monte Carlo simulations to calculate portfolio survival probability over retirement years.
- Support for detailed FIRE settings including Safe Withdrawal Rate (SWR), inflation, expected market return, and tax rates.
- Dynamic adjustments in the FIRE Dashboard showing required pre-tax income and inflation-adjusted targets.
- `RebalancingEngine.tsx`: New component added to the Investments page to handle target allocations and portfolio rebalancing.
- `calculateRebalance` utility: Added an algorithmic engine to calculate exact buy/sell amounts needed to reach target portfolio allocations, including new capital injections.
- `TargetAllocation` type added to `types.ts`.
- `FIREPage.tsx`: Dedicated dashboard for tracking Financial Independence and Early Retirement metrics.
- `InvestmentsPage.tsx`: Dedicated page for portfolio holdings and asset management.
- `SYSTEM_DESIGN.md`: Comprehensive architecture and technical specification document.
- `implementation_plan.md`: Roadmap for project evolution and feature parity with leading finance templates.

### Changed
- Promoted FIRE and Investments from sub-sections of the Dashboard into dedicated full-page routes to improve information density.
- Updated Navigation (`Sidebar.tsx`) to include dedicated icons and links for FIRE and Investments.
- Streamlined `DashboardPage.tsx` to focus strictly on top-level metrics (Net Worth, Asset Allocation, Budget Summary).
- Updated project documentation strategy to include technical spec updates and changelog maintenance after each development phase.

