# Changelog

All notable changes to the **FinDash** project will be documented in this file.

## [Unreleased]

### Added
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

