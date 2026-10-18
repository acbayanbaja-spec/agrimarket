import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import pool from '../config/database';
import { config } from '../config';
import { db } from '../database/store';
import { databaseUnavailableError, isEmbeddedFallbackAllowed } from '../config/persistence';
import { normalizeRoles } from '../utils/roles';

const jwtSignOptions: SignOptions = {
  expiresIn: (config.jwt.expiresIn || '7d') as SignOptions['expiresIn'],
};

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function signUserToken(user: { id: number; email: string; roles: string[] }) {
  const roles = normalizeRoles(user.roles);
  return jwt.sign(
    { id: user.id, email: user.email, roles },
    config.jwt.secret,
    jwtSignOptions
  );
}

function credentialsError() {
  const err: any = new Error('Invalid email or password');
  err.statusCode = 401;
  err.code = 'INVALID_CREDENTIALS';
  return err;
}

function deactivatedError() {
  const err: any = new Error('Account is deactivated. Please contact support.');
  err.statusCode = 403;
  err.code = 'ACCOUNT_DEACTIVATED';
  return err;
}

function existsError() {
  const err: any = new Error('User already exists');
  err.statusCode = 409;
  err.code = 'USER_EXISTS';
  return err;
}

export const SELLER_EMAIL_ALIASES: Record<string, string[]> = {
  'seller.vegetables@agrimarket.com': ['seller@agrimarket.com'],
  'seller@agrimarket.com': ['seller.vegetables@agrimarket.com'],
  'seller.fruits@agrimarket.com': ['seller.midsayap@agrimarket.com'],
  'seller.midsayap@agrimarket.com': ['seller.fruits@agrimarket.com'],
  'seller.rice@agrimarket.com': ['seller.tacurong@agrimarket.com'],
  'seller.tacurong@agrimarket.com': ['seller.rice@agrimarket.com'],
  'seller.grains@agrimarket.com': ['seller.koronadal@agrimarket.com'],
  'seller.koronadal@agrimarket.com': ['seller.grains@agrimarket.com'],
  'seller.fish@agrimarket.com': ['seller.lakesebu@agrimarket.com'],
  'seller.lakesebu@agrimarket.com': ['seller.fish@agrimarket.com'],
  'seller.supplies@agrimarket.com': ['seller.gensan@agrimarket.com'],
  'seller.gensan@agrimarket.com': ['seller.supplies@agrimarket.com'],
  'seller.livestock@agrimarket.com': ['seller.dairy@agrimarket.com'],
  'seller.dairy@agrimarket.com': ['seller.livestock@agrimarket.com'],
};

async function loadMysqlUserByEmail(email: string) {
  const connection = await pool.getConnection();
  try {
    const candidateEmails = [email, ...(SELLER_EMAIL_ALIASES[email] || [])];
    for (const cand of candidateEmails) {
      const [users] = await connection.query(
        `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.phone, u.is_verified, u.is_active,
         STRING_AGG(r.name, ',') as roles
         FROM users u
         LEFT JOIN user_roles ur ON u.id = ur.user_id
         LEFT JOIN roles r ON ur.role_id = r.id
         WHERE u.email = ?
         GROUP BY u.id`,
        [cand]
      );
      if ((users as any[]).length > 0) {
        return (users as any[])[0];
      }
    }
    return null;
  } finally {
    connection.release();
  }
}

