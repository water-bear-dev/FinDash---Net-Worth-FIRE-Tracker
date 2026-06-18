"""E2E tests for the financial Calendar page."""

from playwright.sync_api import expect

from helpers import goto, months_ago_iso, open_app, today_iso


def _seed_calendar(seed):
    return seed(
        {
            "budgetItems": [
                {
                    "id": "r1",
                    "name": "RentCal",
                    "category": "Rent/Mortgage",
                    "amount": 1500,
                    "type": "expense",
                    "date": months_ago_iso(1),
                    "isRecurring": True,
                    "recurringSettings": {"frequency": "monthly", "endCondition": "never"},
                }
            ],
            "transactions": [
                {
                    "id": "t1",
                    "ticker": "CAL",
                    "category": "Stock",
                    "type": "buy",
                    "date": today_iso(),
                    "quantity": 2,
                    "pricePerUnit": 100,
                }
            ],
            "dividends": [{"id": "d1", "ticker": "CAL", "date": today_iso(), "amount": 25}],
        }
    )


def test_calendar_renders_events(seed, page):
    _seed_calendar(seed)
    open_app(page)
    goto(page, "Calendar")
    expect(page.get_by_role("heading", name="Calendar", level=1)).to_be_visible()

    expect(page.get_by_text("RentCal")).to_be_visible()
    expect(page.get_by_text("BUY CAL")).to_be_visible()
    expect(page.get_by_text("Dividend: CAL")).to_be_visible()


def test_calendar_create_opens_modal(seed, page):
    seed()
    open_app(page)
    goto(page, "Calendar")

    page.get_by_role("button", name="Create").click()
    expect(page.get_by_role("heading", name="Add Budget Item")).to_be_visible()
    page.get_by_role("button", name="Cancel").click()
    expect(page.get_by_role("heading", name="Add Budget Item")).to_have_count(0)


def test_calendar_view_switch(seed, page):
    _seed_calendar(seed)
    open_app(page)
    goto(page, "Calendar")

    # Day view shows events for the current date; today's transaction qualifies.
    page.get_by_role("button", name="day", exact=True).click()
    expect(page.get_by_text("BUY CAL")).to_be_visible()
