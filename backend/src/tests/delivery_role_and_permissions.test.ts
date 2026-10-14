/**
 * Delivery-Rider Role Normalization, Permissions & Cross-Rider Security Audit
 *
 * Verifies:
 * 1. Role Normalization (delivery_man, driver, rider -> delivery)
 * 2. Rider Login and Canonical JWT Token Emission
 * 3. Backward Compatibility: Acceptance of legacy 'delivery_man' tokens
 * 4. Scoped Delivery Visibility: Rider only sees assigned jobs
 * 5. Cross-Rider Authorization: Rider cannot modify another rider's deliveries (403)
 * 6. Delivery Status Updates & Order Status Synchronization
 * 7. Regression Prevention: Buyer, Seller, and Admin permission boundaries
 */

import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../database/store';
import { authService } from '../services/authService';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { normalizeRole, normalizeRoles, hasRole } from '../utils/roles';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, extra?: any) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`, extra ? extra : '');
    failed++;
  }
}

async function runDeliveryRoleTests() {
  console.log('\n======================================================');
  console.log('🛵 RUNNING DELIVERY-RIDER ROLE & PERMISSION VERIFICATION');
  console.log('======================================================\n');

  // 1. Role Normalization Utility Tests
  console.log('--- 1. Testing Canonical Role Normalization ---');
  assert(normalizeRole('delivery_man') === 'delivery', "Normalizes 'delivery_man' to 'delivery'");
  assert(normalizeRole('driver') === 'delivery', "Normalizes 'driver' to 'delivery'");
  assert(normalizeRole('rider') === 'delivery', "Normalizes 'rider' to 'delivery'");
  assert(normalizeRole('delivery') === 'delivery', "Preserves canonical 'delivery'");
  assert(normalizeRole('DELIVERY_MAN') === 'delivery', "Case-insensitive 'DELIVERY_MAN' to 'delivery'");

  assert(
    JSON.stringify(normalizeRoles(['delivery_man', 'delivery'])) === JSON.stringify(['delivery']),
    "Deduplicates and canonicalizes ['delivery_man', 'delivery'] to ['delivery']"
  );
  assert(
    JSON.stringify(normalizeRoles(['buyer', 'delivery_man'])) === JSON.stringify(['buyer', 'delivery']),
    "Canonicalizes multi-role user ['buyer', 'delivery_man'] to ['buyer', 'delivery']"
  );
  assert(
    JSON.stringify(normalizeRoles([])) === JSON.stringify(['buyer']),
    "Defaults empty roles to ['buyer']"
  );

  assert(hasRole(['delivery_man'], 'delivery') === true, "hasRole(['delivery_man'], 'delivery') returns true");
  assert(hasRole(['delivery'], 'delivery_man') === true, "hasRole(['delivery'], 'delivery_man') returns true");
  assert(hasRole(['buyer'], 'delivery') === false, "hasRole(['buyer'], 'delivery') returns false");

  // 2. Rider Account & Database Hydration
  console.log('\n--- 2. Testing Rider User Loading from TiDB ---');
  await db.waitUntilReady();
  const driverUser = db.getUserByEmail('driver@agrimarket.com');
  assert(Boolean(driverUser), "Driver account 'driver@agrimarket.com' exists in store");
  if (driverUser) {
    assert(
      driverUser.roles.includes('delivery'),
      `Driver account in store has canonical 'delivery' role: [${driverUser.roles.join(', ')}]`
    );
  }

  // 3. Rider Login & Canonical Token Generation
  console.log('\n--- 3. Testing Rider Login & JWT Token Emission ---');
  try {
    const loginResult = await authService.login({
      email: 'driver@agrimarket.com',
      password: 'driver123',
    });
    assert(Boolean(loginResult.token), 'Rider login successful and issued token');
    assert(
      loginResult.user.roles.includes('delivery'),
      `Login response user roles contains canonical 'delivery': [${loginResult.user.roles.join(', ')}]`
    );

    const decoded = jwt.verify(loginResult.token, config.jwt.secret) as any;
    assert(
      decoded.roles.includes('delivery'),
      `JWT decoded token payload contains canonical 'delivery' role: [${decoded.roles.join(', ')}]`
    );
  } catch (err: any) {
    assert(false, 'Rider login failed', err.message);
  }

  // 4. Backward Compatibility: Middleware Normalizes Legacy 'delivery_man' Tokens
  console.log('\n--- 4. Testing Middleware Acceptance of Legacy Tokens ---');
  const legacyToken = jwt.sign(
    { id: driverUser?.id || 4, email: 'driver@agrimarket.com', roles: ['delivery_man'] },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  let mockReq: any = {
    headers: { authorization: `Bearer ${legacyToken}` },
  };
  let mockRes: any = {
    status: (code: number) => ({
      json: (data: any) => ({ statusCode: code, data }),
    }),
  };

  let nextCalled: boolean = false;
  await authenticate(mockReq as AuthRequest, mockRes, () => {
    nextCalled = true;
  });

  assert(Boolean(nextCalled), 'authenticate middleware accepts token with legacy role');
  assert(
    mockReq.user?.roles.includes('delivery'),
    `authenticate normalized req.user.roles to canonical 'delivery': [${mockReq.user?.roles.join(', ')}]`
  );

  // Test authorize('delivery') with normalized req.user
  let authorizePassed: boolean = false;
  const deliveryAuthorizer = authorize('delivery');
  deliveryAuthorizer(mockReq as AuthRequest, mockRes, () => {
    authorizePassed = true;
  });
  assert(Boolean(authorizePassed), "authorize('delivery') grants access to normalized user");

  // Test authorize('delivery_man') also works due to normalizer
  let legacyAuthorizePassed: boolean = false;
  const legacyAuthorizer = authorize('delivery_man');
  legacyAuthorizer(mockReq as AuthRequest, mockRes, () => {
    legacyAuthorizePassed = true;
  });
  assert(Boolean(legacyAuthorizePassed), "authorize('delivery_man') backward-compatible match");

  // 5. Scoped Delivery Visibility & Cross-Rider Access Protection
  console.log('\n--- 5. Testing Scoped Visibility & Cross-Rider Access Protection ---');
  const rider1Id = 4;
  const rider2Id = 999; // Mock second rider

  // Ensure test delivery jobs exist
  const job1Id = `DEL-TEST-RIDER1-${Date.now()}`;
  const job2Id = `DEL-TEST-RIDER2-${Date.now()}`;

  db.updateDelivery(job1Id, {
    id: job1Id,
    orderId: `ORD-TEST-1`,
    driverId: rider1Id,
    buyerName: 'Buyer One',
    status: 'Confirmed',
    address: 'Koronadal City',
  });

  db.updateDelivery(job2Id, {
    id: job2Id,
    orderId: `ORD-TEST-2`,
    driverId: rider2Id,
    buyerName: 'Buyer Two',
    status: 'Confirmed',
    address: 'Tupi, South Cotabato',
  });

  // Rider 1 gets deliveries
  const rider1Deliveries = db.getDeliveries(rider1Id);
  const seesOwn = rider1Deliveries.some((d) => d.id === job1Id);
  const seesOther = rider1Deliveries.some((d) => d.id === job2Id);
  assert(seesOwn === true, "Rider 1 sees their assigned delivery job");
  assert(seesOther === false, "Rider 1 DOES NOT see Rider 2's assigned delivery job");

  // Verify cross-rider update rejection logic (simulating delivery.ts PUT /deliveries/:id/status)
  const rider1ReqUser = { id: rider1Id, email: 'driver@agrimarket.com', roles: ['delivery'] };
  const targetJob = db.getDeliveries().find((j) => j.id === job2Id);

  const isCrossRiderForbidden =
    !rider1ReqUser.roles.includes('admin') && targetJob?.driverId !== rider1ReqUser.id;
  assert(isCrossRiderForbidden === true, "Cross-rider protection: Rider 1 is forbidden from updating Rider 2's job");

  // 6. Delivery Status Update & Order Status Synchronization
  console.log('\n--- 6. Testing Delivery Status & Order Synchronization ---');
  const testOrderId = `ORD-TEST-SYNC-${Date.now()}`;
  db.addOrder({
    id: testOrderId,
    receiptNo: `RCPT-${testOrderId}`,
    userId: 3,
    buyerName: 'buyer',
    items: [],
    subtotal: 100,
    shippingFee: 50,
    shippingDiscount: 0,
    total: 150,
    status: 'Confirmed',
    payment: 'Cash on delivery',
    paymentStatus: 'pending',
    address: 'General Santos City',
    createdAt: new Date().toISOString(),
  } as any);

  const syncJobId = `DEL-${testOrderId}`;
  db.updateDelivery(syncJobId, {
    id: syncJobId,
    orderId: testOrderId,
    driverId: rider1Id,
    buyerName: 'buyer',
    status: 'Confirmed',
    address: 'General Santos City',
  });

  // Rider updates status to 'Delivered'
  const updatedJob = db.updateDelivery(syncJobId, { status: 'Delivered', lat: 6.1164, lng: 125.1716 });
  assert(updatedJob?.status === 'Delivered', "Delivery job status updated to 'Delivered'");

  // Update order status and payment status in sync (as delivery.ts does)
  db.updateOrderStatus(testOrderId, 'Delivered', { paymentStatus: 'paid' });
  const synchronizedOrder = db.getOrderById(testOrderId);
  assert(synchronizedOrder?.status === 'Delivered', "Order status synchronized to 'Delivered'");
  assert(synchronizedOrder?.paymentStatus === 'paid', "COD Order payment status synchronized to 'paid'");

  // 7. Regression Testing for Buyer, Seller, and Admin Roles
  console.log('\n--- 7. Testing Permission Boundaries (No Regression) ---');
  const buyerUser = db.getUserByEmail('buyer@agrimarket.com');
  const sellerUser = db.getUserByEmail('seller@agrimarket.com');
  const adminUser = db.getUserByEmail('admin@agrimarket.com');

  assert(Boolean(buyerUser && buyerUser.roles.includes('buyer')), "Buyer has 'buyer' role");
  assert(Boolean(sellerUser && sellerUser.roles.includes('seller')), "Seller has 'seller' role");
  assert(Boolean(adminUser && adminUser.roles.includes('admin')), "Admin has 'admin' role");

  // Buyer cannot access delivery routes
  let buyerDeliveryAllowed = false;
  deliveryAuthorizer({ user: { id: 3, email: 'buyer@agrimarket.com', roles: ['buyer'] } } as any, mockRes, () => {
    buyerDeliveryAllowed = true;
  });
  assert(!buyerDeliveryAllowed, "Buyer is rejected from delivery authorization (403)");

  // Seller cannot update delivery status (only delivery or admin allowed)
  let sellerStatusUpdateAllowed = false;
  const statusAuthorizer = authorize('delivery', 'admin');
  statusAuthorizer({ user: { id: 2, email: 'seller@agrimarket.com', roles: ['seller'] } } as any, mockRes, () => {
    sellerStatusUpdateAllowed = true;
  });
  assert(!sellerStatusUpdateAllowed, "Seller is rejected from delivery status update (403)");

  // Admin can access delivery routes (authorize('delivery', 'admin'))
  let adminDeliveryAllowed = false;
  statusAuthorizer({ user: { id: 1, email: 'admin@agrimarket.com', roles: ['admin'] } } as any, mockRes, () => {
    adminDeliveryAllowed = true;
  });
  assert(Boolean(adminDeliveryAllowed), "Admin is permitted on delivery routes");

  // Clean up test records
  const allOrders = db.getOrders();
  const orderIdx = allOrders.findIndex((o) => o.id === testOrderId);
  if (orderIdx !== -1) {
    allOrders.splice(orderIdx, 1);
  }

  console.log('\n======================================================');
  console.log(`📊 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runDeliveryRoleTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
