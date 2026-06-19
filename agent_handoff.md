# Agent Handoff — FinDash

**Last updated:** 2026-06-18  
**Current milestone:** Phases 1–3 shipped  
**Test suite:** 58 passing E2E tests (Playwright + pytest)

---

## 1. Project summary

**FinDash** is a privacy-focused, local-first personal finance and FIRE dashboard.

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind, Recharts |
| State | `localStorage` via `useLocalStorage` in `App.tsx` |
| Attachments | IndexedDB (`FinDashAttachmentsDB`) |
| Market data | Python price server (`VITE_PRICE_SERVER_URL` or `localhost:8001`) |
| AI (optional) | Google Gemini (BYO API key) |
| Tests | Playwright (Python) + pytest, offline mocks |

Fresh browsers show `SetupWizard` until `isSetupComplete=true` in `localStorage`.

---

## 2. What was built (recent phases)

### Phase 1 — Quick wins ✅

| Feature | Key files |
| --- | --- |
| Savings rate trend | `services/savingsRateHistory.ts`, `pages/DashboardPage.tsx` |
| Debt payoff planner | `services/debtPayoff.ts`, `components/DebtPayoffPlanner.tsx` |
| Net worth forecast | `services/netWorthForecast.ts`, `DashboardPage.tsx` |
| Emergency fund tracker | `App.tsx`, `DashboardPage.tsx`, `SettingsPage.tsx` |
| Encrypted backups | `services/cryptoService.ts`, `services/backupService.ts` |
| Receipt/invoice attachments | `services/attachmentService.ts`, `BudgetItemModal.tsx` |

### Phase 2 — Investment analytics ✅

| Feature | Key files |
| --- | --- |
| XIRR / TWR / benchmark | `services/portfolioPerformance.ts`, `components/PortfolioPerformance.tsx` |
| FIFO tax lots & gains | `services/taxLots.ts`, `components/GainsBreakdown.tsx` |
| Enhanced holdings table | `components/InvestmentTable.tsx` |
| Dividend analytics + DRIP | `services/dividendAnalytics.ts`, `components/DividendAnalytics.tsx` |
| Diversification charts | `services/diversification.ts`, `components/DiversificationCharts.tsx` |
| Tax-loss harvesting | `services/taxLossHarvesting.ts`, `components/TaxLossHarvestCard.tsx` |
| Price server `/history`, `/info` | `price-server/main.py` |

### Phase 3 — Cash flow & forecasting ✅

| Feature | Key files |
| --- | --- |
| Budget vs actual variance | `services/budgetVariance.ts`, `pages/CashFlowPage.tsx` |
| Planned events helper | `generatePlannedEvents()` in `services/eventGenerator.ts` |
| Bank CSV import | `services/csvImport.ts`, `components/CsvImportModal.tsx` |
| Gemini categorization (optional) | `services/geminiCategorize.ts` |
| FIRE what-if sandbox | `services/fireScenarios.ts`, `components/FireScenarioSandbox.tsx` |
| In-app alerts | `services/alertEngine.ts`, `components/AlertBell.tsx` |
| E2E (+10 tests) | `tests/e2e/test_phase3_cashflow.py` |

**Cash Flow page** (`#/cashflow`): variance table, trend chart, CSV import button.  
**FIRE page**: scenario sandbox below Monte Carlo simulator.  
**TopBar**: alert bell; **Settings**: alert thresholds + CSV import shortcut.

---

## 3. Architecture notes

```
App.tsx (localStorage state)
  ├── CashFlowPage       — variance, trends, CSV import
  ├── FIREPage           — simulator + scenario sandbox
  ├── TopBar             — AlertBell
  └── services/
        ├── budgetVariance.ts    — planned vs actual
        ├── csvImport.ts         — bank CSV parse + dedup
        ├── fireScenarios.ts     — what-if comparisons
        ├── alertEngine.ts       — bill due, low cash, drift, goals
        └── priceServerConfig.ts — VITE_PRICE_SERVER_URL
```

- **Planned** = `generatePlannedEvents()` (recurring templates only).
- **Actual** = `generateRecurringEvents()` (includes one-offs, overrides, estimated mortgage interest).
- **CSV import** sets `importId` on `BudgetItem` for dedup; Gemini categorization is optional.
- **Alerts** computed via `useMemo` in `App.tsx` — avoid `setState` in alert evaluation (causes infinite loops).

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
| CSV import test | Assert success message in modal — navigation re-seeds and wipes imports |
| Variance override test | Override date must match recurring occurrence date (e.g. 1st of month) |
| FIRE scenario test | Assert deterministic `yearsToFIRE`, not `probabilityOfSuccess` |
| Alert dismiss test | Toggle bell to close dropdown after dismiss |
| Mocks | `/prices`, `/history`, `/info`, Gemini API — all intercepted in `conftest.py` |

---

## 6. New localStorage keys (Phase 3)

| Key | Purpose |
| --- | --- |
| `fireScenarios` | Saved FIRE what-if scenarios (max 5) |
| `alertSettings` | Alert toggles and thresholds |
| `achievedMilestones` | FIRE milestone percentages already notified |

All included in `services/backupService.ts` `BACKUP_STORAGE_KEYS`.

---

## 7. Status & next steps

| Item | Status |
| --- | --- |
| Phases 1–3 | ✅ Shipped |
| E2E suite | ✅ 58 tests passing |
| Phase 4 (roadmap) | FIRE variants, savings goals, mortgage amortization |
| Phase 5 CI | GitHub Actions for E2E on PRs (recommended) |

---

## 8. Key documentation

| File | Purpose |
| --- | --- |
| `README.md` | User-facing setup and features |
| `FEATURE_ROADMAP.md` | Phased feature plan (Phases 1–3 shipped) |
| `CHANGELOG.md` | Version history |
| `DEVELOPMENT_BLOG.md` | Per-commit narrative |
| `SYSTEM_DESIGN.md` | Architecture spec |
| `TECHNICAL_TESTING.md` | E2E test guide |
