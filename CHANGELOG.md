# Changelog

All notable changes to the **FinDash** project will be documented in this file.

## [Unreleased]

### Added
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

