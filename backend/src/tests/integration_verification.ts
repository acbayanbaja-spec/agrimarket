/**
 * AgriMarket Automated Comprehensive Security, RBAC & Persistence Verification Suite
 * Verifies Phase 1-5 requirements: Cryptographic JWT, Server-Side Pricing, RBAC,
 * Order Lifecycle Transitions, Stock Restoration, Payment Escrow, and Verified Reviews.
 */

const BASE_URL = 'http://localhost:5000';

async function request(path: string, options: any = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(url, {
    ...options,
    headers,
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`, details ? details : '');
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING AGRIMARKET FULL-SYSTEM SECURITY & RBAC AUDIT');
  console.log('======================================================\n');

  // TEST SUITE 1: AUTHENTICATION & TOKEN INTEGRITY
  console.log('--- SUITE 1: Authentication & Token Cryptographic Integrity ---');

  // 1.1 Unauthenticated access to protected order endpoint
  const unauthOrders = await request('/api/orders');
  assert(unauthOrders.status === 401, 'Unauthenticated GET /api/orders returns 401 Unauthorized', unauthOrders);

  // 1.2 Forged demo token rejection
  const forgedDemo = await request('/api/orders', {
    headers: { Authorization: 'Bearer demo-1' },
  });
  assert(forgedDemo.status === 401, 'Forged "demo-1" token is rejected with 401 Unauthorized', forgedDemo);

  // 1.3 Forged local token rejection
  const forgedLocal = await request('/api/orders', {
    headers: { Authorization: 'Bearer local-2' },
  });
  assert(forgedLocal.status === 401, 'Forged "local-2" token is rejected with 401 Unauthorized', forgedLocal);

  // 1.4 Valid Login: Admin
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@agrimarket.com', password: 'admin123' }),
  });
  assert(adminLogin.status === 200 && adminLogin.body.data?.token, 'Admin login issues valid cryptographic JWT', adminLogin.body);
  const adminToken = adminLogin.body.data?.token;

  // 1.5 Valid Login: Buyer
  const buyerLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'buyer@agrimarket.com', password: 'buyer123' }),
  });
  assert(buyerLogin.status === 200 && buyerLogin.body.data?.token, 'Buyer login issues valid cryptographic JWT', buyerLogin.body);
  const buyerToken = buyerLogin.body.data?.token;

  // 1.6 Valid Login: Seller
  const sellerLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'seller@agrimarket.com', password: 'seller123' }),
  });
  assert(sellerLogin.status === 200 && sellerLogin.body.data?.token, 'Seller login issues valid cryptographic JWT', sellerLogin.body);
  const sellerToken = sellerLogin.body.data?.token;

  // 1.7 Valid Login: Driver
  const driverLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'driver@agrimarket.com', password: 'driver123' }),
  });
  assert(driverLogin.status === 200 && driverLogin.body.data?.token, 'Driver login issues valid cryptographic JWT', driverLogin.body);
  const driverToken = driverLogin.body.data?.token;


  // TEST SUITE 2: RBAC ENFORCEMENT & RESTRICTED ACCESS
  console.log('\n--- SUITE 2: Role-Based Access Control (RBAC) ---');

  // 2.1 Admin cannot place an order
  const adminOrder = await request('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ items: [{ productId: 'p-tomato', quantity: 1 }] }),
  });
  assert(adminOrder.status === 403, 'Platform administrator cannot place orders (403 Forbidden)', adminOrder.body);

  // 2.2 Buyer cannot view seller applications
  const buyerApps = await request('/api/sellers/applications', {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  assert(buyerApps.status === 403, 'Buyer cannot view seller applications (403 Forbidden)', buyerApps);

  // 2.3 Buyer cannot review seller applications
  const buyerReviewApp = await request('/api/sellers/application/app-test/review', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({ status: 'approved' }),
  });
  assert(buyerReviewApp.status === 403, 'Buyer cannot approve seller applications (403 Forbidden)', buyerReviewApp.body);

  // 2.4 Admin can view seller applications
  const adminApps = await request('/api/sellers/applications', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminApps.status === 200, 'Admin can view seller applications (200 OK)', adminApps.body);


  // TEST SUITE 3: SERVER-SIDE PRICING & STOCK DEDUCTION
  console.log('\n--- SUITE 3: Server-Side Pricing Integrity & Stock Deduction ---');

  // Fetch product p-tomato canonical price
  const prodRes = await request('/api/products/p-tomato');
  const canonicalProduct = prodRes.body.data?.product || prodRes.body.data;
  assert(canonicalProduct && canonicalProduct.price > 0, `Product p-tomato fetched: ₱${canonicalProduct.price}/kg, stock: ${canonicalProduct.stock}`);
  const initialStock = canonicalProduct.stock;

  // 3.1 Place order with client price tampering attempt (passing price: 1.00 instead of canonical price)
  const orderPlacement = await request('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      items: [
        {
          productId: 'p-tomato',
          quantity: 2,
          price: 1.00, // Malicious client override attempt
        },
      ],
      shippingFee: 0, // Client attempting free shipping without coupon
      couponCode: 'FREESHIP',
    }),
  });

  assert(orderPlacement.status === 201, 'Order created successfully', orderPlacement.body);
  const createdOrder = orderPlacement.body.data;

  // Verify server enforced canonical price
  const expectedSubtotal = canonicalProduct.price * 2;
  assert(
    createdOrder.items[0].price === canonicalProduct.price,
    `Server enforced authoritative price: ₱${createdOrder.items[0].price} (client attempted ₱1.00)`
  );
  assert(
    createdOrder.subtotal === expectedSubtotal,
    `Server calculated correct subtotal: ₱${createdOrder.subtotal}`
  );
  assert(
    createdOrder.total === expectedSubtotal,
    `Server applied FREESHIP coupon correctly: total = ₱${createdOrder.total}`
  );

  // 3.2 Verify stock deduction
  const prodAfterRes = await request('/api/products/p-tomato');
  const prodAfter = prodAfterRes.body.data?.product || prodAfterRes.body.data;
  assert(
    prodAfter.stock === initialStock - 2,
    `Stock atomically deducted from ${initialStock} to ${prodAfter.stock}`
  );


  // TEST SUITE 4: ORDER LIFECYCLE TRANSITION MATRIX
  console.log('\n--- SUITE 4: Lifecycle State Transition Matrix ---');

  // 4.1 Buyer cannot mark order 'Delivered' directly
  const illegalTransition = await request(`/api/orders/${createdOrder.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({ status: 'Delivered' }),
  });
  assert(illegalTransition.status === 400 || illegalTransition.status === 403, 'Buyer cannot mark order Delivered directly', illegalTransition.body);

  // 4.2 Seller confirms order
  const sellerConfirm = await request(`/api/orders/${createdOrder.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({ status: 'Confirmed' }),
  });
  assert(sellerConfirm.status === 200 && sellerConfirm.body.data.status === 'Confirmed', 'Seller confirms order', sellerConfirm.body);

  // 4.3 Buyer cannot cancel once Confirmed
  const buyerCancelConfirmed = await request(`/api/orders/${createdOrder.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({ status: 'Cancelled' }),
  });
  assert(buyerCancelConfirmed.status === 403, 'Buyer cannot cancel confirmed order', buyerCancelConfirmed.body);

  // 4.4 Driver / Seller marks Shipped
  const markShipped = await request(`/api/orders/${createdOrder.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({ status: 'Shipped' }),
  });
  assert(markShipped.status === 200 && markShipped.body.data.status === 'Shipped', 'Order marked Shipped', markShipped.body);

  // 4.5 Assign driver & mark Out for delivery
  const assignDriver = await request(`/api/orders/${createdOrder.id}/assign-rider`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({ driverId: 4 }),
  });
  assert(assignDriver.status === 200, 'Rider assigned to order', assignDriver.body);

  const outForDelivery = await request(`/api/orders/${createdOrder.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${driverToken}` },
    body: JSON.stringify({ status: 'Out for delivery' }),
  });
  assert(outForDelivery.status === 200 && outForDelivery.body.data.status === 'Out for delivery', 'Driver marks Out for delivery', outForDelivery.body);

  // 4.6 Driver marks Delivered
  const markDelivered = await request(`/api/orders/${createdOrder.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${driverToken}` },
    body: JSON.stringify({ status: 'Delivered' }),
  });
  assert(markDelivered.status === 200 && markDelivered.body.data.status === 'Delivered', 'Driver marks Delivered', markDelivered.body);

  // 4.7 Terminal State Protection: Delivered order cannot be altered to Cancelled
  const changeAfterDelivered = await request(`/api/orders/${createdOrder.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'Cancelled' }),
  });
  assert(changeAfterDelivered.status === 400, 'Delivered order cannot be changed (Terminal state enforced)', changeAfterDelivered.body);


  // TEST SUITE 5: PAYMENT ESCROW INTEGRITY
  console.log('\n--- SUITE 5: Payment Escrow Lifecycle ---');

  // 5.1 Place fresh pending order
  const freshOrderRes = await request('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      items: [{ productId: 'p-tomato', quantity: 1 }],
      payment: 'GCash',
    }),
  });
  const freshOrder = freshOrderRes.body.data;

  // 5.2 Escrow release fails if order is NOT delivered
  const prematureEscrow = await request('/api/payments/escrow/release', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({ orderId: freshOrder.id }),
  });
  assert(prematureEscrow.status === 400, 'Premature escrow release blocked on undelivered order', prematureEscrow.body);

  // 5.3 Lock funds in escrow via payment gateway verification
  const verifyRes = await request('/api/payments/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({ orderId: freshOrder.id, transactionRef: 'TXN-GCASH-123456' }),
  });
  assert(verifyRes.status === 200 && verifyRes.body.data.status === 'escrow_held', 'Payment verified and held in escrow', verifyRes.body);

  // Transition freshOrder to Delivered
  await request(`/api/orders/${freshOrder.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({ status: 'Confirmed' }),
  });
  await request(`/api/orders/${freshOrder.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({ status: 'Shipped' }),
  });
  await request(`/api/orders/${freshOrder.id}/assign-rider`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({ driverId: 4 }),
  });
  await request(`/api/orders/${freshOrder.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${driverToken}` },
    body: JSON.stringify({ status: 'Out for delivery' }),
  });
  await request(`/api/orders/${freshOrder.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${driverToken}` },
    body: JSON.stringify({ status: 'Delivered' }),
  });

  // 5.4 Unauthorized user cannot release escrow on another buyer\'s delivered order
  const unauthorizedEscrow = await request('/api/payments/escrow/release', {
    method: 'POST',
    headers: { Authorization: `Bearer ${driverToken}` },
    body: JSON.stringify({ orderId: freshOrder.id }),
  });
  assert(unauthorizedEscrow.status === 403, 'Unauthorized user (driver) blocked from releasing escrow', unauthorizedEscrow.body);

  // 5.5 Legitimate Buyer releases escrow on their delivered order
  const legitimateEscrow = await request('/api/payments/escrow/release', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({ orderId: freshOrder.id }),
  });
  assert(legitimateEscrow.status === 200, 'Legitimate buyer successfully releases escrow after delivery', legitimateEscrow.body);


  // TEST SUITE 6: VERIFIED REVIEWS ENFORCEMENT
  console.log('\n--- SUITE 6: Verified Review Protection ---');

  // 6.1 Reviewing a product the buyer never bought
  const fakeReview = await request('/api/reviews', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      productId: 'PROD-999-UNBOUGHT',
      rating: 5,
      comment: 'Fake review on unpurchased product',
    }),
  });
  assert(fakeReview.status === 404 || fakeReview.status === 403, 'Unverified review on unpurchased product blocked', fakeReview.body);

  // 6.2 Reviewing product p-tomato which buyer legitimately purchased and received
  const legitimateReview = await request('/api/reviews', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      productId: 'p-tomato',
      rating: 5,
      comment: 'Fresh, authentic SOCCSKSARGEN produce delivered safely!',
    }),
  });
  assert(legitimateReview.status === 201 && legitimateReview.body.data.isVerifiedPurchase === true, 'Legitimate purchase verified and review published', legitimateReview.body);


  // TEST SUITE 7: STOCK RESTORATION ON CANCELLATION
  console.log('\n--- SUITE 7: Stock Restoration on Cancellation ---');

  const getStock = async () => {
    const res = await request('/api/products/p-tomato');
    return res.body.data?.product?.stock ?? res.body.data?.stock;
  };

  const stockBeforeCancelOrder = await getStock();
  const cancelTestOrder = await request('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      items: [{ productId: 'p-tomato', quantity: 3 }],
    }),
  });
  const cancelOrderData = cancelTestOrder.body.data;
  const stockAfterCancelOrder = await getStock();
  assert(stockAfterCancelOrder === stockBeforeCancelOrder - 3, `Stock deducted for cancel test order: ${stockBeforeCancelOrder} -> ${stockAfterCancelOrder}`);

  // Cancel order while still pending
  const cancelResult = await request(`/api/orders/${cancelOrderData.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({ status: 'Cancelled', cancellationReason: 'Buyer changed mind' }),
  });
  assert(cancelResult.status === 200, 'Pending order cancelled by buyer');

  // Verify stock was restored
  const stockRestored = await getStock();
  assert(stockRestored === stockBeforeCancelOrder, `Stock restored back to ${stockRestored}`);

  console.log('\n======================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
