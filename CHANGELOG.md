# Changelog

All notable changes to the **FinDash** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/). Versions correspond to significant development milestones; see [DEVELOPMENT_BLOG.md](DEVELOPMENT_BLOG.md) for narrative context per commit.

---

## [Unreleased]

### Added — Phase 3: Cash Flow & Forecasting

- **Cash Flow page**: Budget vs actual variance by category, 6-month expense trend chart, month picker.
- **Planned vs actual logic**: `generatePlannedEvents()` for recurring templates; full `generateRecurringEvents()` for actuals.
- **Bank CSV import**: Upload, preview, rule-based categorization, optional Gemini enhancement, dedup via `importId`.
- **FIRE what-if sandbox**: Side-by-side scenario comparison on FIRE page; presets (+$500/mo, 7% returns, Lean FIRE).
- **Alerts**: In-app bell for bill due, low cash, rebalance drift, emergency fund met, FIRE milestones, budget over.
- **Alert settings**: Configurable thresholds in Settings.
- **E2E**: `tests/e2e/test_phase3_cashflow.py` (10 tests); suite total **58 passing**.

### Changed

- **Sidebar**: New Cash Flow nav link under Daily Tracking.
- **TopBar**: Alert bell with dismiss support.
- **Backup keys**: `fireScenarios`, `alertSettings`, `achievedMilestones` included in full JSON export.

---

## [2026-06-18] — Phase 2: Investment Analytics

### Added

- **Portfolio performance**: XIRR, TWR, and benchmark comparison (default `VOO`) on the Investments page.
- **FIFO tax lots**: Realized and unrealized gains breakdown with per-ticker summary (generic gains only; no jurisdiction-specific CGT).
- **Enhanced holdings table**: Unrealized gain, realized YTD columns, and proper `formatCurrency` formatting.
- **Dividend analytics**: Yield on cost, projected annual income, and DRIP projection toggle per ticker.
- **Diversification charts**: Sector, geography, currency, and asset-class breakdowns via price-server metadata.
- **Tax-loss harvesting**: Informational suggestions for holdings at a loss.
- **Price server**: `/history` and `/info` endpoints for benchmark prices and ticker metadata.
- **E2E**: `tests/e2e/test_phase2_investments.py` (7 tests).

### Changed

- **Investments page**: Expanded layout — performance, gains, dividends, diversification, then rebalancing.
- **E2E mocks**: `conftest.py` now intercepts `/history` and `/info` for offline tests.
- **Backup keys**: `dripSettings` and `portfolioAnalyticsSettings` included in full JSON export.
- **Price server URL**: Configurable via `VITE_PRICE_SERVER_URL` for deployed environments.

---

## [2026-06-18] — Phase 1: Quick Wins

### Added

- **Savings rate trend**: 12-month savings rate chart on the Dashboard alongside the existing monthly rate metric.
- **Debt payoff planner**: Snowball vs avalanche comparison on Manage Data; payments inferred from linked recurring expenses.
- **Net worth forecast**: Dashed forward projection on the Historical Net Worth chart (1/5/10-year horizons).
- **Emergency fund tracker**: Dashboard progress card with configurable target months in Settings.
- **Encrypted backups**: Optional passphrase encryption (AES-GCM + PBKDF2) for full JSON export/import.
- **Receipt / invoice attachments**: Upload or camera-capture on budget items; stored in IndexedDB; included in full backups. Naming format: `findash-{receipt|invoice}-{slug}-{date}-{id}.{ext}`.
- **Feature roadmap**: `FEATURE_ROADMAP.md` with phased delivery plan.
- **E2E suite expansion**: Migrated to pytest-based Playwright suite — **41 tests** across all major features (`tests/e2e/`).
- **Shared test infrastructure**: `conftest.py` (seed + mocks), `helpers.py`, `pytest.ini`, `TECHNICAL_TESTING.md`.

### Changed

- **Budget item save flow**: New items with pre-generated IDs (for attachments) route to `add` instead of `update`.
- **Manage Data**: Debt payoff planner section added below liability tables.
- **Settings**: Emergency fund target, encrypted export/import UI.

---

## [2026-05-04] — Price Polling & Cash Sync

### Added

- Automatic 5-minute portfolio price polling.
- Cash account synchronization when logging income, expenses, and buy transactions.
- "How it Works" informational modal on Investments and FIRE pages.

---

## [2026-04-30] — Local Price Server

### Added

- Python/FastAPI `price-server` microservice using `yfinance` on port `8001`.
- Batch price fetching with thread-safe caching and 5-day historical fallbacks.
- `/search` endpoint for ticker lookup.

### Removed

- Alpha Vantage integration (API keys, UI toggles, warnings).

### Changed

- Local yfinance server is the default and only market data provider.

---

## [2026-04-27] — FIRE, Rebalancing, AI & Testing

### Added

- Dedicated **FIRE** and **Investments** pages with sidebar navigation.
- Monte Carlo FIRE simulator (`fireSimulation.ts`, `FIRESimulator.tsx`).
- Portfolio rebalancing engine with target allocations and square-root rule.
- Google Gemini AI chatbot widget (BYO API key).
- Glassmorphism UI, framer-motion animations, historical net worth chart, asset allocation treemap.
- Local directory sync via File System Access API (hourly background backup).
- JSON export for transactions and budget items.
- E2E testing framework (Playwright + `scripts/with_server.py`).
- `SYSTEM_DESIGN.md`, `implementation_plan.md`.

### Changed

- Dashboard streamlined to top-level metrics; FIRE and Investments promoted to full routes.

---

## [2026-03-25] — Data Portability & Deployment

### Added

- Full JSON backup export/import in Settings.
- `DEPLOYMENT.md` for Vercel, Netlify, and GitHub Pages.

---

## [2026-01-28] — Project Documentation

### Added

- Comprehensive `README.md` replacing generic AI Studio template.

---

## [2025-10-28] — Initial Release

### Added

- React 19 + TypeScript + Vite scaffold.
- Net worth dashboard, budgeting, calendar, ledger, manage data, settings.
- Setup wizard, dark/light theme, localStorage persistence.
