# Changelog

All notable changes to the **FinDash** project will be documented in this file.

## [Unreleased]

### Added
- **Data Portability & Sync**:
  - Export capabilities for Transactions and Budget Items to tabular CSV format.
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

