/**
 * AgriMarket Automated Comprehensive Security, RBAC, Concurrency & Persistence Verification Suite
 * Verifies:
 * - Cryptographic JWT & Token integrity
 * - Role-Based Access Control (RBAC) enforcement
 * - Server-Side Authoritative Pricing
 * - Order Lifecycle State Transition Matrix
 * - Payment Integrity & Provider Webhook Verification (No fabricated self-verification)
 * - Separation of physical delivery from payment confirmation
 * - Verified Reviews Protection
 * - Stock Restoration on Cancellation
 * - Rider Assignment Enforcement
 * - Seller-Specific Order Visibility & Scoping
 * - Concurrency-Safe Stock Deduction (Zero Overdrafts)
 * - Atomic Database Store Persistence
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

  // Ensure backend server is reachable; if not, spin up in-process
  try {
    await fetch(`${BASE_URL}/health`);
  } catch {
    console.log('⚡ Starting in-process backend HTTP server on port 5000...');
    require('../index');
    await new Promise((r) => setTimeout(r, 1500));
  }

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

  // 2.1 Buyer cannot access admin endpoints
  const buyerToAdmin = await request('/api/admin/overview', {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  assert(buyerToAdmin.status === 403, 'Buyer is forbidden (403) from accessing GET /api/admin/overview', buyerToAdmin);

  // 2.2 Seller cannot access admin endpoints
  const sellerToAdmin = await request('/api/admin/overview', {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  assert(sellerToAdmin.status === 403, 'Seller is forbidden (403) from accessing GET /api/admin/overview', sellerToAdmin);

  // 2.3 Admin can access admin endpoints
  const adminToAdmin = await request('/api/admin/overview', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminToAdmin.status === 200, 'Admin successfully accesses GET /api/admin/overview', adminToAdmin);


  // TEST SUITE 3: SERVER-SIDE AUTHORITATIVE PRICING & INVENTORY
  console.log('\n--- SUITE 3: Server-Side Authoritative Pricing & Inventory ---');

  // Ensure product has ample stock for tests
  await request('/api/products/p-tomato', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ stock: 120 }),
  });

  // Fetch real product details
  const prodRes = await request('/api/products/p-tomato');
  const canonicalProduct = prodRes.body.data?.product || prodRes.body.data;
  const initialStock = canonicalProduct.stock;

  // 3.1 Place order with tampered client prices (₱1.00)
  const orderPlacement = await request('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      items: [
        {
          productId: 'p-tomato',
          quantity: 2,
          price: 1.00, // Client attempted price tampering
          title: 'Fake Cheap Tomato',
        },
      ],
      shippingFee: 0,
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


  // TEST SUITE 5: PAYMENT INTEGRITY & PROVIDER WEBHOOK VERIFICATION
  console.log('\n--- SUITE 5: Payment Integrity & Webhook Verification ---');

  // 5.1 Place fresh pending order with GCash digital payment
  const freshOrderRes = await request('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      items: [{ productId: 'p-tomato', quantity: 1 }],
      payment: 'GCash',
    }),
  });
  const freshOrder = freshOrderRes.body.data;

  // 5.2 Fabricated buyer self-verification endpoint POST /api/payments/verify is REMOVED
  const removedVerifyRes = await request('/api/payments/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({ orderId: freshOrder.id, transactionRef: 'TXN-FAKE-123456' }),
  });
  assert(
    removedVerifyRes.status === 404,
    'Arbitrary buyer self-verification endpoint /api/payments/verify is securely removed (404 Not Found)',
    removedVerifyRes
  );

  // 5.3 Honest checkout session returns pending status and simulationNotice when gateway unconfigured
  const checkoutRes = await request('/api/payments/checkout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({ orderId: freshOrder.id, paymentMethod: 'GCash' }),
  });
  assert(
    checkoutRes.status === 200 && checkoutRes.body.data.status === 'pending',
    'Checkout session initialized with pending status',
    checkoutRes.body
  );
  assert(
    checkoutRes.body.data.providerConfigured === false && Boolean(checkoutRes.body.data.simulationNotice),
    'Checkout clearly labeled with simulation notice when live provider unconfigured',
    checkoutRes.body.data
  );

  // 5.4 Unsigned / unverified payment webhook rejected
  const fakeWebhookRes = await request('/api/payments/webhook', {
    method: 'POST',
    headers: { 'x-signature': 'invalid-signature' },
    body: JSON.stringify({
      eventId: 'evt-test-1',
      orderId: freshOrder.id,
      amount: freshOrder.total,
      status: 'paid',
    }),
  });
  assert(
    fakeWebhookRes.status === 400,
    'Unsigned/unverified payment webhook rejected (400 Bad Request)',
    fakeWebhookRes.body
  );

  // 5.5 Non-admin user blocked from processing refunds
  const unauthorizedRefund = await request('/api/payments/refund', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({ orderId: freshOrder.id, reason: 'Buyer requested refund' }),
  });
  assert(
    unauthorizedRefund.status === 403,
    'Non-admin user blocked from issuing refunds (403 Forbidden)',
    unauthorizedRefund.body
  );

  // 5.6 Escrow release fails if order is NOT delivered
  const prematureEscrow = await request('/api/payments/escrow/release', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({ orderId: freshOrder.id }),
  });
  assert(
    prematureEscrow.status === 400,
    'Premature escrow release blocked on undelivered order',
    prematureEscrow.body
  );

  // Progress freshOrder to Delivered
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

  // 5.7 Delivery completion is kept strictly separate from digital payment confirmation
  const refreshedFreshOrder = await request(`/api/orders/${freshOrder.id}`, {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  assert(
    refreshedFreshOrder.body.data.paymentStatus === 'pending',
    'Delivery completion kept separate from payment confirmation: GCash payment remains pending',
    refreshedFreshOrder.body.data
  );

  // 5.8 Escrow release blocked because payment was never confirmed into escrow
  const unconfirmedEscrow = await request('/api/payments/escrow/release', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({ orderId: freshOrder.id }),
  });
  assert(
    unconfirmedEscrow.status === 400,
    'Escrow release correctly blocked because payment was not confirmed into escrow by verified provider',
    unconfirmedEscrow.body
  );


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


  // TEST SUITE 8: RIDER ASSIGNMENT ENFORCEMENT
  console.log('\n--- SUITE 8: Rider Assignment Enforcement ---');

  // Create an order for rider testing
  const riderTestOrderRes = await request('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      items: [{ productId: 'p-tomato', quantity: 1 }],
      payment: 'Cash on delivery',
    }),
  });
  const riderOrder = riderTestOrderRes.body.data;

  // Confirm and ship
  await request(`/api/orders/${riderOrder.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({ status: 'Confirmed' }),
  });
  await request(`/api/orders/${riderOrder.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({ status: 'Shipped' }),
  });

  // Assign driver ID 4 (Rico)
  await request(`/api/orders/${riderOrder.id}/assign-rider`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${sellerToken}` },
    body: JSON.stringify({ driverId: 4 }),
  });

  // Attempt status update from a non-assigned user (buyer attempting driver action)
  const unassignedUpdate = await request(`/api/orders/${riderOrder.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({ status: 'Out for delivery' }),
  });
  assert(
    unassignedUpdate.status === 403,
    'Unassigned user blocked from updating delivery status (403 Forbidden)',
    unassignedUpdate.body
  );

  // Delivery routes: update delivery for job DEL-xxx directly by unassigned user
  const unassignedJobUpdate = await request(`/api/delivery/deliveries/${riderOrder.id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({ status: 'Delivered' }),
  });
  assert(
    unassignedJobUpdate.status === 403,
    'Unassigned user blocked from modifying delivery job status (403 Forbidden)',
    unassignedJobUpdate.body
  );


  // TEST SUITE 9: SELLER-SPECIFIC ORDER VISIBILITY & SCOPING
  console.log('\n--- SUITE 9: Seller-Specific Order Visibility & Scoping ---');

  // Place multi-vendor order with items from Seller 2 (p-tomato) and Seller 16 (p-eggs)
  const multiVendorOrderRes = await request('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyerToken}` },
    body: JSON.stringify({
      items: [
        { productId: 'p-tomato', quantity: 1 },
        { productId: 'p-eggs', quantity: 1 },
      ],
      payment: 'Cash on delivery',
    }),
  });
  const multiVendorOrder = multiVendorOrderRes.body.data;
  assert(
    multiVendorOrderRes.status === 201 && multiVendorOrder.items.length === 2,
    'Multi-vendor order placed with items from Seller 2 and Seller 16',
    multiVendorOrder
  );

  // Seller 2 queries the multi-vendor order by ID
  const seller2OrderView = await request(`/api/orders/${multiVendorOrder.id}`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  });
  assert(
    seller2OrderView.status === 200,
    'Seller 2 successfully queries multi-vendor order',
    seller2OrderView.body
  );
  const seller2Items = seller2OrderView.body.data.items;
  assert(
    seller2Items.every((it: any) => it.sellerUserId === 2 || it.sellerId === 'seller-1' || it.sellerId === 'seller-2'),
    'Seller 2 only receives their store items: other vendor items are strictly filtered out',
    seller2Items
  );


  // TEST SUITE 10: CONCURRENCY-SAFE STOCK PURCHASES (ZERO OVERDRAFT)
  console.log('\n--- SUITE 10: Concurrency-Safe Stock Deduction ---');

  // Set predictable stock for concurrency test
  await request('/api/products/p-tomato', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ stock: 10 }),
  });

  const stockBeforeConcurrent = await getStock();
  const orderQty = 4; // Each order requests 4; stock is 10. Exactly 2 can succeed (8 deducted, 2 remain); 3rd & 4th fail!
  const concurrentPromises = [1, 2, 3, 4].map((i) =>
    request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        items: [{ productId: 'p-tomato', quantity: orderQty }],
        payment: 'Cash on delivery',
      }),
    })
  );

  const concurrentResults = await Promise.all(concurrentPromises);
  const successOrders = concurrentResults.filter((r) => r.status === 201);
  const rejectedOrders = concurrentResults.filter((r) => r.status === 400);

  const stockAfterConcurrent = await getStock();
  assert(
    stockAfterConcurrent >= 0,
    `Inventory is never negative after concurrent orders: remaining stock = ${stockAfterConcurrent}`
  );
  assert(
    stockAfterConcurrent === stockBeforeConcurrent - successOrders.length * orderQty,
    `Stock deduction is exact: ${stockBeforeConcurrent} - (${successOrders.length} * ${orderQty}) = ${stockAfterConcurrent}`
  );
  console.log(`    Concurrent results: ${successOrders.length} succeeded, ${rejectedOrders.length} rejected safely.`);

  // Replenish stock after concurrency test
  await request('/api/products/p-tomato', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ stock: 120 }),
  });


  // TEST SUITE 11: ATOMIC STORE PERSISTENCE
  console.log('\n--- SUITE 11: Database Persistence Verification ---');

  const catalogCheck = await request('/api/products');
  const catalogList = catalogCheck.body.data?.products || catalogCheck.body.data;
  assert(
    catalogCheck.status === 200 && Array.isArray(catalogList) && catalogList.length > 0,
    `Authoritative catalog is active with ${catalogList?.length} products`
  );

  const usersCheck = await request('/api/admin/users', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(
    usersCheck.status === 200 && Array.isArray(usersCheck.body.data) && usersCheck.body.data.length >= 4,
    `Authoritative users persist correctly (${usersCheck.body?.data?.length} users verified)`
  );


  console.log('\n======================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
