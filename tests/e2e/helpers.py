"""Page-object style helpers shared across the FinDash E2E tests."""

import datetime

from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:3000"


def open_app(page: Page, expect_dashboard: bool = True):
    """Navigate to the app root and (optionally) wait for the Dashboard."""
    page.goto(BASE_URL + "/")
    if expect_dashboard:
        expect(page.get_by_role("heading", name="Dashboard", level=1)).to_be_visible()


def goto(page: Page, label: str):
    """Click a sidebar navigation link by its visible label.

    Labels: Dashboard, Incomes, Expenses, Calendar, Cash Flow, Ledger, Investments,
    FIRE Journey, Manage Data, Settings.
    """
    page.locator("aside").get_by_role("link", name=label, exact=True).click()


def card(page: Page, title: str):
    """Locate a dashboard/feature Card (a rounded panel with an <h2> title)."""
    return page.locator("div.rounded-xl").filter(
        has=page.get_by_role("heading", name=title, exact=True)
    ).first


def today_iso() -> str:
    return datetime.date.today().isoformat()


def months_ago_iso(n: int, day: int = 15) -> str:
    """An ISO date ``n`` months before today, clamped to a safe day-of-month."""
    today = datetime.date.today()
    month = today.month - n
    year = today.year
    while month <= 0:
        month += 12
        year -= 1
    return datetime.date(year, month, min(day, 28)).isoformat()
