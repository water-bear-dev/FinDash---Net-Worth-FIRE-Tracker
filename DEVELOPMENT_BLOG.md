# FinDash Development Blog

A chronological journal of major commits — what was built, what broke, and how it was fixed. Each entry maps to a git commit (or pending work). See [CHANGELOG.md](CHANGELOG.md) for the structured release notes.

---

## Entry 0 — Project genesis (`dc1dc86`, 2025-10-28)

**Commit:** `feat: Initialize project with Vite and React`

### Features
- React 19 + TypeScript + Vite scaffold.
- Core pages: Dashboard, Budgeting, Calendar, Ledger, Manage Data, Settings.
- Setup wizard, dark/light theme, `localStorage` persistence.

### Difficulties
- Greenfield project — no existing patterns for state management or financial modeling.

### Resolution
- Centralized state in `App.tsx` with a `useLocalStorage` hook; each page receives props and callbacks. Simple and sufficient for a local-first app.

---

## Entry 1 — Sidebar & calendar polish (`35d0513`, `53129f2`, `3b72a1c`, 2025-10–11)

**Commits:** Sidebar collapse, calendar updates, QOL changes

### Features
- Collapsible sidebar for more chart real estate.
- Calendar view refinements for recurring income/expense visibility.

### Difficulties
- Minor layout regressions when sidebar state toggled on mobile.

### Resolution
- Responsive breakpoints and persisted collapse state in `localStorage`.

---

## Entry 2 — Documentation overhaul (`7d85991`, 2026-01-28)

**Commit:** `docs: Replace generic AI Studio app README with detailed FinDash project documentation`

### Features
- Comprehensive `README.md` with feature list, tech stack, and setup instructions.

### Difficulties
- README still described a generic AI Studio template, not the actual product.

### Resolution
- Rewrote from scratch based on implemented features at the time.

---

## Entry 3 — Data portability & deployment (`b01fc61`, `b3ebd7c`, 2026-03-25)

**Commits:** JSON export/import, `DEPLOYMENT.md`

### Features
- Full JSON backup export/import in Settings.
- `DEPLOYMENT.md` for Vercel, Netlify, and GitHub Pages.

### Difficulties
- Users had no way to migrate data between browsers or recover from cleared storage.

### Resolution
- Single JSON blob export covering all `localStorage` keys; import replaces state atomically.

---

## Entry 4 — FIRE, investments & architecture (`59978ea` → `6a565db`, 2026-04-27)

**Commits:** FIRE/Investment pages, rebalancing engine, FIRE simulator, directory sync, CSV export

### Features
- Dedicated **FIRE** and **Investments** sidebar routes.
- Monte Carlo FIRE simulator (`fireSimulation.ts`).
- Portfolio rebalancing with target allocations and square-root rule.
- Local directory sync via File System Access API.
- `SYSTEM_DESIGN.md` and `implementation_plan.md`.

### Difficulties
- Dashboard was overloaded — FIRE and investment tools competed for space with net-worth metrics.
- Rebalancing math needed to handle fractional shares and minimum trade sizes.

### Resolution
- Split FIRE and Investments into full pages; Dashboard kept high-level KPIs only.
- Rebalancing engine outputs recommended trades with clear buy/sell rationale.

---

## Entry 5 — UI polish & historical tracking (`14ed601`, 2026-04-27)

**Commit:** `feat: implement glassmorphism UI, framer-motion animations, historical net worth tracking, and asset allocation treemaps`

### Features
- Glassmorphism card styling and framer-motion page transitions.
- Monthly historical net worth line chart.
- Asset allocation treemap on Dashboard.

### Difficulties
- Treemap sizing with very small holdings produced unreadable labels.

### Resolution
- Minimum cell size threshold and abbreviated labels for tiny slices.

---

## Entry 6 — E2E testing framework (`e0d0c3d`, 2026-04-27)

**Commit:** `feat: add E2E testing framework using Playwright with server management utility`

### Features
- Playwright (Python) test harness.
- `scripts/with_server.py` — starts Vite dev server, runs tests, tears down.
- Initial smoke tests for navigation and setup wizard.

### Difficulties
- Tests needed a running dev server; CI and local runs had to be reproducible.
- `localStorage` seeding had to happen before React bootstrapped.

### Resolution
- `add_init_script` in `conftest.py` seeds data before page load.
- Server wrapper script handles port binding and cleanup.

