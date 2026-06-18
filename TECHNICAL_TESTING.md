# E2E Testing Guide

This project uses **Playwright** (Python) driven by **pytest** for end-to-end testing.

## Prerequisites

- Python 3.x
- The dev dependencies in `tests/requirements-dev.txt`
- The Chromium browser for Playwright

Install everything with:
```bash
python3 -m pip install -r tests/requirements-dev.txt
python3 -m playwright install chromium
```

## Running Tests

We use the helper script `scripts/with_server.py` to start the Vite dev server,
wait for it to be ready on port 3000, run the suite, then shut the server down.

Run the entire suite:
```bash
python3 scripts/with_server.py --server "npm run dev" --port 3000 -- python3 -m pytest tests/e2e
```

Run a single test file or test:
```bash
python3 scripts/with_server.py --server "npm run dev" --port 3000 -- python3 -m pytest tests/e2e/test_dashboard.py
python3 scripts/with_server.py --server "npm run dev" --port 3000 -- python3 -m pytest tests/e2e/test_fire.py::test_fi_number_uses_swr
```

If you already have the dev server running, you can invoke pytest directly:
```bash
python3 -m pytest tests/e2e
```

### Reports & artifacts

`pytest.ini` configures reporting automatically:

- `reports/report.html` - self-contained HTML report
- `reports/junit.xml` - JUnit XML (for CI)
- `test-results/` - screenshots, videos, and traces captured on failure

These directories are git-ignored.

## How it works

The app is **local-first**: all state lives in the browser's `localStorage`, and a
fresh browser shows the SetupWizard instead of the Dashboard. The suite makes
tests deterministic and offline via fixtures in `tests/e2e/conftest.py`:

- **`seed(overrides=None, prices=None)`** - seeds `localStorage` (with
  `isSetupComplete=true`) using `page.add_init_script` *before* the app boots, so
  the wizard is skipped and the app starts from a known state. Pass `overrides`
  to customise accounts, transactions, budget items, FIRE settings, etc.
- **`mocks(prices=None)`** - registers network interception only (no seeding).

Both fixtures intercept:

- the local price server (`http://localhost:8001/prices`) and return deterministic
  prices (see `DEFAULT_PRICES` in `conftest.py`), and
- the Google Gemini API, so the chatbot path never makes a real network call.

Shared navigation/utility helpers live in `tests/e2e/helpers.py`
(`open_app`, `goto`, `card`, `today_iso`, `months_ago_iso`).

## Writing New Tests

Add new tests to `tests/e2e/` as `test_*.py` files with `test_*` functions. Use the
`seed` and `page` fixtures and the helpers, for example:

```python
from playwright.sync_api import expect
from helpers import goto, open_app


def test_my_feature(seed, page):
    seed({"cashAccounts": [{"id": "c1", "name": "Checking", "balance": 25000}]})
    open_app(page)
    goto(page, "Manage Data")
    expect(page.get_by_role("heading", name="Manage Data", level=1)).to_be_visible()
```

Notes:

- Seed deterministic, unique values so currency strings (e.g. `$25,000.00`) are
  easy and unambiguous to assert.
- Prefer role/text/placeholder selectors that mirror what a user sees.
- The Monte Carlo simulation uses randomness; assert ranges/visibility rather than
  exact probability values (deterministic outputs like the pre-tax target are fine
  to assert exactly).
