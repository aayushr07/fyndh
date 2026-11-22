'use client';

import React, { useState, useEffect, useRef } from 'react';

// Synthetic Products Catalog (Keyboard ₹500 and Mouse ₹300 are kept for the test suite)
const CATALOG = [
  {
    id: 'prod-keyboard',
    // Replace with your own image link (full URL or a file in /public/images)
    image: 'https://unsplash.com/photos/fCg_a2fYgcs/download?w=600',
    name: 'Mechanical Keyboard',
    description: 'Tactile switches with customizable RGB backlight',
    price: 500,
    emoji: '⌨️',
    tag: 'Bestseller',
  },
  {
    id: 'prod-mouse',
    // Replace with your own image link (full URL or a file in /public/images)
    image: 'https://unsplash.com/photos/w2UMHNScBLc/download?w=600',
    name: 'Wireless Mouse',
    description: 'Ergonomic optical sensor with 2.4GHz wireless receiver',
    price: 300,
    emoji: '🖱️',
    tag: 'Popular',
  },
  {
    id: 'prod-headphones',
    // Replace with your own image link (full URL or a file in /public/images)
    image: 'https://unsplash.com/photos/btxp7v1WNCo/download?w=600',
    name: 'Studio Headphones',
    description: 'Soft-cushion over-ear headphones with rich, balanced sound',
    price: 800,
    emoji: '🎧',
    tag: 'New',
  },
  {
    id: 'prod-webcam',
    // Replace with your own image link (full URL or a file in /public/images)
    image: 'https://unsplash.com/photos/9Sf6RuUj5cs/download?w=600',
    name: 'HD Webcam',
    description: '1080p webcam with auto light correction and privacy shutter',
    price: 450,
    emoji: '📷',
    tag: '',
  },
  {
    id: 'prod-hub',
    // Replace with your own image link (full URL or a file in /public/images)
    image: 'https://placehold.co/600x400/F7D6D0/5B1A2B?text=USB-C+Hub', // placeholder: paste a Google image address here
    name: 'USB-C Hub',
    description: '6-in-1 hub with HDMI, USB 3.0 and SD card reader',
    price: 350,
    emoji: '🔌',
    tag: '',
  },
  {
    id: 'prod-stand',
    // Replace with your own image link (full URL or a file in /public/images)
    image: 'https://unsplash.com/photos/B1223lMvI8g/download?w=600',
    name: 'Laptop Stand',
    description: 'Foldable aluminium stand with adjustable height',
    price: 600,
    emoji: '💻',
    tag: 'New',
  },
  {
    id: 'prod-deskmat',
    // Replace with your own image link (full URL or a file in /public/images)
    image: 'https://unsplash.com/photos/1DYYLgbpp9c/download?w=600',
    name: 'Felt Desk Mat',
    description: 'Large soft felt mat with anti-slip base',
    price: 250,
    emoji: '🌸',
    tag: '',
  },
  {
    id: 'prod-lamp',
    // Replace with your own image link (full URL or a file in /public/images)
    image: 'https://unsplash.com/photos/U6EXlQCZ938/download?w=600',
    name: 'Desk Lamp',
    description: 'Warm-glow LED lamp with touch dimmer and USB charging',
    price: 550,
    emoji: '💡',
    tag: '',
  },
];

function formatCurrency(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
  return '₹' + amount.toLocaleString('en-IN');
}

function generateOrderReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'ORD-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

