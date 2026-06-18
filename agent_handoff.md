# Agent Handoff — FinDash

**Last updated:** 2026-06-18  
**Current milestone:** Phase 1 shipped (`2a4b817`); Phase 2 implemented locally (uncommitted)  
**Test suite:** 48 passing E2E tests (Playwright + pytest)

---

## 1. Project summary

**FinDash** is a privacy-focused, local-first personal finance and FIRE dashboard.

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind, Recharts |
| State | `localStorage` via `useLocalStorage` in `App.tsx` |
| Attachments | IndexedDB (`FinDashAttachmentsDB`) |
| Market data | Local Python price server (`localhost:8001`, yfinance) |
| AI (optional) | Google Gemini (BYO API key) |
| Tests | Playwright (Python) + pytest, offline mocks |

Fresh browsers show `SetupWizard` until `isSetupComplete=true` in `localStorage`.

---

## 2. What was built (recent phases)

### Phase 1 — Quick wins ✅ (`2a4b817`, 2026-06-18)

| Feature | Key files |
| --- | --- |
| Savings rate trend | `services/savingsRateHistory.ts`, `pages/DashboardPage.tsx` |
| Debt payoff planner | `services/debtPayoff.ts`, `components/DebtPayoffPlanner.tsx` |
| Net worth forecast | `services/netWorthForecast.ts`, `DashboardPage.tsx` |
| Emergency fund tracker | `App.tsx`, `DashboardPage.tsx`, `SettingsPage.tsx` |
| Encrypted backups | `services/cryptoService.ts`, `services/backupService.ts` |
| Receipt/invoice attachments | `services/attachmentService.ts`, `BudgetItemModal.tsx` |
| E2E (41 tests at ship) | `tests/e2e/test_phase1_features.py`, expanded suite |

### Phase 2 — Investment analytics ✅ (local, unreleased)

| Feature | Key files |
| --- | --- |
| XIRR / TWR / benchmark | `services/portfolioPerformance.ts`, `components/PortfolioPerformance.tsx` |
| FIFO tax lots & gains | `services/taxLots.ts`, `components/GainsBreakdown.tsx` |
| Enhanced holdings table | `components/InvestmentTable.tsx` |
| Dividend analytics + DRIP | `services/dividendAnalytics.ts`, `components/DividendAnalytics.tsx` |
| Diversification charts | `services/diversification.ts`, `components/DiversificationCharts.tsx` |
| Tax-loss harvesting | `services/taxLossHarvesting.ts`, `components/TaxLossHarvestCard.tsx` |
| Price server `/history`, `/info` | `price-server/main.py` |
| E2E (+7 tests) | `tests/e2e/test_phase2_investments.py` |

**Investments page section order:** Performance → Holdings → Gains → Tax-loss → Dividends → Diversification → Rebalancing.

---

## 3. Architecture notes

```
App.tsx (localStorage state)
  ├── DashboardPage      — net worth, savings trend, forecast, emergency fund
  ├── InvestmentsPage    — analytics (Phase 2), rebalancing
  ├── ManageDataPage     — CRUD + debt payoff planner
  ├── SettingsPage       — backup, encryption, sync, profile
  └── services/
        ├── taxLots.ts           — FIFO realized/unrealized
        ├── portfolioPerformance.ts — XIRR, TWR, benchmark
        ├── attachmentService.ts — IndexedDB blobs
        ├── cryptoService.ts     — AES-GCM backup encryption
        └── backupService.ts     — centralized export keys
```

- **Holdings** in `App.tsx` use average cost for display; **realized gains** use FIFO in `taxLots.ts` (source of truth for realized column).
- **Attachments** must stay in IndexedDB — never `localStorage` (5 MB cap).
- **DRIP toggle** is projection-only; does not create buy transactions.
- **CGT** is generic only (no AU/US tax rules) per product decision.

---

## 4. How to run

### App
```bash
npm install && npm run dev          # Terminal 1 — :3000
cd price-server && pip install -r requirements.txt && python3 main.py  # Terminal 2 — :8001
```

### Tests
```bash
python3 -m pip install -r tests/requirements-dev.txt
python3 -m playwright install chromium
python3 scripts/with_server.py --server "npm run dev" --port 3000 -- python3 -m pytest tests/e2e
```

Reports: `reports/report.html`, `test-results/` (git-ignored).

---

## 5. E2E design decisions & gotchas

| Topic | Detail |
| --- | --- |
| Seeding | `add_init_script` seeds `localStorage` before boot; re-runs on navigation |
| Import test | Does **not** seed — reload must load imported file as source of truth |
| Hash routes | `window.location.reload()` preserves `#/settings` |
| Monte Carlo | Assert deterministic values (pre-tax target), not random probability % |
| Attachment test | Use `today_iso()` for expense date; image compression falls back in headless |
| DRIP test | Assert `localStorage` after toggle (seed resets on reload) |
| Debt planner | Scope liability table via `data-testid="manage-data-table"` to avoid duplicate rows |
| Mocks | `/prices`, `/history`, `/info`, Gemini API — all intercepted in `conftest.py` |

---

## 6. New localStorage keys

| Key | Purpose |
| --- | --- |
| `emergencyFundTargetMonths` | Emergency fund target (default 6) |
| `dripSettings` | Per-ticker DRIP projection toggles |
| `portfolioAnalyticsSettings` | Benchmark ticker (`VOO`), period (`1y`/`all`) |

All included in `services/backupService.ts` `BACKUP_STORAGE_KEYS`.

---

## 7. Status & next steps

| Item | Status |
| --- | --- |
| Phase 1 | ✅ Committed (`2a4b817`) |
| Phase 2 | ✅ Implemented, **not yet committed** |
| E2E suite | ✅ 48 tests passing |
| Phase 3 (roadmap) | Budget vs actual, CSV import, what-if sandbox, alerts |
| Phase 5 CI | GitHub Actions for E2E on PRs (recommended parallel work) |

### Suggested immediate follow-ups

1. Commit Phase 2 changes.
2. Add `data-testid` hooks anywhere chart/icon selectors prove brittle.
3. Wire directory-sync and reset flows into E2E.
4. Begin Phase 3 planning (`FEATURE_ROADMAP.md`).

---

## 8. Key documentation

| File | Purpose |
| --- | --- |
| `README.md` | User-facing setup and features |
| `FEATURE_ROADMAP.md` | Phased feature plan (Phases 1–2 shipped) |
| `CHANGELOG.md` | Version history |
| `DEVELOPMENT_BLOG.md` | Per-commit narrative with difficulties & resolutions |
| `SYSTEM_DESIGN.md` | Architecture spec |
| `TECHNICAL_TESTING.md` | E2E test guide |
