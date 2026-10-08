import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import pool from '../config/database';
import { config } from '../config';
import { db } from '../database/store';

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

export const authService = {
  async register(data: RegisterData) {
    // Attempt MySQL first if available
    try {
      const connection = await pool.getConnection();
      try {
        const [existingUsers] = await connection.query('SELECT id FROM users WHERE email = ?', [data.email]);
        if ((existingUsers as any[]).length > 0) {
          throw new Error('User already exists');
        }

        const passwordHash = await bcrypt.hash(data.password, 10);
        const [result] = await connection.query(
          'INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)',
          [data.email, passwordHash, data.firstName, data.lastName, data.phone || null]
        );

        const userId = (result as any).insertId;
        const [roles] = await connection.query('SELECT id FROM roles WHERE name = ?', ['buyer']);
        const roleId = (roles as any)[0]?.id || 1;

        await connection.query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId]);

        const [users] = await connection.query(
          `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.is_verified, u.is_active,
           GROUP_CONCAT(r.name) as roles
           FROM users u
           LEFT JOIN user_roles ur ON u.id = ur.user_id
           LEFT JOIN roles r ON ur.role_id = r.id
           WHERE u.id = ?
           GROUP BY u.id`,
          [userId]
        );

        const user = (users as any)[0];
        user.roles = user.roles ? user.roles.split(',') : ['buyer'];

        const token = jwt.sign(
          { id: user.id, email: user.email, roles: user.roles },
          config.jwt.secret,
          jwtSignOptions
        );

        // Also sync to local db store
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

        return { user, token };
      } finally {
        connection.release();
      }
    } catch (mysqlErr: any) {
      if (mysqlErr.message === 'User already exists') {
        throw mysqlErr;
      }
      // Fallback to high-reliability persistent local store
      const existing = db.getUserByEmail(data.email);
      if (existing) {
        throw new Error('User already exists');
      }

      const passwordHash = await bcrypt.hash(data.password, 10);
      const newUser = db.addUser({
        email: data.email,
        password_hash: passwordHash,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        roles: ['buyer'],
        is_verified: true,
        is_active: true,
        created_at: new Date().toISOString(),
      });

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, roles: newUser.roles },
        config.jwt.secret,
        jwtSignOptions
      );

      const { password_hash, ...safeUser } = newUser;
      return { user: safeUser, token };
    }
  },

  async login(data: LoginData) {
    // Attempt MySQL first if available
    try {
      const connection = await pool.getConnection();
      try {
        const [users] = await connection.query(
          `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.phone, u.is_verified, u.is_active,
           GROUP_CONCAT(r.name) as roles
           FROM users u
           LEFT JOIN user_roles ur ON u.id = ur.user_id
           LEFT JOIN roles r ON ur.role_id = r.id
           WHERE u.email = ?
           GROUP BY u.id`,
          [data.email]
        );

        const user = (users as any)[0];
        if (!user) throw new Error('Invalid credentials');
        if (!user.is_active) throw new Error('Account is deactivated');

        const isValid = await bcrypt.compare(data.password, user.password_hash);
        if (!isValid) throw new Error('Invalid credentials');

        user.roles = user.roles ? user.roles.split(',') : ['buyer'];

        const token = jwt.sign(
          { id: user.id, email: user.email, roles: user.roles },
          config.jwt.secret,
          jwtSignOptions
        );

        delete user.password_hash;
        return { user, token };
      } finally {
        connection.release();
      }
    } catch (mysqlErr: any) {
      if (mysqlErr.message === 'Invalid credentials' || mysqlErr.message === 'Account is deactivated') {
        throw mysqlErr;
      }
      // Fallback to high-reliability local store
      const user = db.getUserByEmail(data.email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }

      const isValid = await bcrypt.compare(data.password, user.password_hash);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, roles: user.roles },
        config.jwt.secret,
        jwtSignOptions
      );

      const { password_hash, ...safeUser } = user;
      return { user: safeUser, token };
    }
  },

  async getUserById(userId: number) {
    try {
      const connection = await pool.getConnection();
      try {
        const [users] = await connection.query(
          `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.profile_image, u.is_verified, u.is_active,
           GROUP_CONCAT(r.name) as roles
           FROM users u
           LEFT JOIN user_roles ur ON u.id = ur.user_id
           LEFT JOIN roles r ON ur.role_id = r.id
           WHERE u.id = ?
           GROUP BY u.id`,
          [userId]
        );

        const user = (users as any)[0];
        if (user) {
          user.roles = user.roles ? user.roles.split(',') : [];
          delete user.password_hash;
        }
        return user;
      } finally {
        connection.release();
      }
    } catch (e) {
      const local = db.getUserById(userId);
      if (local) {
        const { password_hash, ...safe } = local;
        return safe;
      }
      return null;
    }
  },
};
