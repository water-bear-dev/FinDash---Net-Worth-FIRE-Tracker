"""E2E tests for the Manage Data page (cash, properties, liabilities CRUD)."""

from playwright.sync_api import expect

from helpers import goto, open_app


def _open_manage(seed, page, overrides=None):
    seed(overrides)
    open_app(page)
    goto(page, "Manage Data")
    expect(page.get_by_role("heading", name="Manage Data", level=1)).to_be_visible()


def test_add_cash_account(seed, page):
    _open_manage(seed, page)
    page.get_by_placeholder("Account Name").fill("Savings")
    page.get_by_placeholder("Balance").fill("5000")
    page.get_by_role("button", name="Add Account").click()

    row = page.get_by_role("row", name="Savings")
    expect(row).to_be_visible()
    expect(row.get_by_text("$5,000.00")).to_be_visible()


def test_edit_cash_account(seed, page):
    _open_manage(seed, page)
    page.locator("tr", has_text="Checking").get_by_role("button", name="Edit").click()
    balance_input = page.locator('input[name="balance"]')
    balance_input.fill("20000")
    page.get_by_role("button", name="Save", exact=True).click()

    expect(page.get_by_text("$20,000.00").first).to_be_visible()


def test_delete_cash_account(seed, page):
    _open_manage(
        seed,
        page,
        {
            "cashAccounts": [
                {"id": "c1", "name": "Checking", "balance": 10000},
                {"id": "c2", "name": "Vacation Fund", "balance": 3000},
            ]
        },
    )
    page.locator("tr", has_text="Vacation Fund").get_by_role("button", name="Delete").click()
    page.get_by_role("button", name="Confirm Delete").click()

    expect(page.get_by_text("Vacation Fund")).to_have_count(0)


def test_add_property(seed, page):
    _open_manage(seed, page)
    page.get_by_role("button", name="Properties").click()
    page.get_by_placeholder("Property Name").fill("Beach House")
    page.get_by_placeholder("Current Value").fill("450000")
    page.get_by_role("button", name="Add Property").click()

    row = page.get_by_role("row", name="Beach House")
    expect(row).to_be_visible()
    expect(row.get_by_text("$450,000.00")).to_be_visible()


def test_add_liability(seed, page):
    _open_manage(seed, page)
    page.get_by_role("button", name="Liabilities").click()
    page.get_by_placeholder("Loan Name").fill("Car Loan")
    page.get_by_placeholder("Outstanding Balance").fill("15000")
    page.get_by_placeholder("Interest Rate (%)").fill("5")
    page.get_by_role("button", name="Add Liability").click()

    row = page.get_by_test_id("manage-data-table").get_by_role("row", name="Car Loan")
    expect(row).to_be_visible()
    expect(row.get_by_text("$15,000.00")).to_be_visible()
    expect(row.get_by_text("5.00%")).to_be_visible()
