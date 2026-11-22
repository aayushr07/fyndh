# Test Plan: QuickShop Express Checkout & Authoritative Test Suite

## 1. Executive Summary & Quality Scope
This test plan defines the testing strategy, risk prioritization, manual exploratory records, regression verification, and automated browser test suite for the **QuickShop Single-Page Checkout** application built on **Next.js 16 (React 19)**.

The solution is verified across three complementary layers:
1. **Interactive Next.js 16 Checkout Application**: Complete cart operations, double-click protection, persistent order history storage in `localStorage`, and a dedicated **🕒 Browser History** tab.
2. **Authoritative CLI Playwright Suite (`tests/checkout.spec.js`)**: Automates mandatory scenarios from a clean application state with zero fixed sleeps, evaluating customer-visible DOM locators.
3. **In-Browser Playwright Test Runner**: Integrated directly into the application (`🧪 Playwright Test Runner` tab), executing genuine Playwright assertions comparing exact expected vs. actual values with live execution timings, failure screenshot capture, and a clean reset option.

---

## 2. Key Checkout Risks & Prioritization

Checkout risks were prioritized based on financial discrepancy risk, customer trust impact, and transaction integrity:

| Priority | Risk Category | Failure Scenario | Business & Customer Impact | Mitigation & Test Verification |
| :--- | :--- | :--- | :--- | :--- |
| **P1 - Critical** | **Duplicate Orders / Double-Charge** | Customer rapidly double-clicks "Place Order" or network jitter triggers multiple submissions. | Duplicate charges, customer confusion, inventory skew, high chargeback dispute risk. | Synchronous React ref (`isSubmittingRef`) submission lock + immediate button disabling (`disabled="true"`). Assert strictly 1 order record created. |
| **P1 - Critical** | **Financial & Calculation Drift** | Quantity adjustments fail to accurately recalculate line totals or overall order total. | Customer overcharged or undercharged; regulatory compliance failure. | Immediate reactive state recalculation; tested with exact arithmetic: **2 units of Product A (₹500) + 1 unit of Product B (₹300) = exact ₹1,300**. |
| **P2 - High** | **Customer Data Loss on Validation Error** | Customer leaves required field blank, gets an error, but all entered form inputs are wiped. | High checkout cart abandonment; degraded user experience. | Form inputs are strictly preserved in DOM and React state upon submission rejection. |
| **P2 - High** | **Empty Cart Order Processing** | Customer attempts checkout with 0 items in cart. | Ghost orders processed with ₹0 total; operational waste in warehouse dispatch. | Strict checkout block if `totalItemCount === 0`; clear high-contrast alert banner prompts user to add items. |
| **P3 - Medium** | **CSS Visibility Collision (DEF-01)** | Checkout form remains visible alongside confirmation card after placement. | Customer unsure if order went through; visual pollution. | Global utility `.hidden { display: none !important; }` overriding CSS grid specificity. Verified via regression test. |

---

## 3. Test Cases Matrix & Automated Scenarios

All tests execute from an independent, clean application state (`beforeEach` initializes a clean page with 0 items and blank inputs; zero hardcoded demo data).

### TC-01: Successful Checkout with Order Confirmation (Automated Check 1)
- **Objective:** Verify a customer can select a product, supply required customer information, complete checkout, and receive a verified order confirmation.
- **Preconditions:** Clean browser session; cart empty.
- **Test Steps:**
  1. Navigate to `/`.
  2. Click "Add to Cart" on Product A (Mechanical Keyboard @ ₹500).
  3. Verify cart total displays `₹500`.
  4. Fill required "Full Name" with `"Alice Smith"`.
  5. Fill optional email `"alice@example.com"`.
  6. Click "Place Order" button.
- **Expected Results:**
  - Confirmation card is displayed (`#confirmation-view`).
  - Order reference is generated matching pattern `^ORD-[A-Z0-9]{6}$`.
  - Customer name displays `"Alice Smith"` and confirmed total displays `"₹500"`.
  - Line items summary displays `"1 × Mechanical Keyboard"`.
- **Status:** **PASS** (Authoritative Playwright CLI & In-Browser Runner)