---

## Entry 7 — AI chatbot (`29202b2`, 2026-04-27)

**Commit:** `feat: integrate Google Gemini AI chatbot widget`

### Features
- Floating Gemini chat widget with BYO API key.
- Persistent key in `localStorage`; optional enable/disable in Settings.

### Difficulties
- Earlier experiment used Gemini for market research — switched to Alpha Vantage (`2d719f8`), then removed AV entirely.

### Resolution
- Chatbot kept as optional assistant; market data decoupled to local price server (see Entry 9).

---

## Entry 8 — FIRE dashboard upgrades (`804ce30`, 2026-04-27)

**Commit:** `feat: enhance FIRE dashboard with interactive goal management and upgrade rebalancing engine`

### Features
- Interactive FIRE goal editing on the FIRE page.
- Rebalancing engine: advanced settings, monthly savings integration.

### Difficulties
- Pre-tax vs post-tax FIRE targets confused users in Monte Carlo output.

### Resolution
- E2E tests assert deterministic pre-tax values; UI labels clarify tax mode.

---

## Entry 9 — Local price server (`9068635`, 2026-04-30)

**Commit:** `feat: replace Alpha Vantage with a custom Python local price server`

### Features
- FastAPI + `yfinance` microservice on port `8001`.
- Batch `/prices`, `/search`; 5-day historical fallbacks; thread-safe cache.

### Difficulties
- Alpha Vantage rate limits, API key management, and unreliable free tier.
- yfinance can be slow or return stale data for illiquid tickers.

### Resolution
- Self-hosted server with caching; removed all Alpha Vantage code and UI.
- Graceful fallback to last known price when live fetch fails.

---

## Entry 10 — Price polling & cash sync (`91ed857`, 2026-05-04)

**Commit:** `feat: add automatic 5-minute price polling, cash account synchronization`

### Features
- Background 5-minute portfolio price refresh.
- Cash accounts auto-update when logging income, expenses, and buy transactions.
- "How it Works" modal on Investments and FIRE pages.

### Difficulties
- Manual cash adjustments drifted from transaction ledger over time.

### Resolution
- Transaction handlers now sync linked cash account balances on save.

---

## Entry 11 — Phase 1: Quick wins (`2a4b817`, 2026-06-18)

**Commit:** `feat: enhance budgeting features with attachment support, savings rate tracking, and emergency fund metrics`

### Features shipped
| Feature | Description |
| --- | --- |
| Savings rate trend | 12-month chart on Dashboard |
| Debt payoff planner | Snowball vs avalanche on Manage Data |
| Net worth forecast | Dashed projection on historical chart (1/5/10y) |
| Emergency fund tracker | Progress card + Settings target months |
| Encrypted backups | AES-GCM + PBKDF2 passphrase encryption |
| Receipt/invoice attachments | IndexedDB storage, camera/upload, backup inclusion |
| E2E expansion | 41 tests, pytest suite, `FEATURE_ROADMAP.md` |

### Difficulties & resolutions

**1. Forecast chart rendered a single flat line**  
Recharts could not distinguish actual vs projected on one data key.  
→ Split into `actualNetWorth` and `forecastNetWorth` with a bridge point at the last historical date.

**2. New budget items with pre-generated UUIDs failed to save**  
Attachments need an ID before upload, but save handlers treated any ID as "update."  
→ Fixed `addOrUpdate` in `App.tsx` and save handlers in `ExpensesPage`, `IncomesPage`, `CalendarPage` to insert when ID is unknown.

**3. Image compression failed in headless Playwright**  
`canvas.toBlob` returns null in Chromium headless.  
→ Try/catch with fallback to store the original file uncompressed.

**4. Attachment E2E test could not find the expense row**  
Test used a hardcoded date in the wrong month.  
→ Switched to `today_iso()` helper so the row appears in the current calendar month.

**5. Debt planner E2E matched duplicate table rows**  
Manage Data liability table and debt planner both listed liabilities.  
→ Added `data-testid="manage-data-table"` to scope selectors.

---

## Entry 12 — Phase 2: Investment analytics *(pending commit, 2026-06-18)*

**Status:** Implemented locally; not yet committed. Correlates to unreleased work on branch `main`.

