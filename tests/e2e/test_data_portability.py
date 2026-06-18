"""E2E tests for data portability (JSON export and import)."""

import json

from playwright.sync_api import expect

from helpers import BASE_URL, goto, open_app


def test_export_full_backup_download(seed, page):
    seed()
    open_app(page)
    goto(page, "Settings")

    with page.expect_download() as download_info:
        page.get_by_test_id("export-full-backup").click()
    assert download_info.value.suggested_filename == "findash-backup.json"


def test_export_transactions_download(seed, page):
    seed(
        {
            "transactions": [
                {
                    "id": "t1",
                    "ticker": "VOO",
                    "category": "ETF",
                    "type": "buy",
                    "date": "2023-01-01",
                    "quantity": 1,
                    "pricePerUnit": 100,
                }
            ]
        }
    )
    open_app(page)
    goto(page, "Settings")

    with page.expect_download() as download_info:
        page.get_by_role("button", name="Export Transactions").click()
    assert download_info.value.suggested_filename.startswith("findash-transactions-")


def test_import_backup_loads_data(mocks, page, tmp_path):
    # No localStorage seeding here: the import flow reloads the page, and we want
    # the imported file (not a seed init-script) to be the source of truth.
    mocks()
    page.goto(BASE_URL + "/")
    # Skip the wizard by marking setup complete, then reload into the app.
    page.evaluate(
        "() => { localStorage.setItem('isSetupComplete', 'true');"
        " localStorage.setItem('userProfile', JSON.stringify({name: 'Tester', email: ''})); }"
    )
    page.reload()
    expect(page.get_by_role("heading", name="Dashboard", level=1)).to_be_visible()

    backup = {
        "isSetupComplete": True,
        "userProfile": {"name": "Tester", "email": ""},
        "cashAccounts": [{"id": "imp1", "name": "Imported Vault", "balance": 99999}],
        "properties": [],
        "liabilities": [],
        "currency": "USD",
        "theme": "dark",
    }
    backup_file = tmp_path / "findash-backup.json"
    backup_file.write_text(json.dumps(backup))

    goto(page, "Settings")
    page.set_input_files('input[type="file"]', str(backup_file))

    expect(page.get_by_text("Confirm Data Import")).to_be_visible()
    page.get_by_role("button", name="Overwrite & Reload").click()

    # window.location.reload() preserves the #/settings hash, so we land back on
    # Settings; navigate to the Dashboard to verify the imported data loaded.
    expect(page.get_by_role("heading", name="Settings", level=1)).to_be_visible()
    goto(page, "Dashboard")
    expect(page.get_by_text("$99,999.00").first).to_be_visible()
