# E2E Testing Guide

This project uses **Playwright** (Python) for end-to-end testing.

## Prerequisites

- Python 3.x
- Playwright Python package
- Chromium browser for Playwright

If you haven't installed them yet, run:
```bash
python3 -m pip install playwright
python3 -m playwright install chromium
```

## Running Tests

We use a helper script `scripts/with_server.py` to manage the lifecycle of the development server while running tests.

To run the dashboard E2E test:
```bash
python3 scripts/with_server.py --server "npm run dev" --port 3000 -- python3 tests/e2e/test_dashboard.py
```

### How it works:
1. `with_server.py` starts the `npm run dev` server.
2. It waits for the server to be ready on port 3000.
3. It executes the test script `tests/e2e/test_dashboard.py`.
4. It shuts down the server once the test is complete.

## Writing New Tests

New tests should be added to the `tests/e2e/` directory. Use the `test_dashboard.py` as a template.

### Example Template:
```python
from playwright.sync_api import sync_playwright

def test_my_feature():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')
        
        # Your test logic here
        
        browser.close()

if __name__ == "__main__":
    test_my_feature()
```