### Features shipped
| Feature | Description |
| --- | --- |
| Portfolio performance | XIRR, TWR, benchmark comparison (default VOO), alpha |
| FIFO tax lots | Realized/unrealized gains breakdown (generic, no jurisdiction CGT) |
| Enhanced holdings table | Unrealized gain, realized YTD, `formatCurrency` |
| Dividend analytics | Yield on cost, projected income, DRIP toggle per ticker |
| Diversification | Sector, geography, currency, asset-class pie charts |
| Tax-loss harvesting | Informational loss-harvest suggestions |
| Price server | New `/history` and `/info` endpoints |
| E2E | `test_phase2_investments.py` (+7 tests → **48 total**) |

### Difficulties & resolutions

**1. XIRR Newton-Raphson divergence**  
Some cash-flow sequences caused the solver to overshoot.  
→ Capped iterations, bounded rate search, return `null` when non-convergent instead of NaN.

**2. Holdings display vs FIFO realized gains mismatch**  
`App.tsx` uses average cost for live holdings; realized gains need FIFO.  
→ `taxLots.ts` is source of truth for realized/unrealized columns; holdings table reads from it.

**3. Benchmark and metadata require network calls**  
E2E tests run offline.  
→ Extended `conftest.py` to mock `/history` and `/info` with fixture JSON.

**4. DRIP toggle lost on page reload in tests**  
Seed script resets `localStorage` on navigation.  
→ DRIP test asserts `localStorage` immediately after toggle instead of after reload.

**5. Diversification depends on ticker metadata**  
yfinance sector/geography not always available.  
→ Fallback to "Unknown" bucket; charts still render with partial data.

**6. Product scope: CGT rules**  
AU/US capital gains tax was considered then deferred.  
→ Shipped generic FIFO gains only; jurisdiction rules reserved for a future phase.

### New files
```
services/taxLots.ts
services/portfolioPerformance.ts
services/dividendAnalytics.ts
services/diversification.ts
services/taxLossHarvesting.ts
components/GainsBreakdown.tsx
components/PortfolioPerformance.tsx
components/DividendAnalytics.tsx
components/DiversificationCharts.tsx
components/TaxLossHarvestCard.tsx
tests/e2e/test_phase2_investments.py
```

---

## Entry 13 — Phase 3: Cash flow & forecasting (2026-06-18)

**Status:** Shipped locally.

### Features shipped
| Feature | Description |
| --- | --- |
| Cash Flow page | Budget vs actual variance, 6-month category trends, month picker |
| CSV bank import | Rule-based categorization, optional Gemini, dedup via `importId` |
| FIRE what-if sandbox | Side-by-side scenarios with presets on FIRE page |
| In-app alerts | Bill due, low cash, rebalance drift, emergency fund, FIRE milestones |
| E2E (+10 tests) | `test_phase3_cashflow.py` → **58 total** |

### Difficulties & resolutions

**1. Infinite re-render from alert `useEffect`**  
`setActiveAlerts` + `setAchievedMilestones` in the same effect caused "Maximum update depth exceeded."  
→ Switched to `useMemo` for alert evaluation; separate effect for milestone persistence.

**2. CSV import E2E lost data on navigation**  
Init script re-seeds `localStorage` on every navigation, wiping imported rows.  
→ Test asserts import success message in modal instead of navigating to Expenses.

**3. Variance test showed $2,500 not $500**  
Override on a different day than the recurring occurrence — both counted in actuals.  
→ Test uses override on the 1st of the month to suppress the recurring event.

**4. TopBar JSX structure**  
AlertBell integration initially broke JSX closing tags during HMR.  
→ Fixed wrapper div around bell + theme toggle.

### New files
```
services/budgetVariance.ts
services/csvImport.ts
services/geminiCategorize.ts
services/fireScenarios.ts
services/alertEngine.ts
pages/CashFlowPage.tsx
components/CsvImportModal.tsx
components/FireScenarioSandbox.tsx
components/AlertBell.tsx
tests/e2e/test_phase3_cashflow.py
```

---

## What's next

**Phase 4 — Planning depth & FIRE variants** (per `FEATURE_ROADMAP.md`):
- FIRE variants (Coast / Barista / Lean / Fat)
- Multiple savings goals
- Mortgage amortization schedule

**Recommended parallel work:**
- Commit all Phase 2 + Phase 3 changes
- GitHub Actions CI for the 58-test E2E suite

---

*This blog is maintained alongside [CHANGELOG.md](CHANGELOG.md) and [agent_handoff.md](agent_handoff.md).*
