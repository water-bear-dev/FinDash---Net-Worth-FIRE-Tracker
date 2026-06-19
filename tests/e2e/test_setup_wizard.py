"""E2E tests for the first-run SetupWizard.

A fresh browser (empty localStorage) renders the wizard instead of the app, so
these tests deliberately do NOT seed state.
"""

from playwright.sync_api import expect

from helpers import BASE_URL


def test_wizard_completes_and_persists_data(page):
    page.goto(BASE_URL + "/")
    expect(page.get_by_text("Welcome to FinDash")).to_be_visible()
    page.get_by_test_id("start-real-setup-btn").click()

    # Step 1 - profile (name is required to advance)
    page.get_by_placeholder("e.g. Satoshi Nakamoto").fill("Wizard User")
    page.get_by_role("button", name="Next Step").click()

    # Step 2 - add a cash account with a distinctive balance
    page.get_by_placeholder("Account Name").fill("Wizard Savings")
    page.get_by_placeholder("Balance").fill("13579")
    page.locator('div.flex:has(input[placeholder="Account Name"]) > button').click()
    expect(page.get_by_text("Wizard Savings")).to_be_visible()
    page.get_by_role("button", name="Next Step").click()

    # Steps 3 & 4 - skip properties and liabilities
    page.get_by_role("button", name="Next Step").click()
    page.get_by_role("button", name="Next Step").click()

    # Step 5 - finish
    page.get_by_role("button", name="Finish Setup").click()

    expect(page.get_by_role("heading", name="Dashboard", level=1)).to_be_visible()
    # Net worth on the dashboard reflects the cash account entered in the wizard.
    expect(page.get_by_text("$13,579.00").first).to_be_visible()


def test_next_disabled_until_name_entered(page):
    page.goto(BASE_URL + "/")
    page.get_by_test_id("start-real-setup-btn").click()
    next_button = page.get_by_role("button", name="Next Step")
    expect(next_button).to_be_disabled()

    page.get_by_placeholder("e.g. Satoshi Nakamoto").fill("Someone")
    expect(next_button).to_be_enabled()


def test_skip_for_now_opens_app(page):
    page.goto(BASE_URL + "/")
    page.get_by_role("button", name="Skip for now").click()
    expect(page.get_by_role("heading", name="Dashboard", level=1)).to_be_visible()


def test_explore_mock_data_loads_demo_and_continue_setup(page):
    page.goto(BASE_URL + "/")
    page.get_by_test_id("explore-mock-data-btn").click()

    expect(page.get_by_test_id("demo-mode-banner")).to_be_visible()
    expect(page.get_by_role("heading", name="Dashboard", level=1)).to_be_visible()
    expect(page.get_by_text("Alex Doe").first).to_be_visible()

    page.get_by_test_id("continue-real-setup-btn").click()
    expect(page.get_by_text("How would you like to get started?")).to_be_visible()
