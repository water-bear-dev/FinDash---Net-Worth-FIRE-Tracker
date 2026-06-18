"""E2E tests for the Dashboard, driven by seeded localStorage state."""

from playwright.sync_api import expect

from helpers import open_app


def test_dashboard_loads(seed, page):
    seed()
    open_app(page)
    expect(page.get_by_role("heading", name="Dashboard", level=1)).to_be_visible()
    expect(page.get_by_text("A high-level overview of your financial status.")).to_be_visible()


def test_net_worth_aggregates_assets_and_liabilities(seed, page):
    seed(
        {
            "cashAccounts": [{"id": "c1", "name": "Checking", "balance": 25000}],
            "properties": [
                {"id": "p1", "name": "Home", "currentValue": 100000, "category": "Property"}
            ],
            "liabilities": [
                {"id": "l1", "name": "Loan", "outstandingBalance": 50000, "interestRate": 5}
            ],
        }
    )
    open_app(page)

    # Assets = 25,000 + 100,000 = 125,000; Net worth = 125,000 - 50,000 = 75,000
    expect(page.get_by_text("$75,000.00").first).to_be_visible()
    expect(page.get_by_text("$125,000.00").first).to_be_visible()
    expect(page.get_by_text("$50,000.00").first).to_be_visible()


def test_dashboard_shows_holdings_with_mocked_prices(seed, page):
    seed(
        {
            "cashAccounts": [],
            "transactions": [
                {
                    "id": "t1",
                    "ticker": "VOO",
                    "category": "ETF",
                    "type": "buy",
                    "date": "2023-01-01",
                    "quantity": 10,
                    "pricePerUnit": 300,
                }
            ],
        }
    )
    open_app(page)

    # 10 shares * mocked $400 = $4,000 net worth once prices load.
    expect(page.get_by_text("$4,000.00").first).to_be_visible()
