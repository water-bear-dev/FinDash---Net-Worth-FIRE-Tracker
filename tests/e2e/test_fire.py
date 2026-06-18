"""E2E tests for the FIRE dashboard and Monte Carlo simulator."""

import re

from playwright.sync_api import expect

from helpers import goto, open_app


def _open_fire(seed, page):
    seed({"cashAccounts": [{"id": "c1", "name": "Checking", "balance": 200000}]})
    open_app(page)
    goto(page, "FIRE Journey")
    expect(page.get_by_role("heading", name="FIRE Dashboard", level=1)).to_be_visible()


def test_fi_number_uses_swr(seed, page):
    _open_fire(seed, page)
    # FI number = target spending / SWR = 60,000 / 0.04 = 1,500,000
    expect(page.get_by_text("$1,500,000.00").first).to_be_visible()


def test_simulator_outputs_visible(seed, page):
    _open_fire(seed, page)
    expect(page.get_by_text("Required Pre-Tax Income")).to_be_visible()
    # Pre-tax target = 60,000 / (1 - 0.15) = 70,588.24 (independent of randomness)
    expect(page.get_by_text("$70,588.24").first).to_be_visible()

    expect(page.get_by_text("Monte Carlo Success Rate")).to_be_visible()
    # Some probability percentage is rendered.
    expect(page.get_by_text(re.compile(r"\d+(\.\d+)?%")).first).to_be_visible()


def test_changing_swr_updates_fi_number(seed, page):
    _open_fire(seed, page)
    page.locator('input[name="swr"]').fill("5")
    # 60,000 / 0.05 = 1,200,000
    expect(page.get_by_text("$1,200,000.00").first).to_be_visible()