---

### TC-02: Missing Required Name Blocks Checkout & Preserves Inputs (Automated Check 2)
- **Objective:** Verify missing required field (Full Name) blocks checkout, renders clear error messaging, and preserves all user-entered data.
- **Preconditions:** Clean browser session; cart contains items.
- **Test Steps:**
  1. Add Product B (Wireless Mouse @ ₹300) to cart.
  2. Fill optional email `"jane.shopper@example.com"`.
  3. Fill optional delivery notes `"Ring doorbell twice on delivery"`.
  4. Leave required "Full Name" blank (whitespace only: `"   "`).
  5. Click "Place Order".
- **Expected Results:**
  - Submission is blocked; confirmation view is NOT visible.
  - `#validation-alert` is displayed with `"Please fill in all required fields"`.
  - `#name-error` displays inline message: `"Full Name is required. Please enter your name to complete checkout."`.
  - `#customer-name` has `aria-invalid="true"` attribute and error styling.
  - Customer's entered email, notes, and cart items (₹300) are 100% preserved.
- **Status:** **PASS** (Authoritative Playwright CLI & In-Browser Runner)

---

### TC-03: Quantity Calculation (2x ₹500 + 1x ₹300 = ₹1,300) (Automated Check 3)
- **Objective:** Verify modifying product quantities dynamically and accurately updates line totals and produces exact overall order total.
- **Preconditions:** Clean browser session.
- **Test Steps:**
  1. Add two units of Product A (Mechanical Keyboard @ ₹500).
  2. Add one unit of Product B (Wireless Mouse @ ₹300).
  3. Verify line total for Keyboard.
  4. Verify line total for Mouse.
  5. Verify overall order total.
  6. Decrease Keyboard quantity to 1 via `-` button.
  7. Verify updated totals.
- **Expected Results:**
  - Step 3: Keyboard line total = `₹1,000` (2 × ₹500).
  - Step 4: Mouse line total = `₹300` (1 × ₹300).
  - Step 5: Overall order total = exact `₹1,300` (₹1,000 + ₹300).
  - Step 7: Keyboard line total = `₹500`, Overall order total = `₹800` (₹500 + ₹300).
- **Status:** **PASS** (Authoritative Playwright CLI & In-Browser Runner)

---

### TC-04: Empty Cart Defensive Guard (Automated Check 4 & Manual Test 1)
- **Objective:** Verify placing an order with an empty cart is blocked with prominent feedback and preserves customer data.
- **Preconditions:** Clean browser session; cart empty (0 items).
- **Test Steps:**
  1. Fill "Full Name" with `"Alex ManualTester"`.
  2. Fill email with `"alex@example.com"`.
  3. Leave cart empty (0 items).
  4. Click "Place Order".
- **Expected Results:**
  - Checkout blocked; confirmation screen does NOT appear.
  - Error banner displays: `"Your cart is empty. Please add at least one item before placing your order."`.
  - Customer name `"Alex ManualTester"` and email are strictly preserved.
- **Status:** **PASS** (Authoritative Playwright CLI & Manual Execution)

---

### TC-05: Rapid Double-Click Idempotency (Automated Check 5 & Manual Test 2)
- **Objective:** Verify rapidly double-clicking "Place Order" creates strictly one confirmation and prevents duplicate orders.
- **Preconditions:** Cart contains 1 item; required name filled.
- **Test Steps:**
  1. Add Product A to cart.
  2. Fill "Full Name" with `"Samantha Verified"`.
  3. Rapidly double-click "Place Order" (within < 50ms interval).
- **Expected Results:**
  - Button transitions to disabled immediately (`disabled="true"`, text: `"Processing Order..."`).
  - Second click is rejected synchronously by React ref (`isSubmittingRef.current`).
  - Exactly 1 order record is stored (`state.orderHistory.length === 1`).
  - Only one confirmation card is rendered with a single unique reference code (`ORD-XXXXXX`).
- **Status:** **PASS** (Authoritative Playwright CLI & Manual Execution)

---

