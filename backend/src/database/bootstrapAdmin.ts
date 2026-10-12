import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { db } from './store';

dotenv.config();

export async function bootstrapAdmin(
  email = process.env.BOOTSTRAP_ADMIN_EMAIL,
  password = process.env.BOOTSTRAP_ADMIN_PASSWORD,
  firstName = process.env.BOOTSTRAP_ADMIN_FIRSTNAME || 'System',
  lastName = process.env.BOOTSTRAP_ADMIN_LASTNAME || 'Administrator'
) {
  if (!email || !password) {
    throw new Error(
      'Bootstrap failed: Both BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD environment variables must be defined.'
    );
  }

  if (password.length < 10) {
    throw new Error('Bootstrap failed: Administrator password must be at least 10 characters long.');
  }

  if (password.toLowerCase().includes('admin123') || password.toLowerCase().includes('password')) {
    throw new Error('Bootstrap failed: Administrator password cannot use predictable default passwords.');
  }

  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const existing = db.getUserByEmail(email);
  if (existing) {
    const roles = Array.from(new Set([...(existing.roles || []), 'admin', 'buyer']));
    const updated = db.updateUser(existing.id, {
      password_hash: passwordHash,
      roles,
      is_active: true,
      is_verified: true,
    });

    db.addAuditLog({
      adminId: existing.id,
      adminEmail: email,
      action: 'ADMIN_CREDENTIALS_BOOTSTRAPPED',
      targetType: 'user',
      targetId: String(existing.id),
      details: `Administrator account ${email} updated via secure bootstrap process with 12-round bcrypt hash.`,
      ipAddress: '127.0.0.1',
    });

    console.log(`✅ Administrator account [${email}] credentials successfully rotated and verified.`);
    return updated;
  } else {
    const newUser = db.addUser({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      phone: process.env.BOOTSTRAP_ADMIN_PHONE || '+639120000000',
      roles: ['admin', 'buyer'],
      is_verified: true,
      is_active: true,
      created_at: new Date().toISOString(),
    });

    db.addAuditLog({
      adminId: newUser.id,
      adminEmail: email,
      action: 'ADMIN_ACCOUNT_BOOTSTRAPPED',
      targetType: 'user',
      targetId: String(newUser.id),
      details: `New administrator account created via secure bootstrap utility.`,
      ipAddress: '127.0.0.1',
    });

    console.log(`✅ New administrator account [${email}] successfully created via secure bootstrap.`);
    return newUser;
  }
}

if (require.main === module) {
  bootstrapAdmin()
    .then(() => {
      console.log('Admin bootstrap completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Admin bootstrap error:', err.message);
      process.exit(1);
    });
}
