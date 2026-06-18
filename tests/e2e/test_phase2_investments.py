"""E2E tests for Phase 2 investment analytics."""

from playwright.sync_api import expect

from helpers import goto, open_app

HOLDINGS = {
    "transactions": [
        {
            "id": "t1",
            "ticker": "VOO",
            "category": "ETF",
            "type": "buy",
            "date": "2023-01-01",
            "quantity": 10,
            "pricePerUnit": 300,
        },
        {
            "id": "t2",
            "ticker": "AAPL",
            "category": "Stock",
            "type": "buy",
            "date": "2023-01-01",
            "quantity": 5,
            "pricePerUnit": 150,
        },
    ]
}


def _open_investments(seed, page, overrides=None, prices=None):
    state = {**HOLDINGS}
    if overrides:
        state.update(overrides)
    seed(state, prices=prices)
    open_app(page)
    goto(page, "Investments")
    expect(page.get_by_role("heading", name="Portfolio Holdings", level=1)).to_be_visible()


def test_unrealized_gain_columns(seed, page):
    _open_investments(seed, page)
    # VOO: 10 * 400 - 10 * 300 = 1000 unrealized
    expect(page.get_by_test_id("unrealized-VOO")).to_contain_text("$1,000.00")
    expect(page.get_by_test_id("total-unrealized")).to_be_visible()


def test_realized_gain_after_sell(seed, page):
    _open_investments(
        seed,
        page,
        {
            "transactions": [
                {
                    "id": "t1",
                    "ticker": "VOO",
                    "category": "ETF",
                    "type": "buy",
                    "date": "2023-01-01",
                    "quantity": 10,
                    "pricePerUnit": 100,
                },
                {
                    "id": "t2",
                    "ticker": "VOO",
                    "category": "ETF",
                    "type": "sell",
                    "date": "2024-01-01",
                    "quantity": 5,
                    "pricePerUnit": 150,
                },
            ]
        },
    )
    # FIFO: buy 10@100, sell 5@150 -> gain 250
    expect(page.get_by_test_id("realized-gain-row")).to_contain_text("$250.00")


def test_portfolio_xirr_renders(seed, page):
    _open_investments(seed, page)
    expect(page.get_by_test_id("portfolio-performance")).to_be_visible()
    expect(page.get_by_test_id("portfolio-xirr")).to_be_visible()
    expect(page.get_by_test_id("benchmark-xirr")).to_be_visible()


def test_dividend_yield_on_cost(seed, page):
    _open_investments(
        seed,
        page,
        {
            "dividends": [
                {"id": "d1", "ticker": "VOO", "date": "2025-01-15", "amount": 120},
            ],
        },
    )
    expect(page.get_by_test_id("dividend-analytics-table")).to_be_visible()
    expect(page.get_by_test_id("yield-on-cost-VOO")).to_be_visible()


def test_drip_toggle_persists(seed, page):
    _open_investments(
        seed,
        page,
        {
            "dividends": [
                {"id": "d1", "ticker": "VOO", "date": "2025-01-15", "amount": 50},
            ],
        },
    )
    page.get_by_test_id("drip-toggle-VOO").check()
    stored = page.evaluate("() => JSON.parse(localStorage.getItem('dripSettings') || '{}').VOO")
    assert stored is True


def test_diversification_sector_chart(seed, page):
    _open_investments(seed, page)
    expect(page.get_by_test_id("diversification-sector")).to_be_visible()


def test_tax_loss_harvest_suggestion(seed, page):
    _open_investments(
        seed,
        page,
        {
            "transactions": [
                {
                    "id": "t1",
                    "ticker": "AAPL",
                    "category": "Stock",
                    "type": "buy",
                    "date": "2023-01-01",
                    "quantity": 10,
                    "pricePerUnit": 300,
                },
            ],
        },
        prices={"AAPL": 200.0},
    )
    # Cost 3000, value 2000 -> unrealized loss
    expect(page.get_by_test_id("tax-loss-harvest-card")).to_be_visible()
    expect(page.get_by_test_id("harvest-AAPL")).to_be_visible()
