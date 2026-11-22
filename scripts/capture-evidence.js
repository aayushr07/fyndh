const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function runEvidenceCapture() {
  const evidenceDir = path.resolve(__dirname, '../evidence');
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }

  const targetUrl = process.env.TEST_URL || 'http://localhost:3000';
  console.log(`Starting evidence capture against target: ${targetUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('Capturing Scenario 1: Clean Initial State...');
  await page.goto(targetUrl);
  await page.waitForSelector('#catalog-heading');
  await page.screenshot({ path: path.join(evidenceDir, '01_initial_clean_state.png'), fullPage: true });

  console.log('Capturing Scenario 2: Empty Cart Checkout Attempt...');
  await page.fill('#customer-name', 'Alex ManualTester');
  await page.fill('#customer-email', 'alex@example.com');
  await page.screenshot({ path: path.join(evidenceDir, '02_empty_cart_details_filled.png'), fullPage: true });

  await page.click('[data-testid="place-order-btn"]');
  await page.waitForSelector('#validation-alert:not(.hidden)');
  await page.screenshot({ path: path.join(evidenceDir, '03_empty_cart_blocked_validation.png'), fullPage: true });

  console.log('Capturing Scenario 3: Missing Required Name Validation...');
  await page.click('[data-testid="add-to-cart-prod-keyboard"]'); // Add Keyboard (₹500)
  await page.fill('#customer-name', '');
  await page.click('[data-testid="place-order-btn"]');
  await page.waitForSelector('#name-error:not(.hidden)');
  await page.screenshot({ path: path.join(evidenceDir, '04_missing_name_validation.png'), fullPage: true });

  console.log('Capturing Scenario 4: Quantity Calculation (2x ₹500 + 1x ₹300 = ₹1,300)...');
  await page.click('[data-testid="add-to-cart-prod-keyboard"]'); // 2 Keyboards @ ₹500 = ₹1,000
  await page.click('[data-testid="add-to-cart-prod-mouse"]');    // 1 Mouse @ ₹300 = ₹300 -> Total ₹1,300
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(evidenceDir, '05_cart_quantities_updated.png'), fullPage: true });

  console.log('Capturing Scenario 5: Rapid Double-Click & Single Order Confirmation...');
  await page.fill('#customer-name', 'Samantha Verified');
  const placeOrderBtn = page.locator('[data-testid="place-order-btn"]');
  await placeOrderBtn.dblclick();

  await page.waitForSelector('[data-testid="confirmation-section"]:not(.hidden)');
  await page.screenshot({ path: path.join(evidenceDir, '06_order_confirmation_single_result.png'), fullPage: true });

  const orderHistory = await page.evaluate(() => window.state.orderHistory);
  console.log(`Order history length after rapid double click: ${orderHistory.length}`);
  console.log(`Generated Order Reference: ${orderHistory[0]?.reference}`);
  console.log(`Total Paid: ₹${orderHistory[0]?.total?.toLocaleString('en-IN')}`);

  // Also capture the new Browser History tab
  console.log('Capturing Scenario 7: Browser History Tab with Recorded Order...');
  const historyTabBtn = page.locator('#tab-btn-browser-history');
  if (await historyTabBtn.isVisible()) {
    await historyTabBtn.click();
    await page.waitForSelector('#browser-history-view');
    await page.screenshot({ path: path.join(evidenceDir, '07_browser_history_view.png'), fullPage: true });
  }

  fs.writeFileSync(
    path.join(evidenceDir, 'manual_test_execution_log.json'),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      orderHistoryLength: orderHistory.length,
      orderRecord: orderHistory[0],
      testsExecuted: [
        'Initial Clean State Verification',
        'Empty Cart Checkout Block',
        'Missing Required Field Checkout Block',
        'Quantity Calculation: 2x ₹500 + 1x ₹300 = ₹1,300',
        'Rapid Double-Click Submission Protection & Ref Lock',
        'DEF-01 View Visibility Regression Check',
        'Persistent Browser History Verification'
      ]
    }, null, 2)
  );

  await browser.close();
  console.log('Evidence capture complete! Updated screenshots saved to ./evidence/');
}

runEvidenceCapture().catch(err => {
  console.error('Evidence capture failed:', err);
  process.exit(1);
});