### TC-06: Regression Test for DEF-01 View Visibility (Automated Check 6)
- **Objective:** Verify that `#checkout-view` is completely hidden when order confirmation is displayed, guaranteeing that grid styling does not override the `.hidden` utility class.
- **Preconditions:** Clean browser session.
- **Test Steps:**
  1. Add Product B to cart.
  2. Fill name `"Elena Rostova"` and email `"elena@example.com"`.
  3. Click "Place Order".
  4. Assert `#confirmation-view` is visible.
  5. Assert `#checkout-view` is hidden (`toBeHidden()`).
- **Expected Results:**
  - `#checkout-view` has `display: none !important;` and is hidden from accessibility tree and viewport.
- **Status:** **PASS** (Authoritative Playwright CLI & In-Browser Runner)

---

## 4. Manual Testing Observations & Evidence

| Scenario | Action Performed | Expected Result | Actual Result Observed | Status | Visual Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Manual Test 1: Empty Cart Checkout** | Opened clean page. Left cart at 0 items. Entered `"Alex ManualTester"` and `"alex@example.com"`. Clicked "Place Order". | Submission blocked, validation banner displayed, customer name preserved, no confirmation. | Checkout was blocked immediately. Alert banner appeared with `"Your cart is empty. Please add at least one item before placing your order."`. Customer name and email remained preserved in fields. | **PASS** | [03_empty_cart_blocked_validation.png](file:///c:/Coding/fynd/evidence/03_empty_cart_blocked_validation.png) |
| **Manual Test 2: Rapid Double-Click** | Added 2 Keyboards (₹1,000) and 1 Mouse (₹300) totaling ₹1,300. Entered `"Samantha Verified"`. Rapidly double-clicked "Place Order". | Button disabled instantly, second click dropped synchronously, single order record and single confirmation rendered. | Button disabled on first click. Second click event dropped via React `useRef` guard. Exactly 1 order recorded (`state.orderHistory.length === 1`). Reference `ORD-95HXLF` displayed with Total Paid `₹1,300`. | **PASS** | [06_order_confirmation_single_result.png](file:///c:/Coding/fynd/evidence/06_order_confirmation_single_result.png) |
| **Manual Test 3: Browser History Verification** | Navigated to Browser History tab after placing order. | All completed transactions listed in local storage with reference, customer details, timestamps, line items, and totals. | Stored order `ORD-95HXLF` rendered with 2x Keyboards + 1x Mouse totaling ₹1,300, matching submitted details. | **PASS** | [07_browser_history_view.png](file:///c:/Coding/fynd/evidence/07_browser_history_view.png) |
| **Manual Test 4: In-Browser Test Runner Suite** | Switched to `🧪 Test Runner` tab and executed all 6 checks via "▶ Run All Tests". | All 6 checks execute from clean state and pass with zero failures. | Suite status changed to `PASSED` (6/6 passed, 0 failed). Terminal logs confirmed clean execution. | **PASS** | [08_in_browser_runner_all_passed.png](file:///c:/Coding/fynd/evidence/08_in_browser_runner_all_passed.png) |

---

## 5. Defect Log & Resolutions

### Defect DEF-01: Checkout View Grid Style Overrode `.hidden` Class
- **Severity:** High (View state corruption)
- **Steps to Reproduce:**
  1. Add item to cart.
  2. Enter customer name.
  3. Click "Place Order".
  4. Inspect DOM for `#checkout-view`.
- **Expected Result:** `#checkout-view` should be invisible (`display: none`) upon order placement.
- **Actual Result:** Playwright locator assertion `expect(page.locator('#checkout-view')).toBeHidden()` timed out. In DOM: `<main id="checkout-view" class="checkout-grid hidden">` retained `display: grid` because `.checkout-grid` had equal specificity and `.hidden` was only scoped to `.confirmation-card.hidden`.
- **Root Cause:** Missing top-level global `.hidden { display: none !important; }` utility rule.
- **Resolution:** Added `.hidden { display: none !important; }` to [app/globals.css](file:///c:/Coding/fynd/app/globals.css).
- **Regression Verification:** Automated Check 6 explicitly verifies `#checkout-view` is hidden upon placement. All 6 tests pass in 6.2s.
