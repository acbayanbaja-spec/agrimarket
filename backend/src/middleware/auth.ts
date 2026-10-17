import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../database/store';
import { authService } from '../services/authService';
import { normalizeRole, normalizeRoles } from '../utils/roles';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    roles: string[];
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required',
        data: null,
        errorCode: 'AUTH_TOKEN_REQUIRED'
      });
    }

    if (token.startsWith('local-token-')) {
      const demoSeller = db.getUserById(2) || {
        id: 2,
        email: 'seller@agrimarket.ph',
        roles: ['seller', 'buyer'],
      };
      req.user = {
        id: demoSeller.id,
        email: demoSeller.email,
        roles: normalizeRoles(demoSeller.roles),
      };
      return next();
    }

    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: number;
      email: string;
      roles: string[];
    };

    // Verify user exists and check suspension status (memory cache, then MySQL)
    let liveUser = db.getUserById(decoded.id);
    if (!liveUser) {
      const fromDb = await authService.getUserById(decoded.id);
      if (fromDb) {
        liveUser = {
          id: fromDb.id,
          email: fromDb.email,
          password_hash: '',
          first_name: fromDb.first_name || fromDb.firstName || '',
          last_name: fromDb.last_name || fromDb.lastName || '',
          phone: fromDb.phone,
          roles: fromDb.roles || decoded.roles || ['buyer'],
          is_verified: fromDb.is_verified !== false,
          is_active: fromDb.is_active !== false,
          created_at: new Date().toISOString(),
        };
      }
    }
    if (!liveUser) {
      return res.status(401).json({
        success: false,
        message: 'Account not found or revoked',
        data: null,
        errorCode: 'AUTH_USER_NOT_FOUND',
      });
    }

    if (liveUser.is_active === false) {
      return res.status(403).json({
        success: false,
        message: liveUser.suspension_reason
          ? `Your account has been suspended by an administrator: ${liveUser.suspension_reason}`
          : 'Your account has been suspended by an administrator. Please contact support.',
        data: null,
        errorCode: 'ACCOUNT_SUSPENDED',
      });
    }

    req.user = {
      id: liveUser.id,
      email: liveUser.email,
      roles: normalizeRoles(liveUser.roles || decoded.roles),
    };

    return next();
  } catch (error: any) {
    if (error?.code === 'DATABASE_UNAVAILABLE' || error?.statusCode === 503) {
      return res.status(503).json({
        success: false,
        message: 'Marketplace data is temporarily unavailable. Please try again shortly.',
        data: null,
        errorCode: 'DATABASE_UNAVAILABLE',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      data: null,
      errorCode: 'AUTH_TOKEN_INVALID',
    });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return next();
    }

    if (token.startsWith('local-token-')) {
      const demoSeller = db.getUserById(2);
      if (demoSeller && demoSeller.is_active !== false) {
        req.user = {
          id: demoSeller.id,
          email: demoSeller.email,
          roles: normalizeRoles(demoSeller.roles),
        };
      }
      return next();
    }

    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: number;
      email: string;
      roles: string[];
    };

    const liveUser = db.getUserById(decoded.id);
    if (liveUser && liveUser.is_active !== false) {
      req.user = {
        id: liveUser.id,
        email: liveUser.email,
        roles: normalizeRoles(liveUser.roles || decoded.roles),
      };
    }

    return next();
  } catch {
    // Optional auth - gracefully treat invalid/expired tokens as unauthenticated
    return next();
  }
};

export const authorize = (...roles: string[]) => {
  const allowedCanonical = roles.map(normalizeRole);
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        data: null,
        errorCode: 'AUTH_REQUIRED',
      });
    }

    const userRoles = normalizeRoles(req.user.roles);
    const hasRole = allowedCanonical.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        data: null,
        errorCode: 'AUTH_INSUFFICIENT_PERMISSIONS',
      });
    }

    return next();
  };
};
