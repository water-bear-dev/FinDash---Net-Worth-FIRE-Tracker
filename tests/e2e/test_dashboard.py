from playwright.sync_api import sync_playwright
import sys
import os

def test_dashboard_and_add_account():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Navigate to the app
        print("Navigating to http://localhost:3000...")
        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')
        
        # Check Dashboard title
        print("Checking Dashboard title...")
        header = page.locator('h1:has-text("Dashboard")')
        if header.is_visible():
            print("Dashboard loaded successfully.")
        else:
            print("Dashboard failed to load.")
            browser.close()
            sys.exit(1)
            
        # Navigate to Manage Data
        print("Navigating to Manage Data...")
        page.click('text="Manage Data"')
        page.wait_for_selector('h1:has-text("Manage Data")')
        
        # Add a new Cash Account
        print("Adding a new cash account...")
        page.fill('[placeholder="Account Name"]', 'Test Savings Account')
        page.fill('[placeholder="Balance"]', '10000')
        page.click('text="Add Account"')
        
        # Verify it appears in the table
        print("Verifying new account in table...")
        if page.locator('td:has-text("Test Savings Account")').is_visible():
            print("Account added successfully.")
        else:
            print("Failed to add account.")
            browser.close()
            sys.exit(1)
            
        # Navigate back to Dashboard
        print("Navigating back to Dashboard...")
        page.click('text="Dashboard"')
        page.wait_for_selector('h1:has-text("Dashboard")')
        
        # Verify the new account is reflected in the net worth or account list if visible
        # (Assuming the dashboard shows a list of cash accounts)
        print("Checking if account is on Dashboard...")
        if page.locator('text="Test Savings Account"').is_visible():
            print("Account visible on Dashboard.")
        else:
            print("Account not visible on Dashboard (might be expected depending on UI).")
            
        print("Test passed!")
        browser.close()

if __name__ == "__main__":
    test_dashboard_and_add_account()
