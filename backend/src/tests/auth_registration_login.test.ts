import { authService } from '../services/authService';
import { db } from '../database/store';
import pool from '../config/database';

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runAuthTests() {
  console.log('🚀 Running Auth Registration & Login tests...');
  await db.waitUntilReady();

  const testEmail = `test.buyer.${Date.now()}@agrimarket.com`;
  const testPassword = 'SecurePassword123!';

  // 1. Register a new buyer account
  console.log('Test 1: Registering new buyer account...');
  const regResult = await authService.register({
    email: testEmail,
    password: testPassword,
    firstName: 'Marga',
    lastName: 'Buyer',
    phone: '+639123456780',
  });

  assert(regResult && regResult.user, 'Registration returned no user');
  assert(regResult.user.email.toLowerCase() === testEmail.toLowerCase(), 'Email does not match registered email');
  assert(regResult.user.roles.includes('buyer'), 'User lacks buyer role');
  assert(Boolean(regResult.token), 'Registration returned no JWT token');
  console.log('✅ Test 1 PASSED: User successfully registered');

  // 2. Log in with the registered credentials
  console.log('Test 2: Logging in after logout (exact email)...');
  const loginResult = await authService.login({
    email: testEmail,
    password: testPassword,
  });

  assert(loginResult && loginResult.user, 'Login returned no user');
  assert(loginResult.user.email.toLowerCase() === testEmail.toLowerCase(), 'Login user email mismatch');
  assert(Boolean(loginResult.token), 'Login returned no token');
  console.log('✅ Test 2 PASSED: Successfully logged in with newly registered account');

  // 3. Log in with case-insensitive email (uppercase)
  console.log('Test 3: Logging in with case-insensitive email (uppercase)...');
  const upperEmail = testEmail.toUpperCase();
  const upperLoginResult = await authService.login({
    email: upperEmail,
    password: testPassword,
  });

  assert(upperLoginResult && upperLoginResult.user, 'Uppercase login returned no user');
  assert(upperLoginResult.user.email.toLowerCase() === testEmail.toLowerCase(), 'Uppercase login email mismatch');
  console.log('✅ Test 3 PASSED: Case-insensitive email login works seamlessly');

  // 4. Reject invalid password
  console.log('Test 4: Rejecting wrong password...');
  let rejected = false;
  try {
    await authService.login({
      email: testEmail,
      password: 'wrong-password-999',
    });
  } catch (err: any) {
    rejected = true;
    assert(err.message === 'Invalid email or password', `Unexpected error message: ${err.message}`);
  }
  assert(rejected, 'Login should have failed for wrong password');
  console.log('✅ Test 4 PASSED: Wrong password correctly rejected with Invalid email or password');

  // 5. Register another user to verify no sequence or constraint collision
  console.log('Test 5: Registering second buyer to verify sequence alignment...');
  const secondEmail = `test.second.${Date.now()}@agrimarket.com`;
  const secondReg = await authService.register({
    email: secondEmail,
    password: testPassword,
    firstName: 'Second',
    lastName: 'User',
  });

  assert(secondReg.user.id > 0, 'Second user has invalid id');
  assert(secondReg.user.email.toLowerCase() === secondEmail.toLowerCase(), 'Second user email mismatch');

  const secondLogin = await authService.login({
    email: secondEmail,
    password: testPassword,
  });
  assert(secondLogin.user.email.toLowerCase() === secondEmail.toLowerCase(), 'Second user login failed');
  console.log('✅ Test 5 PASSED: Second user registered and logged in with no sequence collision');

  // Cleanup test users from DB
  console.log('Cleaning up test users...');
  try {
    if (db.getIsMySqlConnected()) {
      const conn = await pool.getConnection();
      try {
        await conn.query('DELETE FROM user_roles WHERE user_id = ?', [regResult.user.id]);
        await conn.query('DELETE FROM users WHERE id = ?', [regResult.user.id]);
        await conn.query('DELETE FROM user_roles WHERE user_id = ?', [secondReg.user.id]);
        await conn.query('DELETE FROM users WHERE id = ?', [secondReg.user.id]);
      } finally {
        conn.release();
      }
    }
  } catch (err: any) {
    console.warn('Notice: cleanup warning:', err.message);
  }

  console.log('🎉 ALL AUTH TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runAuthTests().catch((err) => {
  console.error('❌ Auth test failure:', err);
  process.exit(1);
});
