# Changelog

All notable changes to the **FinDash** project will be documented in this file.

## [Unreleased]

### Added
- **Phase 1 Features**:
  - **Savings rate trend**: 12-month savings rate chart on the Dashboard alongside the existing monthly rate metric.
  - **Debt payoff planner**: Snowball vs avalanche comparison on Manage Data, with payments inferred from linked recurring expenses.
  - **Net worth forecast**: Dashed forward projection on the Historical Net Worth chart with 1/5/10-year horizons.
  - **Emergency fund tracker**: Dashboard progress card showing months of expenses covered vs a configurable target in Settings.
  - **Encrypted backups**: Optional passphrase encryption (AES-GCM + PBKDF2) for full JSON export/import.
  - **Receipt / invoice attachments**: Upload or camera-capture files on budget items; stored in IndexedDB and included in full backups.
  - Added E2E coverage in `tests/e2e/test_phase1_features.py` (41 tests total across the suite).
- **Comprehensive E2E Test Suite (Playwright + pytest)**:
  - Migrated from a single ad-hoc Playwright script to a `pytest`-based suite with **35 passing tests** covering every major feature (setup wizard, dashboard, manage data, ledger/transactions, budgeting, calendar, FIRE simulator, investments/rebalancing, settings, and data portability).
  - Added shared fixtures (`tests/e2e/conftest.py`): `seed` seeds `localStorage` via `add_init_script` to skip the SetupWizard and start from a deterministic state; `mocks` intercepts the local price server (`localhost:8001/prices`) and the Gemini API so tests run fully offline.
  - Added page-object style helpers (`tests/e2e/helpers.py`): `open_app`, `goto` (sidebar nav), `card`, `today_iso`, `months_ago_iso`.
  - Added tooling: `tests/requirements-dev.txt` (pytest, pytest-playwright, pytest-html) and `pytest.ini` with HTML + JUnit reporting and failure artifacts (screenshots/video/trace).
  - Reports are written to `reports/` and `test-results/` (git-ignored).
  - Updated `TECHNICAL_TESTING.md` with install steps, run commands, and an explanation of fixtures/seeding/mocking.
  - No application source code was modified; tests rely on existing accessible/text/placeholder selectors.
- **Price Server Hardening**:
  - Migrated price server to port `8001` to prevent conflicts with other financial projects.
  - Implemented thread-safe batch processing with `yfinance` for significantly faster portfolio refreshes.
  - Added historical price fallbacks (5-day window) to ensure data availability on weekends and market holidays.
  - Added `/search` endpoint for real-time ticker and company name lookup.
  - Upgraded `yfinance` to `v1.2.0+` to resolve Yahoo Finance API connection issues.
- **Automated Net Worth Tracking**:
  - Automatically updates the total net worth when logging realized income or expenses by directly adjusting the primary cash balance.
  - Automatically updates the total net worth when making a new asset purchase by deducting the transaction cost from the primary cash balance.

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

