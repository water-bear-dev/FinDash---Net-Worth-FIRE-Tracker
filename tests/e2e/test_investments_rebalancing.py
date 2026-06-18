"""E2E tests for the Investments page and the rebalancing engine."""

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


def _open_investments(seed, page):
    seed(HOLDINGS)
    open_app(page)
    goto(page, "Investments")
    expect(page.get_by_role("heading", name="Portfolio Holdings", level=1)).to_be_visible()


def test_holdings_table_uses_mocked_prices(seed, page):
    _open_investments(seed, page)
    # Scope to the holdings table inside the "Current Investments" card.
    holdings_table = (
        page.locator("div.rounded-xl")
        .filter(has=page.get_by_role("heading", name="Current Investments"))
        .locator("table")
    )
    # VOO: 10 * mocked $400 = $4,000 current value; cost 10*300=3,000 -> +33.33%
    expect(holdings_table.get_by_role("cell", name="VOO")).to_be_visible()
    expect(holdings_table.get_by_text("$4,000.00")).to_be_visible()
    # Both VOO and AAPL gained +33.33%, so assert at least one such cell.
    expect(holdings_table.get_by_text("33.33%").first).to_be_visible()


def test_set_target_allocations(seed, page):
    _open_investments(seed, page)
    page.get_by_placeholder("Ticker (e.g. VOO)").fill("VOO")
    page.get_by_placeholder("Target %").fill("80")
    page.get_by_placeholder("Target %").press("Enter")

    page.get_by_placeholder("Ticker (e.g. VOO)").fill("AAPL")
    page.get_by_placeholder("Target %").fill("20")
    page.get_by_placeholder("Target %").press("Enter")

    targets_row = page.locator("tr", has_text="VOO").filter(has_text="80.0%")
    expect(targets_row).to_be_visible()
    expect(page.get_by_text("100.0%")).to_be_visible()


def test_rebalancing_recommends_buys_for_new_capital(seed, page):
    _open_investments(seed, page)
    # Balanced allocations matching current values (4,000 / 1,000 = 80/20).
    page.get_by_placeholder("Ticker (e.g. VOO)").fill("VOO")
    page.get_by_placeholder("Target %").fill("80")
    page.get_by_placeholder("Target %").press("Enter")
    page.get_by_placeholder("Ticker (e.g. VOO)").fill("AAPL")
    page.get_by_placeholder("Target %").fill("20")
    page.get_by_placeholder("Target %").press("Enter")

    # Deploying new capital should produce BUY recommendations.
    page.get_by_placeholder("Amount in dollars").fill("1000")
    expect(page.get_by_text("BUY").first).to_be_visible()
    expect(page.get_by_text("Portfolio is perfectly balanced!")).to_have_count(0)
