"""E2E tests for the Settings page (currency, theme, Gemini chatbot)."""

import re

from playwright.sync_api import expect

from helpers import goto, open_app


def test_currency_change_reflects_on_dashboard(seed, page):
    seed()  # default cash balance is 10,000
    open_app(page)
    goto(page, "Settings")
    expect(page.get_by_role("heading", name="Settings", level=1)).to_be_visible()

    page.locator("#currency").select_option("EUR")

    goto(page, "Dashboard")
    expect(page.get_by_text(re.compile(r"€\s?10,000\.00")).first).to_be_visible()


def test_theme_toggle(seed, page):
    seed({"theme": "dark"})
    open_app(page)

    expect(page.locator("html")).to_have_class(re.compile(r"\bdark\b"))
    page.get_by_role("button", name="Toggle theme").click()
    expect(page.locator("html")).to_have_class(re.compile(r"\blight\b"))


def test_enable_gemini_chatbot_shows_widget(seed, page):
    seed()
    open_app(page)
    goto(page, "Settings")

    gemini_toggle = page.locator(
        'div.flex.items-center.justify-between:has(span:has-text("Google Gemini Chatbot")) label'
    )
    gemini_toggle.click()

    api_key_input = page.locator("#geminiApiKey")
    expect(api_key_input).to_be_visible()
    api_key_input.fill("test-api-key")
    page.get_by_role("button", name="Save Settings").click()

    # The floating chatbot launcher appears once the bot is enabled with a key.
    expect(page.locator("div.fixed.bottom-6.right-6 button")).to_be_visible()
