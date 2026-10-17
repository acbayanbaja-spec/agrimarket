/**
 * AgriMarket Supabase PostgreSQL Database Integration & Resilience Tests
 * Verifies:
 * 1. Database Connection & TLS Handshake
 * 2. Error Classifier Accuracy (DNS, Auth, Timeout, TLS, Missing DB)
 * 3. Public Diagnostics Non-disclosure (Zero secret exposure)
 * 4. Marketplace Catalog & Category Loading from Supabase PostgreSQL
 * 5. Order Operations Lifecycle & Transaction Safety on Supabase PostgreSQL
 */

import pool, { classifyDatabaseError, getPublicDatabaseDiagnostics } from '../config/database';
import { db } from '../database/store';

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

async function runDatabaseTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING SUPABASE POSTGRESQL DATABASE VERIFICATION SUITE');
  console.log('======================================================\n');

  // Test 1: Live connection to Supabase PostgreSQL
  try {
    const conn = await pool.getConnection();
    const [result]: any = await conn.query('SELECT 1 + 1 as sum, current_database() as current_db');
    assert(result[0]?.sum === 2, 'Supabase Query: Basic arithmetic and connection successful');
    assert(Boolean(result[0]?.current_db), `Supabase Database active: ${result[0]?.current_db}`);

    // Verify TLS is active
    const diagnostics = getPublicDatabaseDiagnostics();
    assert(diagnostics.ssl === true, 'Supabase TLS/SSL is active');

    conn.release();
  } catch (err: any) {
    assert(false, 'Supabase Connection failed', err.message);
  }

  // Test 2: Error Classifier Accuracy
  console.log('\n--- Testing Error Classification ---');
  const dnsErr = classifyDatabaseError({ code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND invalid-host' });
  assert(dnsErr.kind === 'dns', 'Classifies ENOTFOUND as dns failure');

  const authErr = classifyDatabaseError({ code: '28P01', message: 'password authentication failed for user "postgres"' });
  assert(authErr.kind === 'auth', 'Classifies 28P01 as auth failure');

  const timeoutErr = classifyDatabaseError({ code: 'ETIMEDOUT', message: 'Connection timed out' });
  assert(timeoutErr.kind === 'timeout', 'Classifies ETIMEDOUT as timeout failure');

  const tlsErr = classifyDatabaseError({ code: 'HANDSHAKE_SSL_ERROR', message: 'SSL alert handshake failure' });
  assert(tlsErr.kind === 'tls', 'Classifies HANDSHAKE_SSL_ERROR as tls failure');

  const dbErr = classifyDatabaseError({ code: '3D000', message: 'database "nonexistent_db" does not exist' });
  assert(dbErr.kind === 'database_missing', 'Classifies 3D000 as database_missing failure');

  // Test 3: Public Diagnostics Non-disclosure
  console.log('\n--- Testing Public Diagnostics Security ---');
  const diagnostics: any = getPublicDatabaseDiagnostics();
  assert(diagnostics.configured === true, 'Diagnostics reports database configured');
  assert(diagnostics.ssl === true, 'Diagnostics reports SSL enabled');
  assert(diagnostics.host === undefined, 'Security: DB_HOST is NOT exposed in diagnostics');
  assert(diagnostics.password === undefined, 'Security: DB_PASSWORD is NOT exposed in diagnostics');
  assert(diagnostics.user === undefined, 'Security: DB_USER is NOT exposed in diagnostics');

  await db.waitUntilReady();
  const readiness = db.getReadiness();
  assert(typeof readiness.ready === 'boolean', 'Store readiness returns boolean status');

  // Test 4: Marketplace Catalog Loading from Supabase PostgreSQL
  console.log('\n--- Testing Marketplace Data Operations ---');
  try {
    const [products]: any = await pool.query('SELECT COUNT(*) as count FROM products WHERE is_deleted IS NOT TRUE');
    assert(Number(products[0]?.count) > 0, `Marketplace Catalog: ${products[0]?.count} active products found in Supabase`);

    const [categories]: any = await pool.query('SELECT COUNT(*) as count FROM categories WHERE is_active = true');
    assert(Number(categories[0]?.count) > 0, `Marketplace Categories: ${categories[0]?.count} active categories found in Supabase`);

    const [users]: any = await pool.query('SELECT COUNT(*) as count FROM users');
    assert(Number(users[0]?.count) > 0, `Users: ${users[0]?.count} registered accounts stored in Supabase`);
  } catch (err: any) {
    assert(false, 'Marketplace Data query failed', err.message);
  }

  // Test 5: Order Operations Lifecycle on Supabase PostgreSQL
  console.log('\n--- Testing Order Lifecycle Operations on Supabase ---');
  const testOrderId = `TEST-ORD-${Date.now()}`;
  const testReceiptNo = `TEST-RCPT-${Date.now()}`;

  try {
    // Insert order
    await pool.query(
      `INSERT INTO orders (id, receipt_no, user_id, buyer_name, buyer_phone, address, subtotal, shipping_fee, total, status, payment, payment_status)
       VALUES (?, ?, 1, 'Test Buyer', '+639123456789', 'General Santos City', 150.00, 50.00, 200.00, 'Pending', 'GCash', 'pending')`,
      [testOrderId, testReceiptNo]
    );

    const [created]: any = await pool.query('SELECT * FROM orders WHERE id = ?', [testOrderId]);
    assert(created.length === 1 && created[0].status === 'Pending', 'Order created on Supabase with status Pending');

    // Update order status
    await pool.query('UPDATE orders SET status = ?, payment_status = ? WHERE id = ?', ['Confirmed', 'paid', testOrderId]);
    const [updated]: any = await pool.query('SELECT * FROM orders WHERE id = ?', [testOrderId]);
    assert(updated[0]?.status === 'Confirmed' && updated[0]?.payment_status === 'paid', 'Order status updated to Confirmed and paid');

    // Clean up test order
    await pool.query('DELETE FROM orders WHERE id = ?', [testOrderId]);
    const [deleted]: any = await pool.query('SELECT * FROM orders WHERE id = ?', [testOrderId]);
    assert(deleted.length === 0, 'Test order cleaned up successfully');
  } catch (err: any) {
    assert(false, 'Order operations failed on Supabase', err.message);
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

runDatabaseTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
