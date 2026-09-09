import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import pool from '../config/database';
import { config } from '../config';

const jwtSignOptions: SignOptions = {
  expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'],
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
    const connection = await pool.getConnection();
    
    try {
      // Check if user already exists
      const [existingUsers] = await connection.query(
        'SELECT id FROM users WHERE email = ?',
        [data.email]
      );
      
      if ((existingUsers as any[]).length > 0) {
        throw new Error('User already exists');
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);
      
      // Insert user
      const [result] = await connection.query(
        'INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)',
        [data.email, passwordHash, data.firstName, data.lastName, data.phone || null]
      );
      
      const userId = (result as any).insertId;
      
      // Assign buyer role by default
      const [roles] = await connection.query('SELECT id FROM roles WHERE name = ?', ['buyer']);
      const roleId = (roles as any)[0].id;
      
      await connection.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
        [userId, roleId]
      );
      
      // Get user with roles
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
      user.roles = user.roles ? user.roles.split(',') : [];
      
      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          roles: user.roles,
        },
        config.jwt.secret,
        jwtSignOptions
      );
      
      return { user, token };
    } finally {
      connection.release();
    }
  },

  async login(data: LoginData) {
    const connection = await pool.getConnection();
    
    try {
      // Get user with roles
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
      
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      if (!user.is_active) {
        throw new Error('Account is deactivated');
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(data.password, user.password_hash);
      
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }
      
      user.roles = user.roles ? user.roles.split(',') : [];
      
      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          roles: user.roles,
        },
        config.jwt.secret,
        jwtSignOptions
      );
      
      // Remove password hash from response
      delete user.password_hash;
      
      return { user, token };
    } finally {
      connection.release();
    }
  },

  async getUserById(userId: number) {
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
      }
      
      return user;
    } finally {
      connection.release();
    }
  },
};
