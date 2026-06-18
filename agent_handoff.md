# Agent Handoff — Comprehensive E2E Test Suite

**Date:** 2026-06-17
**Scope:** Implemented a comprehensive, deterministic end-to-end (E2E) test suite for FinDash using **Playwright (Python) + pytest**, migrating away from the single ad-hoc script. No application source code was changed.

---

## 1. Summary

FinDash is a privacy-focused, local-first personal finance / FIRE dashboard (React 19 + TypeScript + Vite). All user state lives in the browser's `localStorage`, and a fresh browser renders the `SetupWizard` instead of the app. Market prices come from a local Python price server (`localhost:8001/prices`) and an optional Gemini chatbot calls Google's API.

To make E2E tests **deterministic and offline**, the suite:

1. Seeds `localStorage` (with `isSetupComplete=true`) **before the app boots** so the wizard is skipped and the app starts from a known state.
2. Intercepts the price server and Gemini network calls and returns stable, mocked responses.

**Result:** 35 tests, all passing (`35 passed`).

---

## 2. What was built

### Tooling & configuration
| File | Purpose |
| --- | --- |
| `tests/requirements-dev.txt` | Dev deps: `pytest`, `pytest-playwright`, `pytest-html` |
| `pytest.ini` | `testpaths=tests/e2e`, HTML + JUnit reporting, screenshot/video/trace on failure, base URL |
| `.gitignore` | Added `reports/`, `test-results/`, `.pytest_cache/` |

### Shared fixtures & helpers
| File | Contents |
| --- | --- |
| `tests/e2e/conftest.py` | `seed(overrides, prices)` — seeds `localStorage` via `add_init_script` + registers mocks; `mocks(prices)` — network mocks only; `default_state()` baseline dataset; `DEFAULT_PRICES` deterministic prices; price + Gemini route handlers |
| `tests/e2e/helpers.py` | `open_app(page)`, `goto(page, label)` (sidebar nav), `card(page, title)`, `today_iso()`, `months_ago_iso(n, day)`, `BASE_URL` |

### Test files (`tests/e2e/`)
| File | Coverage |
| --- | --- |
| `test_setup_wizard.py` | Full 5-step wizard completes & persists; "Next Step" disabled until name entered; "Skip for now" path |
| `test_dashboard.py` | Net worth = assets − liabilities; asset/liability totals; holdings reflect mocked prices |
| `test_manage_data.py` | Add/edit/delete cash account; add property; add liability |
| `test_ledger_transactions.py` | Add buy (+ auto budget expense created); add sell; add/delete dividend |
| `test_budget.py` | Add one-time income/expense; recurring generation; edit-scope options; delete "this & future" |
| `test_calendar.py` | Seeded events render in month view; Create modal opens; day-view switch |
| `test_fire.py` | FI number from SWR; pre-tax target; Monte Carlo % renders; live SWR recompute |
| `test_investments_rebalancing.py` | Mocked-price holdings table; set target allocations; buy recommendations for new capital |
| `test_settings.py` | Currency change updates formatting; theme toggle persists; enabling Gemini chatbot shows widget |
| `test_data_portability.py` | Export full backup & transactions downloads; import backup via file chooser → reload loads state |

### Docs
- `TECHNICAL_TESTING.md` rewritten: install steps, run commands (single test + full suite), fixtures/seeding/mocking explanation, where reports land.

---

## 3. How to run

```bash
# One-time setup
python3 -m pip install -r tests/requirements-dev.txt
python3 -m playwright install chromium

# Full suite (starts dev server on :3000, runs pytest, stops server)
python3 scripts/with_server.py --server "npm run dev" --port 3000 -- python3 -m pytest tests/e2e

# Single file / single test
python3 scripts/with_server.py --server "npm run dev" --port 3000 -- python3 -m pytest tests/e2e/test_fire.py
python3 scripts/with_server.py --server "npm run dev" --port 3000 -- python3 -m pytest tests/e2e/test_fire.py::test_fi_number_uses_swr

# If a dev server is already running
python3 -m pytest tests/e2e
```

**Reports/artifacts** (git-ignored): `reports/report.html`, `reports/junit.xml`, `test-results/` (screenshots/videos/traces on failure).

---

## 4. Key design decisions & gotchas

- **Seeding survives in-app navigation** (`add_init_script` re-runs on every navigation), but the **import test deliberately does NOT seed** — the import flow calls `window.location.reload()`, and the imported file must be the source of truth.
- **`window.location.reload()` preserves the hash route.** After import on `#/settings`, the app reloads back onto Settings (not Dashboard); the test navigates to Dashboard afterward to assert imported data.
- **Modal field selectors must be scoped.** The Ledger page's transaction-history filter and the Add Transaction/Dividend modals both use `input[name="ticker"]`; modal interactions are scoped via a `_modal(page, heading)` locator.
- **Monte Carlo uses `Math.random`**, so FIRE tests assert deterministic outputs (e.g. pre-tax target `$70,588.24`) and visibility/pattern for the probability — not exact random values.
- **Seed unique currency values** (e.g. `$75,000.00`) so text assertions are unambiguous; use `.first` where a value legitimately appears more than once (e.g. both holdings showing `+33.33%`).
- **Playwright browser path:** in this environment `PLAYWRIGHT_BROWSERS_PATH` pointed at a sandbox cache; both `chromium` and `chromium-headless-shell` had to be installed there.

---

## 5. Status & possible follow-ups

- **Status:** Complete. All 35 tests pass against the live dev server.
- **No app source changes** were required. If any element ever proves too brittle (icon-only buttons, charts), consider adding a few `data-testid` hooks rather than relying on structural selectors.
- **Possible extensions:** CI workflow (GitHub Actions) invoking the suite; cross-browser runs (firefox/webkit via pytest-playwright `--browser`); coverage for the directory-sync (`File System Access API`) and reset/"delete my data" flows.
