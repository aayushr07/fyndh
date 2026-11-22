const { test, expect } = require('@playwright/test');
const path = require('path');

const targetUrl = process.env.TEST_URL || 'http://localhost:3000';

test.describe('Petal - Playwright Browser Automation Test Suite', () => {

  // Guarantee a fresh browser page and clean isolated state for every test
  test.beforeEach(async ({ page }) => {
    await page.goto(targetUrl);
    // Ensure the checkout form is clean and ready
    await expect(page.locator('#catalog-heading')).toBeVisible();
    await expect(page.locator('[data-testid="order-total"]')).toHaveText('₹0');
    await expect(page.locator('#customer-name')).toHaveValue('');
  });

  /**
   * SCENARIO 1: Successful Checkout
   * Customer enters "Alice Smith" and "alice@example.com" through visible fields,
   * adds Mechanical Keyboard, places order, and verifies confirmation displays Alice Smith, ₹500, and reference.
   */
  test('Scenario 1: Successful checkout produces confirmation matching submitted customer data', async ({ page }) => {
    const customer = {
      name: 'Alice Smith',
      email: 'alice@example.com'
    };

    // 1. Add Mechanical Keyboard (₹500)
    const addKeyboardBtn = page.locator('[data-testid="add-to-cart-prod-keyboard"]');
    await addKeyboardBtn.click();

    // Verify cart reflects addition
    await expect(page.locator('[data-testid="order-total"]')).toHaveText('₹500');
    await expect(page.locator('[data-testid="line-total-prod-keyboard"]')).toHaveText('₹500');

    // 2. Fill in customer information through visible inputs
    const nameInput = page.locator('#customer-name');
    const emailInput = page.locator('#customer-email');
    await nameInput.fill(customer.name);
    await emailInput.fill(customer.email);

    // 3. Click Place Order
    const placeOrderBtn = page.locator('[data-testid="place-order-btn"]');
    await placeOrderBtn.click();

    // 4. Verify confirmation view becomes visible and checkout view is hidden
    const confirmationView = page.locator('[data-testid="confirmation-section"]');
    await expect(confirmationView).toBeVisible();
    await expect(page.locator('#checkout-view')).toBeHidden();

    // 5. Verify confirmation displays the exact customer name entered in THIS test
    const confirmedName = page.locator('#confirmation-name');
    await expect(confirmedName).toHaveText(customer.name);

    // 6. Verify correct order total of ₹500 and generated unique order reference
    await expect(page.locator('#confirmation-total')).toHaveText('₹500');
    const refElement = page.locator('[data-testid="order-reference"]');
    await expect(refElement).toBeVisible();
    await expect(refElement).toHaveText(/^ORD-[A-Z0-9]{6}$/);

    // 7. Verify items summary displays ordered item
    const confirmationItems = page.locator('#confirmation-items-list');
    await expect(confirmationItems).toContainText('1 × Mechanical Keyboard');
    await expect(confirmationItems).toContainText('₹500');
  });

  /**
   * SCENARIO 2: Missing Name
   * Customer adds Wireless Mouse, fills email and notes, leaves name blank/whitespace, and attempts checkout.
   * Verifies rejection, no confirmation, inline validation error, and preservation of cart and inputs.
   */
  test('Scenario 2: Missing required name blocks checkout and preserves customer inputs and cart items', async ({ page }) => {
    const customer = {
      email: 'jane.shopper@example.com',
      notes: 'Ring doorbell twice on delivery'
    };

    // 1. Add Wireless Mouse (₹300)
    await page.locator('[data-testid="add-to-cart-prod-mouse"]').click();
    await expect(page.locator('[data-testid="order-total"]')).toHaveText('₹300');

    // 2. Fill optional email and notes, leave name empty or whitespace only
    const emailInput = page.locator('#customer-email');
    const notesInput = page.locator('#customer-notes');
    const nameInput = page.locator('#customer-name');

    await emailInput.fill(customer.email);
    await notesInput.fill(customer.notes);
    await nameInput.fill('   '); // Whitespace only

    // 3. Attempt checkout
    const placeOrderBtn = page.locator('[data-testid="place-order-btn"]');
    await placeOrderBtn.click();

    // 4. Verify checkout is blocked: no confirmation view is displayed
    await expect(page.locator('[data-testid="confirmation-section"]')).toBeHidden();
    await expect(page.locator('#checkout-view')).toBeVisible();

    // 5. Verify validation messages are displayed
    const validationAlert = page.locator('#validation-alert');
    await expect(validationAlert).toBeVisible();
    await expect(page.locator('#validation-message')).toContainText('Please fill in all required fields');

    const nameError = page.locator('#name-error');
    await expect(nameError).toBeVisible();
    await expect(nameError).toHaveText('Full Name is required. Please enter your name to complete checkout.');
    await expect(nameInput).toHaveAttribute('aria-invalid', 'true');

    // 6. Verify customer's entered inputs and cart items remain strictly unchanged
    await expect(emailInput).toHaveValue(customer.email);
    await expect(notesInput).toHaveValue(customer.notes);
    await expect(page.locator('[data-testid="order-total"]')).toHaveText('₹300');
    await expect(page.locator('[data-testid="line-total-prod-mouse"]')).toHaveText('₹300');
  });

  /**
   * SCENARIO 3: Quantity Calculation
   * Adds two Keyboards (2 × ₹500 = ₹1,000) and one Mouse (1 × ₹300 = ₹300), verifies exact total ₹1,300,
   * decreases Keyboard to one, and verifies updated total ₹800 using values read from the webpage.
   */
  test('Scenario 3: Quantity changes dynamically update line totals and produce exact order totals', async ({ page }) => {
    // 1. Add two Keyboards (@ ₹500 each)
    const addKeyboardBtn = page.locator('[data-testid="add-to-cart-prod-keyboard"]');
    await addKeyboardBtn.click();
    await addKeyboardBtn.click();

    // 2. Add one Mouse (@ ₹300 each)
    const addMouseBtn = page.locator('[data-testid="add-to-cart-prod-mouse"]');
    await addMouseBtn.click();

    // 3. Read line totals and order total directly from rendered webpage
    const keyboardLineTotal = page.locator('[data-testid="line-total-prod-keyboard"]');
    const mouseLineTotal = page.locator('[data-testid="line-total-prod-mouse"]');
    const orderTotal = page.locator('[data-testid="order-total"]');

    // Assert exact values read from webpage
    await expect(keyboardLineTotal).toHaveText('₹1,000');
    await expect(mouseLineTotal).toHaveText('₹300');
    await expect(orderTotal).toHaveText('₹1,300');

    // 4. Decrease Keyboard quantity to one using "-" button
    const keyboardDecreaseBtn = page.locator('[data-testid="decrease-prod-keyboard"]');
    await keyboardDecreaseBtn.click();

    // 5. Verify updated values read from webpage (1 × ₹500 + 1 × ₹300 = ₹800)
    await expect(keyboardLineTotal).toHaveText('₹500');
    await expect(orderTotal).toHaveText('₹800');
  });

  /**
   * SCENARIO 4: Empty Cart
   * Starts with an empty cart, enters "John EmptyCart", attempts checkout,
   * and verifies empty-cart validation appears, no order is created, and the name remains populated.
   */
  test('Scenario 4: Empty cart prevents checkout, displays validation, and preserves customer name', async ({ page }) => {
    const customer = { name: 'John EmptyCart' };

    // 1. Ensure cart is empty
    await expect(page.locator('[data-testid="order-total"]')).toHaveText('₹0');

    // 2. Fill customer name
    const nameInput = page.locator('#customer-name');
    await nameInput.fill(customer.name);

    // 3. Click Place Order
    const placeOrderBtn = page.locator('[data-testid="place-order-btn"]');
    await placeOrderBtn.click();

    // 4. Verify checkout blocked: confirmation hidden, checkout view visible
    await expect(page.locator('[data-testid="confirmation-section"]')).toBeHidden();
    await expect(page.locator('#checkout-view')).toBeVisible();

    // 5. Verify empty-cart validation message is displayed
    const alertMessage = page.locator('#validation-message');
    await expect(alertMessage).toBeVisible();
    await expect(alertMessage).toContainText('Your cart is empty. Please add at least one item');

    // 6. Verify customer name remains populated in the form field
    await expect(nameInput).toHaveValue(customer.name);

    // 7. Verify no order was created in application state
    const orderCount = await page.evaluate(() => (window.state && window.state.orderHistory ? window.state.orderHistory.length : 0));
    expect(orderCount).toBe(0);
  });

  /**
   * SCENARIO 5: Rapid Double-Click
   * Enters "Samantha Verified", adds one Keyboard, rapidly clicks Place Order twice,
   * and verifies that only one order confirmation is displayed and only one unique reference is generated.
   */
  test('Scenario 5: Rapid double-click on Place Order creates only one confirmation and one order record', async ({ page }) => {
    const customer = { name: 'Samantha Verified' };

    // 1. Add product and enter customer name
    await page.locator('[data-testid="add-to-cart-prod-keyboard"]').click();
    await page.locator('#customer-name').fill(customer.name);

    const placeOrderBtn = page.locator('[data-testid="place-order-btn"]');

    // 2. Trigger genuine rapid double-click on the actual webpage button
    await placeOrderBtn.dblclick();

    // 3. Verify exactly one confirmation section is visible
    const confirmationView = page.locator('[data-testid="confirmation-section"]');
    await expect(confirmationView).toBeVisible();

    // 4. Verify customer name displayed on confirmation matches submitted name
    await expect(page.locator('#confirmation-name')).toHaveText(customer.name);

    // 5. Verify exactly one unique reference is generated
    const refElement = page.locator('[data-testid="order-reference"]');
    await expect(refElement).toBeVisible();
    await expect(refElement).toHaveText(/^ORD-[A-Z0-9]{6}$/);

    // 6. Verify strictly one order record exists in application state
    const orderCount = await page.evaluate(() => window.state.orderHistory.length);
    expect(orderCount).toBe(1);
  });

  /**
   * SCENARIO 6: CSS Visibility Regression (DEF-01)
   * Performs real successful checkout using customer information entered through the webpage,
   * verifies confirmation becomes visible and checkout view becomes hidden, using the test's own input data.
   */
  test('Scenario 6 (Regression DEF-01): Successful checkout hides checkout view and shows confirmation without default data', async ({ page }) => {
    // Unique customer input specific to this test
    const customer = {
      name: 'Elena Rostova',
      email: 'elena@example.com'
    };

    // 1. Add product and fill inputs through webpage
    await page.locator('[data-testid="add-to-cart-prod-mouse"]').click();
    await page.locator('#customer-name').fill(customer.name);
    await page.locator('#customer-email').fill(customer.email);

    // 2. Click Place Order
    await page.locator('[data-testid="place-order-btn"]').click();

    // 3. Verify confirmation view becomes visible
    const confirmationView = page.locator('[data-testid="confirmation-section"]');
    await expect(confirmationView).toBeVisible();

    // 4. Verify checkout view becomes hidden (DEF-01 specificity resolution)
    const checkoutView = page.locator('#checkout-view');
    await expect(checkoutView).toBeHidden();

    // 5. Verify confirmation displays this test's submitted customer name (no hardcoded/default data)
    await expect(page.locator('#confirmation-name')).toHaveText(customer.name);
    await expect(page.locator('#confirmation-total')).toHaveText('₹300');
  });

});
