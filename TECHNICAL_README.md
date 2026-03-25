# FinDash: Technical Architecture & Considerations

This document outlines the technical architecture, design decisions, and data flows that power **FinDash**. It is intended for developers looking to understand the core engine, contribute to the project, or fork it for their own use.

## 1. Core Architecture Pattern: Pure Client-Side Application

FinDash is architected as a **100% Client-Side Application** (SPA) built with React and Vite. 

**Key Technical Considerations:**
*   **No Backend Backendless Design**: The application does not have a traditional backend server or database (like PostgreSQL or MongoDB). All computation, data processing, and API fetching happen directly inside the user's browser.
*   **Hash Routing**: React Router handles navigation using a `HashRouter`. This was chosen over a `BrowserRouter` to ensure maximum compatibility when hosted on static file servers (like GitHub Pages or Amazon S3), as it prevents 404 errors on deep links without needing server-side URL rewrites.

## 2. State Management & Data Persistence

The app eschews complex global state libraries (like Redux or Zustand) in favor of React's built-in hooks, heavily augmented for local persistence.

**Key Technical Considerations:**
*   **`useLocalStorage` Custom Hook**: The backbone of the application's data persistence. It wraps `useState` to automatically synchronize a piece of state with `window.localStorage`. Every time a state property (like `transactions` or `budgetItems`) is updated, it is instantly stringified and saved to disk.
*   **Storage Limits**: Browser `localStorage` typically has a strict 5MB quota. Because FinDash only stores textual/JSON ledger data, 5MB is sufficient for tens of thousands of individual transactions. However, this hard limit must be considered if attempting to attach media files or heavy datasets in future updates.
*   **Memory vs. Disk Syncing**: When data is imported via the Export/Import feature, the `localStorage` is overwritten directly on the disk layer. To ensure React's memory heap synchronizes with the new disk layer, a forced browser reload (`window.location.reload()`) is triggered post-import.

## 3. Financial Engine & Computations

Calculating Net Worth, FIRE numbers, and portfolio values relies heavily on calculating derived state.

**Key Technical Considerations:**
*   **Heavy reliance on `useMemo`**: Because the top-level `App.tsx` component holds the global state, any minor change triggers a re-render. To prevent performance bottlenecks, all expensive calculations (Net Worth aggregation, holding calculations from transaction ledgers) are wrapped in `useMemo`. They only recalculate when their specific dependency arrays change.
*   **Ledger-Based Portfolio Tracking**: Instead of saving a list of "current holdings," the app maintains a ledger of atomic `transactions` (buys and sells). The `holdings` array is derived state, dynamically calculated on every render by iterating through the historical transaction ledger. This ensures mathematical accuracy for cost-basis calculations over time.

## 4. External API Integrations (Market Data)

To track stock and ETF values dynamically, the app fetches live market data from Financial Modeling Prep (FMP).

**Key Technical Considerations:**
*   **Client-Side API Calls**: Because there is no backend proxy, HTTP requests to FMP are made directly from the client.
*   **API Key Storage**: The user's FMP API key is stored locally in their browser. It is incredibly important that the application never logs or attempts to sync this key remotely.
*   **Batch Request Optimization**: To prevent rate-limiting, the app concatenates all stock tickers into a single comma-separated batch request rather than firing independent HTTP requests for each asset in the portfolio.

## 5. Budgeting & Event Generation Engine

The budgeting system allows users to define recurring "rules" rather than manually plotting out every future event.

**Key Technical Considerations:**
*   **Stateless Expansion**: The app does not save future projected events into `localStorage`. Instead, it saves the *rule* (e.g., "Pay \$2000 every month on the 1st"). When rendering the calendar or dashboard, a `generateRecurringEvents` utility parses these rules and dynamically generates the calendar items for the current viewport (e.g., the current month) in real-time. 
*   **Algorithmic Complexity**: Expanding recurring rules on the fly requires optimized date-math (powered by `moment.js`). The generator must account for edge cases, such as "end conditions" (e.g., stopping a monthly car payment rule automatically once the associated `liability` balance hits 0).

## 6. Security & Privacy Profile

**Key Technical Considerations:**
*   **Zero-Knowledge Architecture**: By design, the developers of FinDash have zero access to the user's data.
*   **Unencrypted Local Storage**: Data stored in `localStorage` is saved in plain text. Any script running on the same domain (XSS attacks), or any person with physical access to the browser's developer tools, can read the data. 
*   **Export File Protection**: The JSON backup files generated by the application are completely unencrypted. Users are warned via UI prompts to store these files inside encrypted vaults.

## 7. Theming & UI

**Key Technical Considerations:**
*   **Tailwind CSS Strategy**: The app uses Tailwind for atomic utility classes. The dark mode is implemented natively by saving a `theme` preference string to local storage, which dynamically appends a `.dark` class to the root `<html>` node. This ensures CSS variables cascade correctly throughout standard components and high-leverage visualization libraries like Recharts.
