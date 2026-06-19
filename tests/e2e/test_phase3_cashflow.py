"""E2E tests for Phase 3 cash flow & forecasting features."""

import datetime
import os

from playwright.sync_api import expect

from helpers import goto, open_app

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")
SAMPLE_CSV = os.path.join(FIXTURES_DIR, "sample_bank_export.csv")

BUDGET_BASE = {
    "budgetItems": [
        {
            "id": "b1",
            "name": "Salary",
            "category": "Salary",
            "amount": 5000,
            "type": "income",
            "date": "2024-01-05",
            "isRecurring": True,
            "recurringSettings": {"frequency": "monthly", "endCondition": "never"},
        },
        {
            "id": "b2",
            "name": "Rent",
            "category": "Rent/Mortgage",
            "amount": 2000,
            "type": "expense",
            "date": "2024-01-01",
            "isRecurring": True,
            "recurringSettings": {"frequency": "monthly", "endCondition": "never"},
        },
    ]
}


def test_cashflow_page_renders(seed, page):
    seed(BUDGET_BASE)
    open_app(page)
    goto(page, "Cash Flow")
    expect(page.get_by_role("heading", name="Cash Flow", level=1)).to_be_visible()
    expect(page.get_by_test_id("variance-table")).to_be_visible()
    expect(page.get_by_test_id("variance-summary")).to_be_visible()


def test_variance_shows_over_budget(seed, page):
    month_start = datetime.date.today().replace(day=1).isoformat()
    seed(
        {
            "budgetItems": [
                {
                    "id": "b1",
                    "name": "Rent",
                    "category": "Rent/Mortgage",
                    "amount": 2000,
                    "type": "expense",
                    "date": "2024-01-01",
                    "isRecurring": True,
                    "recurringSettings": {"frequency": "monthly", "endCondition": "never"},
                },
                {
                    "id": "b2",
                    "name": "Rent override",
                    "category": "Rent/Mortgage",
                    "amount": 2500,
                    "type": "expense",
                    "date": month_start,
                    "isRecurring": False,
                    "originalId": "b1",
                },
            ]
        }
    )
    open_app(page)
    goto(page, "Cash Flow")
    row = page.get_by_test_id("variance-row-Rent/Mortgage")
    expect(row).to_be_visible()
    expect(row).to_contain_text("$500.00")


def test_category_trend_chart_renders(seed, page):
    seed(BUDGET_BASE)
    open_app(page)
    goto(page, "Cash Flow")
    expect(page.get_by_test_id("category-trend-chart")).to_be_visible()


def test_csv_import_rule_based(seed, page):
    seed({"budgetItems": []})
    open_app(page)
    goto(page, "Cash Flow")
    page.get_by_test_id("import-csv-btn").click()
    expect(page.get_by_test_id("csv-import-modal")).to_be_visible()
    page.get_by_test_id("csv-file-input").set_input_files(SAMPLE_CSV)
    expect(page.get_by_test_id("csv-import-confirm")).to_be_visible()
    page.get_by_test_id("csv-import-confirm").click()
    expect(page.get_by_test_id("import-success")).to_contain_text("Successfully imported 5 transactions")


def test_csv_dedup(seed, page):
    seed(
        {
            "budgetItems": [
                {
                    "id": "existing",
                    "name": "AMAZON MARKETPLACE",
                    "category": "Shopping",
                    "amount": 45.99,
                    "type": "expense",
                    "date": "2026-06-01",
                    "isRecurring": False,
                    "importId": "2026-06-01|45.99|amazon marketplace",
                    "importSource": "csv",
                }
            ]
        }
    )
    open_app(page)
    goto(page, "Cash Flow")
    page.get_by_test_id("import-csv-btn").click()
    page.get_by_test_id("csv-file-input").set_input_files(SAMPLE_CSV)
    # Only 4 new rows (1 duplicate skipped)
    expect(page.get_by_text("4 rows to import")).to_be_visible()


def test_gemini_categorization_disabled_without_key(seed, page):
    seed({"budgetItems": [], "geminiApiKey": ""})
    open_app(page)
    goto(page, "Cash Flow")
    page.get_by_test_id("import-csv-btn").click()
    page.get_by_test_id("csv-file-input").set_input_files(SAMPLE_CSV)
    toggle = page.get_by_test_id("ai-categorize-toggle").locator("input")
    expect(toggle).to_be_disabled()


def test_fire_scenario_sandbox(seed, page):
    seed(
        {
            **BUDGET_BASE,
            "cashAccounts": [{"id": "c1", "name": "Checking", "balance": 100000}],
        }
    )
    open_app(page)
    goto(page, "FIRE Journey")
    expect(page.get_by_test_id("scenario-sandbox")).to_be_visible()
    baseline_years = page.get_by_test_id("years-Baseline").inner_text()
    page.get_by_text("+$500/mo savings").click()
    scenario_years = page.get_by_test_id("years-+$500/mo savings").inner_text()
    assert baseline_years != scenario_years


def test_alert_bell_shows_bill_due(seed, page):
    due = (datetime.date.today() + datetime.timedelta(days=2)).isoformat()
    seed(
        {
            "budgetItems": [
                {
                    "id": "b1",
                    "name": "Electric Bill",
                    "category": "Electricity, Gas, Water",
                    "amount": 150,
                    "type": "expense",
                    "date": due,
                    "isRecurring": False,
                }
            ],
            "alertSettings": {
                "enabled": True,
                "billDueDaysBefore": 3,
                "lowCashThreshold": 1000,
                "rebalanceDriftPercent": 5,
                "budgetOverPercent": 10,
                "browserNotifications": False,
                "dismissedAlertIds": [],
            },
        }
    )
    open_app(page)
    badge = page.get_by_test_id("alert-badge")
    expect(badge).to_be_visible()
    expect(badge).not_to_have_text("0")


def test_dismiss_alert(seed, page):
    seed(
        {
            "cashAccounts": [{"id": "c1", "name": "Checking", "balance": 100}],
            "alertSettings": {
                "enabled": True,
                "billDueDaysBefore": 3,
                "lowCashThreshold": 1000,
                "rebalanceDriftPercent": 5,
                "budgetOverPercent": 10,
                "browserNotifications": False,
                "dismissedAlertIds": [],
            },
        }
    )
    open_app(page)
    page.get_by_test_id("alert-bell").locator("button").first.click()
    dismiss_btn = page.locator("[data-testid^='dismiss-alert-']").first
    expect(dismiss_btn).to_be_visible()
    dismiss_btn.click()
    page.get_by_test_id("alert-bell").locator("button").first.click()
    # Badge may disappear or count drops after dismiss
    badge = page.get_by_test_id("alert-badge")
    if badge.count() > 0:
        expect(badge).not_to_have_text("1")


def test_settings_alert_thresholds(seed, page):
    seed(
        {
            "alertSettings": {
                "enabled": True,
                "billDueDaysBefore": 3,
                "lowCashThreshold": 5000,
                "rebalanceDriftPercent": 5,
                "budgetOverPercent": 10,
                "browserNotifications": False,
                "dismissedAlertIds": [],
            },
        }
    )
    open_app(page)
    goto(page, "Settings")
    page.get_by_test_id("low-cash-threshold").fill("99999")
    page.get_by_role("button", name="Save Alert Settings").click()
    expect(page.get_by_test_id("low-cash-threshold")).to_have_value("99999")