export const authService = {
  async register(data: RegisterData) {
    await db.waitUntilReady();
    const email = normalizeEmail(data.email);

    if (db.getIsMySqlConnected()) {
      const connection = await pool.getConnection();
      try {
        const [existingUsers] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
        if ((existingUsers as any[]).length > 0) {
          throw existsError();
        }

        const passwordHash = await bcrypt.hash(data.password, 10);
        const [result] = await connection.query(
          'INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?) RETURNING id',
          [email, passwordHash, data.firstName, data.lastName, data.phone || null]
        );

        const userId = (result as any).insertId || (result as any)[0]?.id;
        const [roles] = await connection.query('SELECT id FROM roles WHERE name = ?', ['buyer']);
        const roleId = (roles as any)[0]?.id;
        if (roleId) {
          await connection.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON CONFLICT (user_id, role_id) DO NOTHING', [userId, roleId]);
        }

        const [users] = await connection.query(
          `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.is_verified, u.is_active,
           STRING_AGG(r.name, ',') as roles
           FROM users u
           LEFT JOIN user_roles ur ON u.id = ur.user_id
           LEFT JOIN roles r ON ur.role_id = r.id
           WHERE u.id = ?
           GROUP BY u.id`,
          [userId]
        );

        const user = (users as any)[0];
        user.roles = normalizeRoles(user.roles);

        db.addUser({
          id: user.id,
          email: user.email,
          password_hash: passwordHash,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          roles: user.roles,
          is_verified: true,
          is_active: true,
          created_at: new Date().toISOString(),
        });

        return { user, token: signUserToken(user) };
      } finally {
        connection.release();
      }
    }

    if (!isEmbeddedFallbackAllowed()) {
      throw databaseUnavailableError();
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      throw existsError();
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const newUser = db.addUser({
      email,
      password_hash: passwordHash,
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      roles: ['buyer'],
      is_verified: true,
      is_active: true,
      created_at: new Date().toISOString(),
    });

    const token = signUserToken(newUser);
    const { password_hash, ...safeUser } = newUser;
    return { user: safeUser, token };
  },

  async login(data: LoginData) {
    await db.waitUntilReady();
    const email = normalizeEmail(data.email);

    if (db.getIsMySqlConnected()) {
      try {
        const user = await loadMysqlUserByEmail(email);
        if (!user) {
          throw credentialsError();
        }
        if (!user.is_active) {
          throw deactivatedError();
        }

        const isValid = await bcrypt.compare(data.password, user.password_hash);
        if (!isValid) {
          throw credentialsError();
        }

        user.roles = normalizeRoles(user.roles);
        const token = signUserToken(user);
        delete user.password_hash;
        return { user, token };
      } catch (mysqlErr: any) {
        if (mysqlErr.statusCode) {
          throw mysqlErr;
        }
        console.error('MySQL login query failed:', mysqlErr.message);
        if (!isEmbeddedFallbackAllowed()) {
          throw databaseUnavailableError();
        }
      }
    } else if (!isEmbeddedFallbackAllowed()) {
      throw databaseUnavailableError();
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      throw credentialsError();
    }

    if (!user.is_active) {
      throw deactivatedError();
    }

    const isValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isValid) {
      throw credentialsError();
    }

    user.roles = normalizeRoles(user.roles);
    const token = signUserToken(user);
    const { password_hash, ...safeUser } = user;
    return { user: safeUser, token };
  },

  async getUserById(userId: number) {
    await db.waitUntilReady();
    if (db.getIsMySqlConnected()) {
      try {
        const connection = await pool.getConnection();
        try {
          const [users] = await connection.query(
            `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.profile_image, u.is_verified, u.is_active,
             STRING_AGG(r.name, ',') as roles
             FROM users u
             LEFT JOIN user_roles ur ON u.id = ur.user_id
             LEFT JOIN roles r ON ur.role_id = r.id
             WHERE u.id = ?
             GROUP BY u.id`,
            [userId]
          );

          const user = (users as any)[0];
          if (user) {
            user.roles = normalizeRoles(user.roles);
            delete user.password_hash;
          }
          return user || null;
        } finally {
          connection.release();
        }
      } catch (e: any) {
        console.error('MySQL getUserById failed:', e.message);
        if (!isEmbeddedFallbackAllowed()) {
          throw databaseUnavailableError();
        }
      }
    }

    const local = db.getUserById(userId);
    if (local) {
      const { password_hash, ...safe } = local;
      return safe;
    }
    return null;
  },

  async requestPasswordReset(email: string) {
    await db.waitUntilReady();
    const cleanEmail = email.trim().toLowerCase();

    let existingUser: any = null;
    if (db.getIsMySqlConnected()) {
      try {
        const conn = await pool.getConnection();
        try {
          const [rows]: any = await conn.query('SELECT id, email, first_name FROM users WHERE email = ?', [cleanEmail]);
          existingUser = rows[0] || null;
        } finally {
          conn.release();
        }
      } catch (err: any) {
        if (!isEmbeddedFallbackAllowed()) throw databaseUnavailableError();
      }
    }
    if (!existingUser) {
      existingUser = db.getUserByEmail(cleanEmail);
    }

    if (!existingUser) {
      return { message: 'If this email exists, password reset instructions have been dispatched.' };
    }

    const resetToken = jwt.sign(
      { sub: existingUser.id, email: existingUser.email, purpose: 'pwd_reset' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    db.addAuditLog({
      adminId: existingUser.id,
      adminEmail: existingUser.email,
      action: 'PASSWORD_RESET_REQUESTED',
      targetType: 'user',
      targetId: String(existingUser.id),
      details: `Password reset requested for ${cleanEmail}`,
    });

    return {
      message: 'If this email exists, password reset instructions have been dispatched.',
      resetToken: process.env.NODE_ENV === 'production' ? undefined : resetToken,
    };
  },

  async resetPassword(token: string, newPassword: string) {
    await db.waitUntilReady();
    let payload: any;
    try {
      payload = jwt.verify(token, config.jwt.secret);
      if (payload.purpose !== 'pwd_reset' || !payload.sub) {
        throw new Error('Invalid token purpose');
      }
    } catch {
      const err: any = new Error('Invalid or expired password reset token');
      err.statusCode = 400;
      err.code = 'INVALID_RESET_TOKEN';
      throw err;
    }

    const userId = Number(payload.sub);
    const passwordHash = await bcrypt.hash(newPassword, 10);

    if (db.getIsMySqlConnected()) {
      try {
        const conn = await pool.getConnection();
        try {
          await conn.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
        } finally {
          conn.release();
        }
      } catch (err: any) {
        if (!isEmbeddedFallbackAllowed()) throw databaseUnavailableError();
      }
    }

    const localUser = db.getUserById(userId);
    if (localUser) {
      localUser.password_hash = passwordHash;
      db.saveData();
    }

    db.addAuditLog({
      adminId: userId,
      adminEmail: payload.email || 'user',
      action: 'PASSWORD_RESET_COMPLETED',
      targetType: 'user',
      targetId: String(userId),
      details: `Password reset successfully completed for user ID ${userId}`,
    });

    return { message: 'Password has been successfully updated. You may now log in.' };
  },
};
