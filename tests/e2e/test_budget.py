"""E2E tests for the budgeting engine (Incomes / Expenses pages)."""

from playwright.sync_api import expect

from helpers import goto, months_ago_iso, open_app

RECURRING_RENT = {
    "id": "r1",
    "name": "MonthlyRent",
    "category": "Rent/Mortgage",
    "amount": 2000,
    "type": "expense",
    "date": months_ago_iso(2),
    "isRecurring": True,
    "recurringSettings": {"frequency": "monthly", "endCondition": "never"},
}


def test_add_one_time_income(seed, page):
    seed()
    open_app(page)
    goto(page, "Incomes")
    expect(page.get_by_role("heading", name="Incomes", level=1)).to_be_visible()

    page.get_by_role("button", name="Add New Income Source").click()
    page.get_by_placeholder("e.g. Monthly Rent").fill("Freelance")
    page.locator('input[name="amount"]').fill("2500")
    page.get_by_role("button", name="Save Changes").click()

    expect(page.get_by_text("Freelance")).to_be_visible()
    expect(page.get_by_text("$2,500.00").first).to_be_visible()


def test_add_one_time_expense(seed, page):
    seed()
    open_app(page)
    goto(page, "Expenses")
    expect(page.get_by_role("heading", name="Expenses", level=1)).to_be_visible()

    page.get_by_role("button", name="Add New Expense Source").click()
    page.get_by_placeholder("e.g. Monthly Rent").fill("Coffee")
    page.locator('input[name="amount"]').fill("50")
    page.get_by_role("button", name="Save Changes").click()

    expect(page.get_by_text("Coffee")).to_be_visible()
    expect(page.get_by_text("$50.00").first).to_be_visible()


def test_recurring_expense_appears_in_current_month(seed, page):
    seed({"budgetItems": [RECURRING_RENT]})
    open_app(page)
    goto(page, "Expenses")

    # The monthly series (started two months ago) generates an occurrence now.
    expect(page.get_by_text("MonthlyRent")).to_be_visible()


def test_edit_recurring_shows_scope_options(seed, page):
    seed({"budgetItems": [RECURRING_RENT]})
    open_app(page)
    goto(page, "Expenses")

    page.locator("tr", has_text="MonthlyRent").get_by_role("button", name="Edit").click()

    # Editing a recurring occurrence exposes the apply-to-scope chooser.
    expect(page.get_by_text("Apply Changes To:")).to_be_visible()
    expect(page.get_by_text("This occurrence only")).to_be_visible()
    expect(page.get_by_text("All future events")).to_be_visible()


def test_delete_recurring_future_removes_occurrence(seed, page):
    seed({"budgetItems": [RECURRING_RENT]})
    open_app(page)
    goto(page, "Expenses")

    page.locator("tr", has_text="MonthlyRent").get_by_role("button", name="Delete").click()
    # Confirmation modal offers delete-scope radios; default is "future".
    expect(page.get_by_text("This and all future occurrences")).to_be_visible()
    page.get_by_role("button", name="Confirm Delete").click()

    expect(page.get_by_text("MonthlyRent")).to_have_count(0)
