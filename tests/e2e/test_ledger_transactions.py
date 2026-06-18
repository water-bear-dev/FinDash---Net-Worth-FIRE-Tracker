"""E2E tests for the Ledger page (transactions and dividends)."""

from playwright.sync_api import expect

from helpers import goto, open_app, today_iso


def _open_ledger(seed, page, overrides=None):
    seed(overrides)
    open_app(page)
    goto(page, "Ledger")
    expect(page.get_by_role("heading", name="Portfolio Dashboard", level=1)).to_be_visible()


def _modal(page, heading):
    return page.locator("div.fixed.inset-0").filter(
        has=page.get_by_role("heading", name=heading)
    )


def test_add_buy_transaction_records_and_creates_expense(seed, page):
    _open_ledger(seed, page)
    page.get_by_role("button", name="Add Transaction").click()

    modal = _modal(page, "Add Transaction")
    modal.locator('input[name="ticker"]').fill("VOO")
    modal.locator('input[name="quantity"]').fill("10")
    modal.locator('input[name="pricePerUnit"]').fill("300")
    page.get_by_role("button", name="Save Transaction").click()

    # Transaction appears in the history table.
    expect(page.get_by_role("cell", name="VOO")).to_be_visible()
    expect(page.get_by_text("$3,000.00").first).to_be_visible()

    # Buying a holding auto-creates a budget expense ("Buy VOO") for today.
    goto(page, "Expenses")
    expect(page.get_by_text("Buy VOO")).to_be_visible()


def test_add_sell_transaction(seed, page):
    _open_ledger(
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
                    "quantity": 20,
                    "pricePerUnit": 150,
                }
            ]
        },
    )
    page.get_by_role("button", name="Add Transaction").click()
    modal = _modal(page, "Add Transaction")
    modal.locator('input[name="ticker"]').fill("AAPL")
    modal.locator('select[name="type"]').select_option("sell")
    modal.locator('input[name="quantity"]').fill("5")
    modal.locator('input[name="pricePerUnit"]').fill("180")
    page.get_by_role("button", name="Save Transaction").click()

    # A "sell" row is now present in the history table.
    expect(page.get_by_role("cell", name="sell")).to_be_visible()


def test_add_dividend(seed, page):
    _open_ledger(seed, page)
    page.get_by_role("button", name="Add Dividend").click()
    modal = _modal(page, "Add Dividend")
    modal.locator('input[name="ticker"]').fill("VOO")
    modal.locator('input[name="amount"]').fill("100")
    page.get_by_role("button", name="Save Dividend").click()

    expect(page.get_by_text("Total Received:")).to_be_visible()
    expect(page.get_by_text("$100.00").first).to_be_visible()


def test_delete_dividend(seed, page):
    _open_ledger(
        seed,
        page,
        {"dividends": [{"id": "d1", "ticker": "VOO", "date": today_iso(), "amount": 100}]},
    )
    page.locator("tr", has_text="VOO").get_by_role("button", name="Delete").click()
    page.get_by_role("button", name="Confirm Delete").click()

    # Total received drops back to zero once the only dividend is removed.
    expect(page.get_by_text("$0.00").first).to_be_visible()
