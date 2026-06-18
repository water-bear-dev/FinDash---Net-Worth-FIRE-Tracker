# FinDash — Feature Roadmap

This roadmap outlines proposed enhancements to **FinDash**, prioritized by value-to-effort and grouped into delivery phases. Each item notes how it leverages the **existing data model** (`types.ts`) and current services so we can sequence work pragmatically.

> Legend
> - **Effort:** S (small) · M (medium) · L (large)
> - **Value:** ★ (nice) · ★★ (strong) · ★★★ (core to FIRE)
> - **Reuses:** existing types/services the feature builds on

---

## Guiding principles

- **Local-first & private** — every feature must work entirely client-side (`localStorage`), consistent with the zero-knowledge architecture.
- **Reuse before rebuild** — prefer extending existing types (`BudgetItem`, `Liability`, `Transaction`, `Dividend`, `HistoricalNetWorth`) and services (`fireSimulation.ts`, `rebalance.ts`, `eventGenerator.ts`).
- **Ship incrementally** — each phase is independently shippable and testable via the existing Playwright suite.

---

## Phase 1 — Quick wins (high value / low effort) ✅ Shipped

These leverage data already captured and slot into existing pages/charts.

| Feature | Status | Notes |
| --- | --- | --- |
| **Savings rate trend** | ✅ | 12-month trend chart + existing monthly rate card on Dashboard |
| **Debt payoff planner** | ✅ | Snowball vs avalanche on Manage Data page |
| **Net worth forecast line** | ✅ | Dashed forecast on Historical Net Worth chart (1/5/10 yr) |
| **Emergency fund tracker** | ✅ | Dashboard card + configurable target in Settings |
| **Encrypted backups** | ✅ | Optional passphrase encryption on full JSON export/import |
| **Receipt / invoice attachments** | ✅ | Upload/camera on budget items; stored in IndexedDB; included in backups |

**Exit criteria:** Each feature has a dashboard surface, persists settings to `localStorage`, and is covered by an E2E test.

---

## Phase 2 — Investment analytics ✅ Shipped

Builds on the existing transaction ledger and dividend records.

| Feature | Status | Notes |
| --- | --- | --- |
| **Performance metrics (XIRR / TWR)** | ✅ | Portfolio XIRR, TWR, benchmark comparison on Investments page |
| **Realized vs. unrealized gains** | ✅ | FIFO tax lots; generic gains (no jurisdiction-specific CGT) |
| **Dividend analytics + DRIP** | ✅ | Yield on cost, projected income, DRIP projection toggle |
| **Diversification breakdowns** | ✅ | Sector / geography / currency / asset class charts |
| **Tax-loss harvesting suggestions** | ✅ | Informational card for holdings at a loss |

**Exit criteria:** Investments page shows return metrics and gain/loss breakdowns; calculations validated via E2E tests.

---

## Phase 2 (original spec) — reference

<details>
<summary>Original planning notes</summary>

| Feature | Value | Effort | Reuses | Notes |
| --- | --- | --- | --- | --- |
| **Performance metrics (XIRR / time-weighted return)** | ★★★ | M | `Transaction` | True money-weighted returns + benchmark comparison (e.g. vs VOO). |
| **Realized vs. unrealized gains** | ★★ | M–L | `Transaction` | FIFO tax-lot tracking (generic gains only). |
| **Dividend analytics + DRIP** | ★★ | S–M | `Dividend` | Yield-on-cost, annual income projection, reinvestment toggle. |
| **Diversification breakdowns** | ★ | S | `Investment`, `AllocationDonutChart` | Sector / geography / currency exposure charts. |
| **Tax-loss harvesting suggestions** | ★ | M | `Investment`, `Transaction` | Flag holdings at a loss that could offset realized gains. |

</details>

---

## Phase 3 — Cash flow & forecasting

Deepens budgeting insight and forward planning.

| Feature | Value | Effort | Reuses | Notes |
| --- | --- | --- | --- | --- |
| **Budget vs. actual variance** | ★★ | M | `BudgetItem`, `eventGenerator.ts` | Compare projected recurring amounts to logged reality + category trends. |
| **Bank/CSV statement import** | ★★ | M–L | `BudgetItem`, `Transaction`, Gemini assistant | Auto-create entries; AI auto-categorization. |
| **What-if scenario sandbox** | ★★ | M | `fireSimulation.ts` | Clone-and-compare ("save $500 more/month", "returns 5% vs 7%"). |
| **Alerts / notifications** | ★ | M | `rebalance.ts`, `eventGenerator.ts` | Bill due, low cash, rebalance drift, goal reached. |

**Exit criteria:** Users can import a statement, see budget variance, and run a side-by-side scenario.

---

## Phase 4 — Planning depth & FIRE variants

Expands the planning engine for richer retirement modeling.

| Feature | Value | Effort | Reuses | Notes |
| --- | --- | --- | --- | --- |
| **FIRE variants (Coast / Barista / Lean / Fat)** | ★★ | M | `fireSimulation.ts`, `FireSettings` | Different target/withdrawal assumptions, shown side-by-side. |
| **Multiple savings goals** | ★★ | M | new `Goal` type | House deposit, car, travel — progress bars + projected dates. |
| **Mortgage amortization schedule** | ★ | M | `Liability` | Principal vs. interest breakdown + extra-repayment what-if. |
| **Tax-advantaged account modeling** | ★ | L | `CashAccount` / `Investment` | 401k / IRA / AU Super with contribution caps and access-age rules. |

**Exit criteria:** FIRE page supports multiple variants; goals tracked independently of FIRE.

---

## Phase 5 — Platform & infrastructure

Hardens the app and developer workflow.

| Feature | Value | Effort | Reuses | Notes |
| --- | --- | --- | --- | --- |
| **PWA / installable offline app** | ★★ | M | existing local-first design | Installable + offline caching; natural fit. |
| **Household / multi-profile** | ★ | L | `UserProfile`, full state | Joint + individual views for partners. |
| **CI workflow (GitHub Actions)** | ★ | S | existing Playwright suite (35 tests) | Run E2E on PRs; cross-browser via `--browser`. |
| **Multi-currency holdings + FX** | ★ | L | `Investment`, price server | Per-holding currency with conversion to base. |

**Exit criteria:** App installs as a PWA; CI runs the test suite on every PR.

---

## Suggested sequencing summary

1. **Phase 1** first — maximum impact for minimal effort using data already on hand.
2. **Phase 2** next — unlocks the analytics that serious FIRE users expect.
3. **Phases 3–4** broaden planning and cash-flow depth.
4. **Phase 5** can run in parallel (esp. CI, which should land early).

## Cross-cutting requirements

- **Testing:** every feature ships with Playwright E2E coverage; consider `data-testid` hooks for chart-heavy views.
- **Docs:** update `README.md`, `CHANGELOG.md`, and `SYSTEM_DESIGN.md` per feature.
- **Privacy:** no feature may introduce a remote data dependency beyond the local price server and user-supplied Gemini key.
