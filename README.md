# QuickShop — Next.js Checkout & Playwright Browser Test Suite

A single-page checkout application built with **Next.js 16 (React 19)** accompanied by an authoritative Playwright browser test suite and a **live in-browser Playwright Test Runner**.

---

## 🌟 Highlights

- **Next.js 16 & React 19 Frontend**: Responsive layout ([app/page.jsx](app/page.jsx), [app/layout.jsx](app/layout.jsx), [app/globals.css](app/globals.css)) with reactive state management and instant calculations.
- **🕒 Browser History Tab & Persistent Order Storage**:
  - Automatically records all placed orders in browser `localStorage` and React state.
  - Dedicated **"🕒 Browser History"** tab displaying order references (`ORD-XXXXXX`), timestamps, customer details, item breakdowns with line totals, and grand total.
  - Interactive actions: quick "View Confirmation" receipt modal, "Delete" entry, and "Clear History" options.
  - Aggregate statistics showing Total Orders Placed, Total Spend, and Total Items Ordered.
- **Transparent Error Handling**: Zero third-party error suppression or extension guards; standard Next.js error transparency.
- **Strengthened Core Functionalities**:
  - Cart cannot proceed to checkout when empty.
  - Quantities cannot become negative or invalid (typing negative or zero cleanly clamped or removed).
  - Products are removed correctly when quantity reaches zero or when clicking Remove.
  - Synchronous submission guard using a React ref (`isSubmittingRef`) disables the Place Order button and prevents duplicate orders even during rapid double-clicks.
  - Every successful order generates a unique reference number (`ORD-XXXXXX`) and displays a confirmation screen.
  - Customer's entered name and cart contents are preserved whenever validation fails.
- **Precise Pricing & Currency Calculations**:
  - **Product A (Mechanical Keyboard)**: **₹500**
  - **Product B (Wireless Mouse)**: **₹300**
  - Two units of Product A (₹1,000) + one unit of Product B (₹300) = **exact order total of ₹1,300**.
- **In-Browser Playwright Test Runner**:
  - Integrated directly in the **"🧪 Playwright Test Runner"** tab.
  - Starts clean on every run (no demo data).
  - Displays individual test names, pass/fail status, execution duration in milliseconds, expected vs. actual values, automatic failure screenshot capture, and a clean reset option.
- **Authoritative CLI Playwright Suite**:
  - 6 comprehensive tests in [tests/checkout.spec.js](tests/checkout.spec.js) executing independent checks from clean application states with customer-visible assertions and zero arbitrary sleeps.
  - Includes explicit regression testing for the previously resolved CSS view visibility defect (**DEF-01**).

---

## 📦 Project Structure

```text
fynd/
├── app/
│   ├── layout.jsx               # Clean Next.js root layout (no extension guards)
│   ├── globals.css              # Styling with global .hidden specificity override
│   └── page.jsx                 # Next.js checkout store + browser history + Playwright test runner
├── tests/
│   └── checkout.spec.js         # Authoritative Playwright test suite (6 specs)
├── scripts/
│   └── capture-evidence.js      # Evidence runner capturing screenshots & execution logs
├── evidence/                    # Captured screenshots & telemetry logs
│   ├── 01_initial_clean_state.png
│   ├── 02_empty_cart_details_filled.png
│   ├── 03_empty_cart_blocked_validation.png
│   ├── 04_missing_name_validation.png
│   ├── 05_cart_quantities_updated.png
│   ├── 06_order_confirmation_single_result.png
│   └── manual_test_execution_log.json
├── playwright.config.js         # Playwright test configuration
├── next.config.js               # Next.js configuration
├── TEST_PLAN.md                 # Risk prioritization, test matrix, and manual test logs
└── package.json                 # Project dependencies & test scripts
```

---

## 🚀 Running the Next.js Application

### 1. Development Mode (Interactive Server)
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser:
- **🛍️ Store Checkout**: Test adding products, adjusting quantities, and placing orders.
- **🕒 Browser History**: View all past orders stored in browser session, check order details and totals, or clear history.
- **🧪 Playwright Test Runner**: Click "▶ Run All Tests" to watch genuine assertions comparing expected vs. actual values with execution timings and a clean reset button.
- **📋 Test Plan & Evidence**: View the risk prioritization table, manual test logs, and defect reports.

### 2. Static Build
```bash
npm run build
```

---

## 🧪 Authoritative CLI Playwright Tests

Run the authoritative Playwright test suite:
```bash
npm test
# or
npx playwright test
```

### Headed & Interactive UI Modes:
```bash
# Watch the browser execute tests in real-time
npm run test:headed

# Open Playwright interactive UI
npm run test:ui

# View full HTML test report
npm run test:report
```

---

## 🔍 The 6 Automated Checks in the Suite

1. **Check 1: Successful Checkout Produces Order Confirmation**
   - Adds Keyboard (₹500) -> Fills name `Alice Smith` -> Clicks Place Order -> Asserts confirmation view appears with reference matching `^ORD-[A-Z0-9]{6}$` and total ₹500.
2. **Check 2: Missing Required Field Blocks Checkout & Preserves Inputs**
   - Adds Mouse (₹300) -> Leaves name blank -> Clicks Place Order -> Asserts checkout blocked, validation messages displayed, and entered email/notes and cart contents strictly preserved.
3. **Check 3: Quantity Calculation (2x ₹500 + 1x ₹300 = ₹1,300)**
   - Adds two Keyboards (2 × ₹500 = ₹1,000) and one Mouse (1 × ₹300 = ₹300) -> Asserts exact line totals and exact overall total of **₹1,300**.
   - Decrements Keyboard to 1 -> Asserts updated total of **₹800**.
4. **Check 4: Empty Cart Defensive Guard**
   - Attempts checkout with 0 items -> Blocks submission with visible guidance banner and preserves entered customer name.
5. **Check 5: Rapid Double-Click Protection**
   - Simulates rapid double-click on Place Order -> Button disabled immediately on first event; second event dropped via synchronous React ref (`isSubmittingRef`); exactly 1 order record created.
6. **Check 6: DEF-01 Regression Test (CSS Visibility)**
   - Verifies `#checkout-view` is completely hidden (`display: none !important`) upon confirmation.
