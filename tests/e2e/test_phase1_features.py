"""E2E tests for Phase 1 features."""

import json

from playwright.sync_api import expect

from helpers import goto, open_app, today_iso


def test_savings_rate_trend_renders(seed, page):
    seed(
        {
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
    )
    open_app(page)
    expect(page.get_by_test_id("savings-rate-current")).to_be_visible()
    expect(page.get_by_test_id("savings-rate-trend-chart")).to_be_visible()


def test_emergency_fund_card_renders(seed, page):
    seed(
        {
            "cashAccounts": [{"id": "c1", "name": "Checking", "balance": 12000}],
            "emergencyFundTargetMonths": 6,
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
                }
            ],
        }
    )
    open_app(page)
    card = page.get_by_test_id("emergency-fund-card")
    expect(card).to_be_visible()
    expect(card).to_contain_text("6.0 / 6")


def test_net_worth_forecast_chart_renders(seed, page):
    seed(
        {
            "historicalNetWorth": [{"date": "2025-01", "netWorth": 50000}],
            "cashAccounts": [{"id": "c1", "name": "Checking", "balance": 50000}],
        }
    )
    open_app(page)
    expect(page.get_by_test_id("net-worth-forecast-chart")).to_be_visible()


def test_debt_payoff_planner_renders(seed, page):
    seed(
        {
            "liabilities": [
                {"id": "l1", "name": "Car Loan", "outstandingBalance": 10000, "interestRate": 6.5},
                {"id": "l2", "name": "Credit Card", "outstandingBalance": 3000, "interestRate": 19.9},
            ],
            "budgetItems": [
                {
                    "id": "b1",
                    "name": "Car Payment",
                    "category": "Car Payment/Lease",
                    "amount": 350,
                    "type": "expense",
                    "date": "2024-01-15",
                    "isRecurring": True,
                    "recurringSettings": {
                        "frequency": "monthly",
                        "endCondition": "liability",
                        "endLiabilityId": "l1",
                    },
                }
            ],
        }
    )
    open_app(page)
    goto(page, "Manage Data")
    expect(page.get_by_test_id("debt-payoff-comparison")).to_be_visible()


def test_encrypted_backup_export(seed, page):
    seed()
    open_app(page)
    goto(page, "Settings")

    page.get_by_test_id("encrypt-backup-toggle").check()
    page.get_by_test_id("backup-passphrase").fill("test-passphrase-123")

    with page.expect_download() as download_info:
        page.get_by_test_id("export-full-backup").click()
    assert download_info.value.suggested_filename == "findash-backup.enc.json"


def test_expense_attachment_upload(seed, page, tmp_path):
    seed()
    open_app(page)
    goto(page, "Expenses")

    page.get_by_role("button", name="Add New Expense Source").click()
    page.get_by_placeholder("e.g. Monthly Rent").fill("Office Supplies")
    page.locator('input[name="amount"]').fill("45")
    page.locator('input[name="date"]').fill(today_iso())

    image_path = tmp_path / "receipt.png"
    image_path.write_bytes(
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde"
        b"\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    page.get_by_test_id("attachment-upload-input").set_input_files(str(image_path))
    page.get_by_role("button", name="Save Changes").click()

    expect(page.get_by_text("Office Supplies")).to_be_visible()
    expect(page.get_by_test_id("expense-attachment-count").filter(has_text="📎 1")).to_be_visible()
