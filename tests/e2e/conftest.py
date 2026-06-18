"""Shared Playwright + pytest fixtures for the FinDash E2E suite.

The app is local-first: all state lives in ``localStorage`` and a fresh browser
shows the SetupWizard instead of the Dashboard. To make tests deterministic we:

1. Seed ``localStorage`` via ``page.add_init_script`` *before* the app boots so
   ``isSetupComplete`` is ``true`` and the wizard is skipped.
2. Intercept the local price server (``localhost:8001/prices``) and the Gemini
   API so tests run fully offline with stable values.
"""

import json
import re
from urllib.parse import unquote

import pytest

# Deterministic prices returned by the mocked local price server.
DEFAULT_PRICES = {
    "VOO": 400.0,
    "AAPL": 200.0,
    "MSFT": 300.0,
    "NVDA": 500.0,
    "ETH-USD": 3000.0,
    "CBA.AX": 100.0,
}

# Price used for any ticker not explicitly listed above.
FALLBACK_PRICE = 100.0


def default_state():
    """A realistic baseline localStorage profile with the wizard already done."""
    return {
        "isSetupComplete": True,
        "userProfile": {"name": "Test User", "email": "test@example.com"},
        "cashAccounts": [{"id": "c1", "name": "Checking", "balance": 10000}],
        "properties": [],
        "liabilities": [],
        "transactions": [],
        "dividends": [],
        "budgetItems": [],
        "targetAnnualSpending": 60000,
        "fireSettings": {
            "swr": 4.0,
            "inflationRate": 2.5,
            "expectedReturn": 7.0,
            "taxRate": 15.0,
            "simulationYears": 30,
        },
        "currency": "USD",
        "theme": "dark",
        "useLocalPriceServer": True,
        "isChatbotEnabled": False,
        "geminiApiKey": "",
        "targetAllocations": [],
        "rebalancingSettings": {"brokerageFee": 9.5, "expectedReturn": 7.0},
        "emergencyFundTargetMonths": 6,
        "historicalNetWorth": [],
        "dripSettings": {},
        "portfolioAnalyticsSettings": {"benchmarkTicker": "VOO", "performancePeriod": "1y"},
    }


def _price_handler(prices):
    def handle(route):
        match = re.search(r"tickers=([^&]*)", route.request.url)
        tickers = []
        if match:
            tickers = [t for t in unquote(match.group(1)).split(",") if t]
        body = [{"symbol": t, "price": prices.get(t, FALLBACK_PRICE)} for t in tickers]
        route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps(body),
        )

    return handle


def _gemini_handler(route):
    route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps(
            {"candidates": [{"content": {"parts": [{"text": "Test response."}]}}]}
        ),
    )


def _history_handler(route):
    ticker_match = re.search(r"ticker=([^&]*)", route.request.url)
    ticker = unquote(ticker_match.group(1)) if ticker_match else "VOO"
    price = DEFAULT_PRICES.get(ticker, FALLBACK_PRICE)
    body = [
        {"date": "2024-01-01", "close": price * 0.85},
        {"date": "2024-06-01", "close": price * 0.92},
        {"date": "2025-01-01", "close": price * 0.98},
        {"date": "2025-06-01", "close": price},
    ]
    route.fulfill(status=200, content_type="application/json", body=json.dumps(body))


def _info_handler(route):
    match = re.search(r"tickers=([^&]*)", route.request.url)
    tickers = []
    if match:
        tickers = [t for t in unquote(match.group(1)).split(",") if t]
    body = [
        {
            "symbol": t,
            "sector": "Technology" if t == "AAPL" else "ETF",
            "industry": "Consumer Electronics" if t == "AAPL" else "Broad Market",
            "country": "United States",
            "currency": "USD",
        }
        for t in tickers
    ]
    route.fulfill(status=200, content_type="application/json", body=json.dumps(body))


def setup_mocks(page, prices=None):
    """Register network interception for the price server and Gemini."""
    merged = dict(DEFAULT_PRICES)
    if prices:
        merged.update(prices)
    page.route("**/prices*", _price_handler(merged))
    page.route("**/history*", _history_handler)
    page.route("**/info*", _info_handler)
    page.route("**/generativelanguage.googleapis.com/**", _gemini_handler)


@pytest.fixture
def mocks(page):
    """Register only the network mocks (no localStorage seeding)."""

    def _mocks(prices=None):
        setup_mocks(page, prices)

    return _mocks


@pytest.fixture
def seed(page):
    """Seed localStorage before the app loads and register network mocks.

    Call ``seed({...overrides})`` *before* navigating with ``open_app(page)``.
    The init script re-runs on every navigation, so seeded state survives
    in-app navigation (but is intentionally NOT used for the import test which
    relies on a real reload to load fresh data).
    """

    def _seed(overrides=None, prices=None):
        state = default_state()
        if overrides:
            state.update(overrides)
        page.add_init_script(
            "(() => { const s = "
            + json.dumps(state)
            + "; for (const k in s) { window.localStorage.setItem(k, JSON.stringify(s[k])); } })();"
        )
        setup_mocks(page, prices)
        return state

    return _seed