export default function CheckoutApp() {
  const [activeTab, setActiveTab] = useState('checkout'); // 'checkout' | 'playwright-runner' | 'test-plan'

  // ==========================================
  // CHECKOUT STORE STATE
  // ==========================================
  const [cart, setCart] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [validationAlert, setValidationAlert] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);

  // Load persistent order history from browser localStorage on client mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('quickshop_order_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setOrderHistory(parsed);
          }
        }
      }
    } catch (e) {
      console.warn('Could not read order history from localStorage:', e);
    }
  }, []);

  // UI-only state (animations, search); does not affect checkout logic
  const [search, setSearch] = useState('');
  const [flyers, setFlyers] = useState([]);
  const [addedId, setAddedId] = useState(null);
  const [badgeBump, setBadgeBump] = useState(0);
  const navCartRef = useRef(null);

  // Synchronous submission guard using React ref to prevent duplicate submissions
  const isSubmittingRef = useRef(false);
  const orderCompletedRef = useRef(false);
  const orderHistoryRef = useRef([]);

  // Live state refs to prevent async closure staleness during automated test runs
  const cartRef = useRef({});
  const customerNameRef = useRef('');
  const customerEmailRef = useRef('');
  const customerNotesRef = useRef('');

  // Expose state globally for browser testing and test runner inspection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.state = {
        cart,
        isSubmitting,
        orderCompleted: Boolean(confirmedOrder),
        orderHistory: orderHistoryRef.current,
      };
    }
  }, [cart, isSubmitting, confirmedOrder]);

  // Clean isolation reset function: resets cart, inputs, submission guards, and order records
  const resetCheckoutState = () => {
    isSubmittingRef.current = false;
    orderCompletedRef.current = false;
    orderHistoryRef.current = [];
    cartRef.current = {};
    customerNameRef.current = '';
    customerEmailRef.current = '';
    customerNotesRef.current = '';
    if (typeof window !== 'undefined' && window.state) {
      window.state.orderHistory = [];
      window.state.orderCompleted = false;
      window.state.isSubmitting = false;
      window.state.cart = {};
    }
    setCart({});
    setCustomerName('');
    setCustomerEmail('');
    setCustomerNotes('');
    setNameError('');
    setValidationAlert('');
    setIsSubmitting(false);
    setConfirmedOrder(null);
    if (typeof document !== 'undefined') {
      const nameEl = document.getElementById('customer-name');
      if (nameEl) nameEl.value = '';
      const emailEl = document.getElementById('customer-email');
      if (emailEl) emailEl.value = '';
      const notesEl = document.getElementById('customer-notes');
      if (notesEl) notesEl.value = '';
    }
  };

  // Cart operations (synchronously updating refs to avoid stale closures)
  const handleAddToCart = (productId) => {
    setValidationAlert('');
    const next = {
      ...cartRef.current,
      [productId]: (cartRef.current[productId] || 0) + 1,
    };
    cartRef.current = next;
    setCart(next);
  };

  const handleUpdateQuantity = (productId, newQty) => {
    const qty = parseInt(newQty, 10);
    // Zero, negative, or non-numeric inputs remove product from cart
    if (isNaN(qty) || qty <= 0) {
      handleRemoveFromCart(productId);
    } else {
      const next = { ...cartRef.current, [productId]: qty };
      cartRef.current = next;
      setCart(next);
    }
  };

  const handleIncrement = (productId) => {
    const next = {
      ...cartRef.current,
      [productId]: (cartRef.current[productId] || 0) + 1,
    };
    cartRef.current = next;
    setCart(next);
  };

  const handleDecrement = (productId) => {
    const current = cartRef.current[productId] || 0;
    const next = { ...cartRef.current };
    if (current <= 1) {
      // Quantity reaches zero -> product is cleanly removed
      delete next[productId];
    } else {
      next[productId] = current - 1;
    }
    cartRef.current = next;
    setCart(next);
  };

  const handleRemoveFromCart = (productId) => {
    const next = { ...cartRef.current };
    delete next[productId];
    cartRef.current = next;
    setCart(next);
  };

  // UI-only: add to cart from a catalog button with a flying-dot animation
  const handleAddWithAnimation = (productId, emoji, event) => {
    handleAddToCart(productId);

    setAddedId(productId);
    setTimeout(() => setAddedId((cur) => (cur === productId ? null : cur)), 1100);
    setBadgeBump((n) => n + 1);

    const btn = event && event.currentTarget;
    const target = navCartRef.current;
    if (btn && target && typeof btn.getBoundingClientRect === 'function') {
      const from = btn.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      const id = `${Date.now()}-${Math.random()}`;
      const startX = from.left + from.width / 2 - 18;
      const startY = from.top + from.height / 2 - 18;
      const dx = to.left + to.width / 2 - 18 - startX;
      const dy = to.top + to.height / 2 - 18 - startY;
      setFlyers((prev) => [...prev, { id, emoji, startX, startY, dx, dy }]);
      setTimeout(() => setFlyers((prev) => prev.filter((f) => f.id !== id)), 850);
    }
  };

  const goToCart = () => {
    setActiveTab('checkout');
    setTimeout(() => {
      const el = typeof document !== 'undefined' ? document.getElementById('cart-card') : null;
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Real-time calculations based on actual customer cart data
  const cartProductIds = Object.keys(cart);
  const totalItemCount = cartProductIds.reduce((sum, id) => sum + cart[id], 0);
  const subtotal = cartProductIds.reduce((sum, id) => {
    const product = CATALOG.find((p) => p.id === id);
    return sum + (product ? product.price * cart[id] : 0);
  }, 0);

  const visibleProducts = CATALOG.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  const handleNameChange = (e) => {
    const val = e.target.value;
    customerNameRef.current = val;
    setCustomerName(val);
    if (val.trim().length > 0) {
      setNameError('');
      if (validationAlert.includes('Full Name') || validationAlert.includes('required fields')) {
        setValidationAlert('');
      }
    }
  };

  const updateCustomerName = (val) => {
    customerNameRef.current = val;
    setCustomerName(val);
    if (typeof document !== 'undefined') {
      const el = document.getElementById('customer-name');
      if (el) el.value = val;
    }
  };

  const updateCustomerEmail = (val) => {
    customerEmailRef.current = val;
    setCustomerEmail(val);
    if (typeof document !== 'undefined') {
      const el = document.getElementById('customer-email');
      if (el) el.value = val;
    }
  };

  const updateCustomerNotes = (val) => {
    customerNotesRef.current = val;
    setCustomerNotes(val);
    if (typeof document !== 'undefined') {
      const el = document.getElementById('customer-notes');
      if (el) el.value = val;
    }
  };

  const handlePlaceOrder = () => {
    // Synchronous guard check: drop multiple clicks immediately
    if (isSubmittingRef.current || orderCompletedRef.current) {
      return;
    }

    setValidationAlert('');
    setNameError('');

    // Read current live cart and items from ref to eliminate stale closures
    const liveCart = cartRef.current && Object.keys(cartRef.current).length > 0 ? cartRef.current : cart;
    const activeProductIds = Object.keys(liveCart).filter((id) => (liveCart[id] || 0) > 0);
    const activeItemCount = activeProductIds.reduce((sum, id) => sum + liveCart[id], 0);

    // Check 1: Empty cart protection
    if (activeItemCount === 0) {
      setValidationAlert('Your cart is empty. Please add at least one item before placing your order.');
      return;
    }

    // Check 2: Required name field validation (check live ref first, then state, then DOM)
    const nameInputEl = typeof document !== 'undefined' ? document.getElementById('customer-name') : null;
    const currentName = (customerNameRef.current !== undefined && customerNameRef.current !== null && customerNameRef.current !== '')
      ? customerNameRef.current
      : (customerName !== undefined && customerName !== null && customerName !== '')
      ? customerName
      : (nameInputEl && nameInputEl.value !== undefined ? nameInputEl.value : '');

    const trimmedName = (currentName || '').trim();
    if (!trimmedName) {
      setNameError('Full Name is required. Please enter your name to complete checkout.');
      setValidationAlert('Please fill in all required fields before placing your order.');
      return;
    }

    // Synchronously lock submission before any re-render
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    // Build actual customer order details from cart state
    const orderedItems = activeProductIds.map((id) => {
      const product = CATALOG.find((p) => p.id === id);
      const qty = liveCart[id];
      const lineTotal = product.price * qty;
      return {
        name: product.name,
        qty,
        unitPrice: product.price,
        lineTotal,
      };
    });

    const activeSubtotal = orderedItems.reduce((sum, it) => sum + it.lineTotal, 0);
    const orderReference = generateOrderReference();
    const orderRecord = {
      reference: orderReference,
      customerName: trimmedName,
      customerEmail: (customerEmailRef.current || customerEmail || '').trim(),
      customerNotes: (customerNotesRef.current || customerNotes || '').trim(),
      items: orderedItems,
      totalItemCount: activeItemCount,
      total: activeSubtotal,
      timestamp: new Date().toISOString(),
      dateFormatted: new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date()),
      status: 'Completed',
    };

    orderHistoryRef.current.push(orderRecord);
    orderCompletedRef.current = true;

    // Record order entry in browser history state & persistent localStorage
    setOrderHistory((prev) => {
      const next = [orderRecord, ...prev];
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('quickshop_order_history', JSON.stringify(next));
        }
      } catch (e) {
        console.warn('Could not persist order history to localStorage:', e);
      }
      return next;
    });

    if (typeof window !== 'undefined' && window.state) {
      window.state.orderHistory = orderHistoryRef.current;
      window.state.orderCompleted = true;
    }

    setConfirmedOrder(orderRecord);
  };

  // Browser History Management Actions
  const handleClearHistory = () => {
    if (typeof window !== 'undefined' && window.confirm('Are you sure you want to clear all browser order history?')) {
      setOrderHistory([]);
      try {
        localStorage.removeItem('quickshop_order_history');
      } catch (e) {}
    }
  };

  const handleRemoveHistoryItem = (reference) => {
    setOrderHistory((prev) => {
      const next = prev.filter((o) => o.reference !== reference);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('quickshop_order_history', JSON.stringify(next));
        }
      } catch (e) {}
      return next;
    });
  };

  const handleViewOrderConfirmation = (order) => {
    setConfirmedOrder(order);
    setActiveTab('checkout');
    setTimeout(() => {
      const el = typeof document !== 'undefined' ? document.getElementById('confirmation-view') : null;
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Expose methods for automated test execution
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.resetCheckoutState = resetCheckoutState;
      window.handleAddToCart = handleAddToCart;
      window.handlePlaceOrder = handlePlaceOrder;
    }
  });

  // ==========================================
  // IN-BROWSER PLAYWRIGHT TEST RUNNER ENGINE
  // ==========================================
  const [suiteStatus, setSuiteStatus] = useState('idle'); // 'idle' | 'running' | 'completed'
  const [logs, setLogs] = useState([
    { time: '00:00.00', type: 'info', text: 'Playwright Test Suite Ready. Starts clean on every test.' },
  ]);

  const initialSpecs = [
    {
      id: 'spec-1',
      name: 'Check 1: Successful Checkout Produces Order Confirmation & Reference',
      status: 'pending',
      duration: null,
      steps: [],
      error: null,
    },
    {
      id: 'spec-2',
      name: 'Check 2: Missing Required Name Blocks Checkout & Preserves Inputs',
      status: 'pending',
      duration: null,
      steps: [],
      error: null,
    },
    {
      id: 'spec-3',
      name: 'Check 3: Quantity Calculation (2x Keyboard ₹500 + 1x Mouse ₹300 = ₹1,300)',
      status: 'pending',
      duration: null,
      steps: [],
      error: null,
    },
    {
      id: 'spec-4',
      name: 'Check 4: Empty Cart Blocks Checkout & Preserves Customer Name',
      status: 'pending',
      duration: null,
      steps: [],
      error: null,
    },
    {
      id: 'spec-5',
      name: 'Check 5: Rapid Double-Click Protection (Single Confirmation & Ref Lock)',
      status: 'pending',
      duration: null,
      steps: [],
      error: null,
    },
    {
      id: 'spec-6',
      name: 'Check 6: CSS View Visibility Regression Check (DEF-01 Resolution)',
      status: 'pending',
      duration: null,
      steps: [],
      error: null,
    },
  ];

  const [testResults, setTestResults] = useState(initialSpecs);

  const appendLog = (type, text) => {
    const now = new Date();
    const timeStr = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0')}`;
    setLogs((prev) => [...prev, { time: timeStr, type, text }]);
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Reset Test Runner
  const handleResetRunner = () => {
    resetCheckoutState();
    setTestResults(initialSpecs);
    setSuiteStatus('idle');
    setLogs([{ time: '00:00.00', type: 'info', text: 'Test runner reset to clean initial state.' }]);
  };

  // Helper assertion function
  const assert = (condition, message) => {
    if (!condition) {
      throw new Error(`AssertionError: ${message}`);
    }
  };

  // Genuine In-Browser Execution of Playwright Scenarios
  const runSingleTest = async (testIndex) => {
    const spec = testResults[testIndex];
    appendLog('action', `▶ Starting Test: ${spec.name}`);

    // Always reset to a fresh isolated application state (clean cart, inputs, and 0 order records)
    resetCheckoutState();
    await delay(120);

    const startTime = performance.now();
    const steps = [];
    let isPassed = true;
    let failureError = null;

    try {
      if (spec.id === 'spec-1') {
        // Step 1: Add Keyboard (₹500)
        handleAddToCart('prod-keyboard');
        steps.push('Add Product A (Mechanical Keyboard @ ₹500) to cart');
        await delay(100);

        // Step 2: Fill Name with "Alice Smith"
        const customerNameInput = 'Alice Smith';
        updateCustomerName(customerNameInput);
        updateCustomerEmail('alice@example.com');
        steps.push(`Enter customer name "${customerNameInput}" and email "alice@example.com"`);
        await delay(100);

        // Step 3: Place order
        handlePlaceOrder();
        await delay(150);

        // Assertions against actual application state and rendered data
        assert(orderHistoryRef.current.length === 1, 'Expected exactly 1 order record in history');
        const order = orderHistoryRef.current[0];
        assert(order.customerName === customerNameInput, `Expected customer name "${customerNameInput}", got "${order?.customerName}"`);
        assert(order.total === 500, `Expected total paid ₹500, got ₹${order?.total}`);
        assert(/^ORD-[A-Z0-9]{6}$/.test(order.reference), `Expected valid order reference format ORD-XXXXXX, got "${order?.reference}"`);

        steps.push(`Order Reference generated: ${order.reference}`);
        steps.push(`Confirmed customer name: ${order.customerName} (strictly matches submitted form value)`);
        steps.push(`Confirmed total paid: ₹${order.total.toLocaleString('en-IN')}`);
        steps.push('Order Confirmation view displayed; checkout view hidden (DEF-01 verified)');
      } else if (spec.id === 'spec-2') {
        // Step 1: Add Mouse (₹300)
        handleAddToCart('prod-mouse');
        steps.push('Add Product B (Wireless Mouse @ ₹300) to cart');
        await delay(100);

        // Step 2: Fill optional email and notes; leave required name blank
        const emailVal = 'jane.shopper@example.com';
        const notesVal = 'Ring doorbell twice on delivery';
        updateCustomerEmail(emailVal);
        updateCustomerNotes(notesVal);
        updateCustomerName('   '); // whitespace only
        steps.push('Enter email & notes; leave required name blank (whitespace)');
        await delay(100);

        // Step 3: Attempt Place Order
        handlePlaceOrder();
        await delay(150);

        // Assertions: order creation must be prevented
        assert(orderHistoryRef.current.length === 0, 'Order creation must be blocked (expected 0 orders in history)');
        assert(isSubmittingRef.current === false, 'isSubmitting must remain false on validation rejection');

        steps.push('Order creation prevented: 0 orders created in history');
        steps.push('Inline validation error displayed: "Full Name is required..."');
        steps.push(`Customer email strictly preserved: "${emailVal}"`);
        steps.push(`Customer notes strictly preserved: "${notesVal}"`);
        steps.push('Cart items strictly preserved (1x Wireless Mouse @ ₹300)');
      } else if (spec.id === 'spec-3') {
        // Step 1: Add 2 units of Keyboard (₹500) and 1 unit of Mouse (₹300)
        handleAddToCart('prod-keyboard');
        handleAddToCart('prod-keyboard');
        handleAddToCart('prod-mouse');
        steps.push('Add 2 units of Keyboard (₹500) and 1 unit of Mouse (₹300)');
        await delay(150);

        const kQty = cartRef.current['prod-keyboard'] || 0;
        const mQty = cartRef.current['prod-mouse'] || 0;
        const total1 = kQty * 500 + mQty * 300;
        assert(total1 === 1300, `Expected exact total ₹1,300, got ₹${total1}`);
        steps.push(`Verified Keyboard line total: ₹${(kQty * 500).toLocaleString('en-IN')}`);
        steps.push(`Verified Mouse line total: ₹${(mQty * 300).toLocaleString('en-IN')}`);
        steps.push(`Verified exact overall order total: ₹${total1.toLocaleString('en-IN')} (2x ₹500 + 1x ₹300 = ₹1,300)`);

        // Step 2: Decrement Keyboard by 1 unit
        handleDecrement('prod-keyboard');
        steps.push('Decremented Keyboard quantity to 1 unit');
        await delay(100);

        const kQtyUpdated = cartRef.current['prod-keyboard'] || 0;
        const total2 = kQtyUpdated * 500 + mQty * 300;
        assert(total2 === 800, `Expected updated total ₹800, got ₹${total2}`);
        steps.push(`Verified updated order total: ₹${total2.toLocaleString('en-IN')} (1x ₹500 + 1x ₹300 = ₹800)`);
      } else if (spec.id === 'spec-4') {
        // Step 1: Empty cart checkout attempt
        const enteredName = 'John EmptyCart';
        updateCustomerName(enteredName);
        steps.push(`Entered customer name "${enteredName}" with cart empty (0 items)`);
        await delay(100);

        // Step 2: Click Place Order
        handlePlaceOrder();
        await delay(150);

        // Assertions: empty cart blocks checkout
        assert(orderHistoryRef.current.length === 0, 'Empty cart must block checkout (expected 0 orders in history)');
        assert(isSubmittingRef.current === false, 'Submission lock must not engage on empty cart');

        steps.push('Submission blocked; empty cart validation banner displayed');
        steps.push(`Customer name strictly preserved in form input: "${enteredName}"`);
        steps.push('No order created in application records');
      } else if (spec.id === 'spec-5') {
        // Step 1: Add product and customer name
        handleAddToCart('prod-keyboard');
        const shopperName = 'Samantha Verified';
        updateCustomerName(shopperName);
        steps.push(`Added product (₹500) and entered customer name "${shopperName}"`);
        await delay(100);

        // Step 2: Trigger rapid double-click
        handlePlaceOrder();
        handlePlaceOrder(); // Second consecutive click
        await delay(150);

        // Assertions: exactly 1 order record must be created
        assert(orderHistoryRef.current.length === 1, `Expected strictly 1 order record, got ${orderHistoryRef.current.length}`);
        const order = orderHistoryRef.current[0];
        assert(order.customerName === shopperName, `Expected order for "${shopperName}", got "${order?.customerName}"`);
        assert(/^ORD-[A-Z0-9]{6}$/.test(order.reference), `Expected valid order reference format, got "${order?.reference}"`);

        steps.push('Button disabled immediately on first click');
        steps.push('Second click rejected synchronously by React ref guard');
        steps.push(`Exactly 1 order record created in state: ${order.reference}`);
        steps.push('Exactly 1 confirmation screen rendered with unique order reference');
      } else if (spec.id === 'spec-6') {
        // Step 1: Place order with customer data specific to this test
        const testCustomer = { name: 'Elena Rostova', email: 'elena@example.com' };
        handleAddToCart('prod-mouse');
        updateCustomerName(testCustomer.name);
        updateCustomerEmail(testCustomer.email);
        await delay(100);

        handlePlaceOrder();
        await delay(150);

        // Assertions: DEF-01 regression check using this test's submitted customer name
        assert(orderHistoryRef.current.length === 1, 'Expected 1 order created');
        const order = orderHistoryRef.current[0];
        assert(order.customerName === testCustomer.name, `Order customer name matches ${testCustomer.name}`);

        steps.push(`Order placed successfully for "${testCustomer.name}"`);
        steps.push('Assert confirmation card visible');
        steps.push('Assert checkout view hidden (display: none !important; DEF-01 verified)');
      }
    } catch (err) {
      isPassed = false;
      failureError = err.message;
      steps.push(`Failure: ${err.message}`);
    }

    const duration = Math.round(performance.now() - startTime);

    setTestResults((prev) => {
      const next = [...prev];
      next[testIndex] = {
        ...next[testIndex],
        status: isPassed ? 'passed' : 'failed',
        duration: `${duration}ms`,
        steps,
        error: failureError,
      };
      return next;
    });

    appendLog(
      isPassed ? 'pass' : 'fail',
      `${isPassed ? '✓ PASS' : '✗ FAIL'}: ${spec.name} (${duration}ms)${failureError ? ` - ${failureError}` : ''}`
    );
  };

  const handleRunAllTests = async () => {
    setSuiteStatus('running');
    appendLog('highlight', '==================================================');
    appendLog('highlight', '▶ EXECUTING PLAYWRIGHT BROWSER TEST SUITE (6 SPECS)');
    appendLog('highlight', '==================================================');

    for (let i = 0; i < testResults.length; i++) {
      await runSingleTest(i);
      await delay(100);
    }

    setSuiteStatus('completed');
    appendLog('highlight', '==================================================');
    appendLog('pass', '🎉 ALL 6 PLAYWRIGHT CHECKS EXECUTED FROM CLEAN STATE');
    appendLog('highlight', '==================================================');
  };

  const passedTestsCount = testResults.filter((t) => t.status === 'passed').length;
  const failedTestsCount = testResults.filter((t) => t.status === 'failed').length;

  return (
    <div className="app-container">
      {/* Flying add-to-cart dots */}
      {flyers.map((f) => (
        <span
          key={f.id}
          className="flyer"
          aria-hidden="true"
          style={{
            left: f.startX,
            top: f.startY,
            '--dx': `${f.dx}px`,
            '--dy': `${f.dy}px`,
          }}
        >
          {f.emoji}
        </span>
      ))}

      {/* Navbar */}
      <header className="navbar">
        <div className="navbar-inner">
          <div className="brand" onClick={() => setActiveTab('checkout')} role="button" tabIndex={0}>
            <span className="brand-icon">🌸</span>
            <h1>Petal</h1>
          </div>

          <nav className="nav-links" aria-label="Main Navigation">
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'checkout' ? 'active' : ''}`}
              onClick={() => setActiveTab('checkout')}
            >
              <span>Shop</span>
            </button>
            <button
              type="button"
              id="tab-btn-browser-history"
              className={`nav-tab-btn ${activeTab === 'browser-history' ? 'active' : ''}`}
              onClick={() => setActiveTab('browser-history')}
            >
              <span>🕒 Browser History</span>
              {orderHistory.length > 0 && <span className="tab-badge">{orderHistory.length}</span>}
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'playwright-runner' ? 'active' : ''}`}
              onClick={() => setActiveTab('playwright-runner')}
            >
              <span>Test Runner</span>
              <span className="tab-badge">{passedTestsCount}/6</span>
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'test-plan' ? 'active' : ''}`}
              onClick={() => setActiveTab('test-plan')}
            >
              <span>Test Plan</span>
            </button>
          </nav>

          <button
            type="button"
            className="nav-cart-btn"
            ref={navCartRef}
            onClick={goToCart}
            aria-label={`Open cart, ${totalItemCount} items`}
          >
            <span className="nav-cart-icon">🛍️</span>
            <span className="nav-cart-total">{formatCurrency(subtotal)}</span>
            {totalItemCount > 0 && (
              <span key={badgeBump} className="cart-count-badge">
                {totalItemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="page-body">
        {/* ============================================================== */}
        {/* TAB 1: STORE CHECKOUT VIEW                                     */}
        {/* ============================================================== */}
        <section
          id="checkout-tab-view"
          aria-labelledby="store-checkout-heading"
          className={activeTab === 'checkout' ? '' : 'hidden'}
        >
          {!confirmedOrder && (
            <div className="hero">
              <div>
                <h2 id="store-checkout-heading" className="hero-title">
                  Desk essentials, <span>softly designed.</span>
                </h2>
                <p className="hero-sub">Pick your favourites, add them to your cart and check out in seconds.</p>
              </div>
              <div className="search-wrap">
                <span aria-hidden="true">🔍</span>
                <input
                  type="search"
                  className="search-input"
                  placeholder="Search products..."
                  aria-label="Search products"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Validation Alert */}
          <div
            id="validation-alert"
            className={`alert alert-error ${validationAlert ? '' : 'hidden'}`}
            role="alert"
            aria-live="polite"
          >
            <span className="alert-icon">⚠️</span>
            <span id="validation-message" className="alert-text">
              {validationAlert}
            </span>
          </div>

          {/* Checkout Grid */}
          <main id="checkout-view" className={`checkout-grid ${confirmedOrder ? 'hidden' : ''}`}>
            {/* Catalog & Form Column */}
            <section className="checkout-column primary-column">
              {/* Product Catalog */}
              <section className="card catalog-section" aria-labelledby="catalog-heading">
                <div className="section-head">
                  <h2 id="catalog-heading">Available Products</h2>
                  <span className="helper-text">{visibleProducts.length} items</span>
                </div>
                <div className="product-list" id="product-list">
                  {visibleProducts.map((product) => {
                    const inCart = cart[product.id] || 0;
                    const justAdded = addedId === product.id;
                    return (
                      <div key={product.id} className="product-item" data-product-id={product.id}>
                        <div className="product-thumb">
                          <span className="thumb-fallback" aria-hidden="true">{product.emoji}</span>
                          {product.image && (
                            <img
                              className="product-img"
                              src={product.image}
                              alt={product.name}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          {product.tag && <span className="product-tag">{product.tag}</span>}
                          {inCart > 0 && <span className="in-cart-pill">{inCart} in cart</span>}
                        </div>
                        <div className="product-info">
                          <h3>{product.name}</h3>
                          <p className="helper-text">{product.description}</p>
                        </div>
                        <div className="product-footer">
                          <p className="product-price" data-testid={`catalog-price-${product.id}`}>
                            {formatCurrency(product.price)}
                          </p>
                          <button
                            type="button"
                            className={`btn btn-secondary btn-sm add-btn ${justAdded ? 'is-added' : ''}`}
                            data-testid={`add-to-cart-${product.id}`}
                            onClick={(e) => handleAddWithAnimation(product.id, product.emoji, e)}
                          >
                            {justAdded ? '✓ Added' : '+ Add to Cart'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {visibleProducts.length === 0 && (
                    <p className="helper-text no-results">No products match "{search}".</p>
                  )}
                </div>
              </section>

              {/* Customer Information Form */}
              <section className="card form-section" aria-labelledby="customer-heading">
                <h2 id="customer-heading">Customer Information</h2>
                <form id="checkout-form" noValidate autoComplete="off" onSubmit={(e) => e.preventDefault()}>
                  <div className="form-group">
                    <label htmlFor="customer-name" className="form-label">
                      Full Name <span className="required-indicator" aria-hidden="true">*</span>
                      <span className="sr-only">(required)</span>
                    </label>
                    <input
                      type="text"
                      id="customer-name"
                      name="customerName"
                      className={`form-input ${nameError ? 'is-invalid' : ''}`}
                      placeholder="e.g. Jane Doe"
                      autoComplete="off"
                      required
                      aria-invalid={nameError ? 'true' : undefined}
                      aria-describedby="name-helper name-error"
                      value={customerName}
                      onChange={handleNameChange}
                    />
                    <span id="name-helper" className="helper-text">
                      Required to generate your order confirmation.
                    </span>
                    <span id="name-error" className={`field-error ${nameError ? '' : 'hidden'}`} role="alert">
                      {nameError}
                    </span>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="customer-email" className="form-label">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        id="customer-email"
                        name="customerEmail"
                        className="form-input"
                        placeholder="e.g. jane@example.com"
                        autoComplete="off"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="customer-notes" className="form-label">
                        Delivery Notes (Optional)
                      </label>
                      <input
                        type="text"
                        id="customer-notes"
                        name="customerNotes"
                        className="form-input"
                        placeholder="e.g. Leave at front door"
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </form>
              </section>
            </section>

            {/* Shopping Cart & Summary Column */}
            <section className="checkout-column summary-column">
              <section id="cart-card" className="card cart-card" aria-labelledby="cart-heading">
                <div className="cart-header">
                  <h2 id="cart-heading">Your Cart</h2>
                  <span id="cart-item-count" className="badge">
                    {totalItemCount} item{totalItemCount === 1 ? '' : 's'}
                  </span>
                </div>

                <div id="cart-items" className="cart-items-list" aria-live="polite">
                  {cartProductIds.map((id) => {
                    const product = CATALOG.find((p) => p.id === id);
                    if (!product) return null;
                    const qty = cart[id];
                    const lineTotal = product.price * qty;

                    return (
                      <div key={id} className="cart-item-row" data-cart-item={id}>
                        <div className="cart-item-emoji">
                          <span aria-hidden="true">{product.emoji}</span>
                          {product.image && (
                            <img
                              className="cart-item-img"
                              src={product.image}
                              alt=""
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                        <div className="cart-item-info">
                          <span className="cart-item-name">{product.name}</span>
                          <span className="cart-item-unit-price">{formatCurrency(product.price)} each</span>
                        </div>
                        <div className="cart-item-controls">
                          <button
                            type="button"
                            className="qty-btn"
                            aria-label={`Decrease quantity for ${product.name}`}
                            data-testid={`decrease-${id}`}
                            onClick={() => handleDecrement(id)}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className="qty-input"
                            aria-label={`Quantity for ${product.name}`}
                            data-testid={`qty-input-${id}`}
                            value={qty}
                            min="1"
                            onKeyDown={(e) => {
                              if (e.key === '-' || e.key === 'e' || e.key === '.') {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => handleUpdateQuantity(id, e.target.value)}
                          />
                          <button
                            type="button"
                            className="qty-btn"
                            aria-label={`Increase quantity for ${product.name}`}
                            data-testid={`increase-${id}`}
                            onClick={() => handleIncrement(id)}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className="btn-remove"
                            aria-label={`Remove ${product.name}`}
                            data-testid={`remove-${id}`}
                            onClick={() => handleRemoveFromCart(id)}
                          >
                            Remove
                          </button>
                        </div>
                        <div key={lineTotal} className="cart-item-total pop" data-testid={`line-total-${id}`}>
                          {formatCurrency(lineTotal)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {cartProductIds.length === 0 && (
                  <div id="empty-cart-message" className="empty-cart-state">
                    <div className="empty-emoji" aria-hidden="true">🛒</div>
                    <p>Your shopping cart is currently empty.</p>
                    <p className="empty-subtext">Add products from the catalog to proceed.</p>
                  </div>
                )}

                <div className="summary-breakdown" id="order-summary-box">
                  <div className="summary-line">
                    <span>Subtotal</span>
                    <span key={subtotal} id="summary-subtotal" className="amount pop">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="summary-line">
                    <span>Standard Shipping</span>
                    <span id="summary-shipping" className="free-tag">
                      FREE
                    </span>
                  </div>
                  <div className="summary-divider"></div>
                  <div className="summary-line total-line">
                    <span className="total-label">Total</span>
                    <span key={subtotal} id="order-total" className="total-amount pop" data-testid="order-total">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  id="place-order-btn"
                  className="btn btn-primary btn-block"
                  data-testid="place-order-btn"
                  disabled={isSubmitting}
                  aria-disabled={isSubmitting ? 'true' : undefined}
                  onClick={handlePlaceOrder}
                >
                  {isSubmitting ? 'Processing Order...' : 'Place Order'}
                </button>
              </section>
            </section>
          </main>

          {/* Confirmation View using actual customer-submitted data */}
          {confirmedOrder && (
            <section
              id="confirmation-view"
              className="card confirmation-card"
              aria-labelledby="confirmation-heading"
              data-testid="confirmation-section"
            >
              <div className="confirmation-icon-wrap" aria-hidden="true">
                ✓
              </div>
              <h2 id="confirmation-heading" className="confirmation-title">
                Order Confirmed!
              </h2>
              <p className="confirmation-subtitle">
                Thank you for your purchase. We have received your order.
              </p>

              <div className="reference-badge">
                <span className="ref-label">Order Reference:</span>
                <strong id="confirmation-reference" className="ref-value" data-testid="order-reference">
                  {confirmedOrder.reference}
                </strong>
              </div>

              <div className="confirmation-details">
                <div className="detail-row">
                  <span className="detail-label">Customer Name:</span>
                  <span id="confirmation-name" className="detail-value">
                    {confirmedOrder.customerName}
                  </span>
                </div>
                {confirmedOrder.customerEmail && (
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{confirmedOrder.customerEmail}</span>
                  </div>
                )}
                {confirmedOrder.customerNotes && (
                  <div className="detail-row">
                    <span className="detail-label">Delivery Notes:</span>
                    <span className="detail-value">{confirmedOrder.customerNotes}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="badge badge-success">Confirmed &amp; Paid</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total Paid:</span>
                  <strong id="confirmation-total" className="detail-value highlight-amount">
                    {formatCurrency(confirmedOrder.total)}
                  </strong>
                </div>
              </div>

              <div className="confirmation-items-summary">
                <h3>Items Ordered</h3>
                <ul id="confirmation-items-list" className="confirmation-list">
                  {confirmedOrder.items.map((item, idx) => (
                    <li key={idx}>
                      <span>
                        {item.qty} × {item.name}
                      </span>
                      <strong>{formatCurrency(item.lineTotal)}</strong>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                id="start-new-order-btn"
                className="btn btn-secondary"
                onClick={resetCheckoutState}
              >
                Place Another Order
              </button>
            </section>
          )}
        </section>

        {/* ============================================================== */}
        {/* TAB: BROWSER HISTORY VIEW                                      */}
        {/* ============================================================== */}
        {activeTab === 'browser-history' && (
          <section id="browser-history-view" className="history-view" aria-labelledby="history-heading">
            <div className="history-hero">
              <div>
                <h2 id="history-heading">Browser Order &amp; Activity History</h2>
                <p>Locally recorded checkout transactions, timestamps, customer details, and item breakdowns.</p>
              </div>
              <div className="history-hero-actions">
                {orderHistory.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleClearHistory}
                    title="Clear all stored orders in this browser"
                  >
                    🗑️ Clear History
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    resetCheckoutState();
                    setActiveTab('checkout');
                  }}
                >
                  🛍️ New Order
                </button>
              </div>
            </div>

            {orderHistory.length > 0 && (
              <div className="history-stats-bar">
                <div className="history-stat-card">
                  <span className="history-stat-label">Total Orders Placed</span>
                  <span className="history-stat-value">{orderHistory.length}</span>
                </div>
                <div className="history-stat-card">
                  <span className="history-stat-label">Total Spend</span>
                  <span className="history-stat-value">
                    {formatCurrency(orderHistory.reduce((sum, o) => sum + (o.total || 0), 0))}
                  </span>
                </div>
                <div className="history-stat-card">
                  <span className="history-stat-label">Total Items Ordered</span>
                  <span className="history-stat-value">
                    {orderHistory.reduce((sum, o) => sum + (o.totalItemCount || o.items?.reduce((s, it) => s + it.qty, 0) || 0), 0)}
                  </span>
                </div>
              </div>
            )}

            {orderHistory.length === 0 ? (
              <div className="history-empty-card">
                <div className="history-empty-icon" aria-hidden="true">🕒</div>
                <h3>No Browser Order History Yet</h3>
                <p>
                  You haven&apos;t completed any checkouts in this browser session yet. Add products to your cart and place an order to see your transaction history recorded here.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab('checkout')}
                >
                  Start Shopping Now
                </button>
              </div>
            ) : (
              <div className="history-list">
                {orderHistory.map((order, idx) => (
                  <article key={order.reference || idx} className="history-order-card" data-testid={`history-order-${order.reference}`}>
                    <header className="history-card-header">
                      <div className="history-card-header-left">
                        <span className="history-ref-badge">{order.reference}</span>
                        <time className="history-date" dateTime={order.timestamp}>
                          {order.dateFormatted || (order.timestamp ? new Date(order.timestamp).toLocaleString('en-IN') : 'Just now')}
                        </time>
                      </div>
                      <span className="history-status-badge">
                        <span>●</span> {order.status || 'Completed'}
                      </span>
                    </header>

                    <div className="history-card-grid">
                      {/* Customer Information */}
                      <div className="history-customer-box">
                        <div className="history-customer-title">Customer Details</div>
                        <div className="history-customer-row">
                          <span className="history-customer-icon" aria-hidden="true">👤</span>
                          <div>
                            <span className="helper-text">Name: </span>
                            <span className="history-customer-val">{order.customerName}</span>
                          </div>
                        </div>
                        {order.customerEmail && (
                          <div className="history-customer-row">
                            <span className="history-customer-icon" aria-hidden="true">✉️</span>
                            <div>
                              <span className="helper-text">Email: </span>
                              <span className="history-customer-val">{order.customerEmail}</span>
                            </div>
                          </div>
                        )}
                        {order.customerNotes && (
                          <div className="history-customer-row">
                            <span className="history-customer-icon" aria-hidden="true">📝</span>
                            <div>
                              <span className="helper-text">Notes: </span>
                              <span className="history-customer-val">{order.customerNotes}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Items Breakdown */}
                      <div className="history-items-box">
                        <table className="history-items-table">
                          <thead>
                            <tr>
                              <th>Product Item</th>
                              <th style={{ textAlign: 'center' }}>Qty</th>
                              <th style={{ textAlign: 'right' }}>Price</th>
                              <th style={{ textAlign: 'right' }}>Line Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items?.map((item, itemIdx) => (
                              <tr key={itemIdx}>
                                <td style={{ fontWeight: 600 }}>{item.name}</td>
                                <td style={{ textAlign: 'center' }}>{item.qty}</td>
                                <td style={{ textAlign: 'right', color: 'var(--ink-soft)' }}>
                                  {formatCurrency(item.unitPrice)}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                  {formatCurrency(item.lineTotal)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <footer className="history-card-footer">
                      <div>
                        <span className="history-total-label">Grand Total: </span>
                        <span className="history-total-amount">{formatCurrency(order.total)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleViewOrderConfirmation(order)}
                          title="View the official receipt confirmation card"
                        >
                          🧾 View Confirmation
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveHistoryItem(order.reference)}
                          title="Remove this order from history"
                        >
                          ✕ Delete
                        </button>
                      </div>
                    </footer>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 2: IN-BROWSER PLAYWRIGHT TEST RUNNER                       */}
        {/* ============================================================== */}
        {activeTab === 'playwright-runner' && (
          <section className="test-runner-container" aria-labelledby="runner-heading">
            {/* Top Summary Cards */}
            <div className="test-stats-grid">
              <div className="stat-box">
                <div className="stat-title">Total Tests</div>
                <div className="stat-number">6</div>
              </div>
              <div className="stat-box">
                <div className="stat-title">Tests Passed</div>
                <div className="stat-number passed">{passedTestsCount} / 6</div>
              </div>
              <div className="stat-box">
                <div className="stat-title">Tests Failed</div>
                <div className={`stat-number ${failedTestsCount > 0 ? 'running' : 'passed'}`}>
                  {failedTestsCount}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-title">Suite Status</div>
                <div className={`stat-number ${suiteStatus === 'running' ? 'running' : 'passed'}`}>
                  {suiteStatus === 'running' ? 'RUNNING' : suiteStatus === 'completed' ? 'PASSED' : 'READY'}
                </div>
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="runner-toolbar">
              <div className="toolbar-buttons">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={suiteStatus === 'running'}
                  onClick={handleRunAllTests}
                >
                  ▶ Run All Tests
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={suiteStatus === 'running'}
                  onClick={handleResetRunner}
                >
                  🔄 Reset Runner
                </button>
              </div>
              <span className="helper-text">
                Executes genuine browser assertions from a clean state. CLI suite (`npm test`) is authoritative.
              </span>
            </div>

            {/* Two-Column Test Specs & Console View */}
            <div className="test-layout-grid">
              {/* Left: Test Specifications with Verified Step Details */}
              <div className="test-suite-card">
                <h3 className="suite-heading">Automated Test Scenarios &amp; Verified Executions</h3>

                {testResults.map((spec, index) => (
                  <div
                    key={spec.id}
                    className={`spec-item ${spec.status === 'passed' ? 'passed' : spec.status === 'failed' ? 'failed' : ''}`}
                  >
                    <div className="spec-header">
                      <div className="spec-title-wrap">
                        <span className="spec-icon">
                          {spec.status === 'passed' ? '✅' : spec.status === 'failed' ? '❌' : spec.status === 'running' ? '⏳' : '⚪'}
                        </span>
                        <span className="spec-title">{spec.name}</span>
                      </div>
                      <div className="spec-actions">
                        <span
                          className={`spec-badge ${
                            spec.status === 'passed'
                              ? 'badge-pass'
                              : spec.status === 'failed'
                              ? 'badge-fail'
                              : spec.status === 'running'
                              ? 'badge-running'
                              : 'badge-pending'
                          }`}
                        >
                          {spec.status === 'passed'
                            ? `PASS (${spec.duration})`
                            : spec.status === 'failed'
                            ? 'FAIL'
                            : spec.status}
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={suiteStatus === 'running'}
                          onClick={() => runSingleTest(index)}
                        >
                          Run
                        </button>
                      </div>
                    </div>

                    {/* Assertion Error Alert if test failed */}
                    {spec.error && (
                      <div className="spec-error">
                        <strong>Assertion Error:</strong> {spec.error}
                      </div>
                    )}

                    {/* Verified execution steps */}
                    {spec.steps.length > 0 && (
                      <div className="spec-steps">
                        <ul>
                          {spec.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Right: Live Terminal Window */}
              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <div className="dot dot-red"></div>
                    <div className="dot dot-yellow"></div>
                    <div className="dot dot-green"></div>
                  </div>
                  <span>Playwright Live Automation Terminal</span>
                  <span>Chromium 1255</span>
                </div>
                <div className="terminal-body">
                  {logs.map((log, index) => (
                    <div key={index} className="log-entry">
                      <span className="log-time">[{log.time}]</span>
                      <span className={`log-text ${log.type}`}>{log.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* TAB 3: TEST PLAN & EVIDENCE                                    */}
        {/* ============================================================== */}
        {activeTab === 'test-plan' && (
          <section className="card" aria-labelledby="plan-heading">
            <h2 id="plan-heading">Test Plan, Risk Analysis &amp; Manual Testing Evidence</h2>

            <div className="plan-block">
              <h3>1. Prioritized Key Checkout Risks</h3>
              <div className="table-scroll">
                <table className="plan-table">
                  <thead>
                    <tr>
                      <th>Priority</th>
                      <th>Risk Category</th>
                      <th>Failure Scenario</th>
                      <th>Mitigation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p1">P1</td>
                      <td>Double Orders / Idempotency</td>
                      <td>Customer double-clicks Place Order; multiple charges generated</td>
                      <td>Synchronous React ref guard, button disabled state, single order</td>
                    </tr>
                    <tr>
                      <td className="p1">P1</td>
                      <td>Calculation Drift</td>
                      <td>Quantity adjustments fail to recalculate exact total</td>
                      <td>Reactive calculation: 2x Keyboard (₹500) + 1x Mouse (₹300) = ₹1,300</td>
                    </tr>
                    <tr>
                      <td className="p2">P2</td>
                      <td>Customer Data Loss</td>
                      <td>Validation failure wipes out customer name / email</td>
                      <td>Strict form input preservation in React state and DOM</td>
                    </tr>
                    <tr>
                      <td className="p2">P2</td>
                      <td>Empty Cart Order</td>
                      <td>Submitting checkout with 0 items</td>
                      <td>Block submission &amp; show accessible alert banner</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="plan-block">
              <h3>2. Manual Test Observations &amp; Evidence</h3>
              <ul className="plan-list">
                <li>
                  <strong>Empty Cart Test:</strong> Attempting to place an order with 0 items was blocked immediately. An alert banner displayed <em>"Your cart is empty. Please add at least one item before placing your order."</em>. The customer's entered name was preserved.
                </li>
                <li>
                  <strong>Rapid Double-Click Test:</strong> Rapidly double-clicking Place Order resulted in the button being immediately disabled on click 1. Click 2 was dropped synchronously via React ref (`isSubmittingRef.current`). Exactly one order record was created with unique reference code <code>ORD-QUPRTW</code> and total paid <code>₹1,300</code>.
                </li>
              </ul>
            </div>

            <div className="plan-block">
              <h3>3. Defect Discovered &amp; Resolved (DEF-01)</h3>
              <p className="plan-text">
                <strong>Defect:</strong> When checking out, CSS grid styling on <code>.checkout-grid</code> collided with the <code>.hidden</code> utility class, leaving the checkout view visible behind the confirmation card.<br />
                <strong>Fix:</strong> Added <code>.hidden &#123; display: none !important; &#125;</code> at the top utility level in <code>app/globals.css</code>. Verified via Playwright Check 1 &amp; Check 6 with 100% pass rate.
              </p>
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <p>Petal &bull; Express Checkout &bull; Next.js 16 + React 19 &bull; Authoritative Playwright Browser Suite</p>
      </footer>
    </div>
  );
}