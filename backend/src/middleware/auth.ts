import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../database/store';

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

    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: number;
      email: string;
      roles: string[];
    };

    // Verify user exists and check suspension status
    const liveUser = db.getUserById(decoded.id);
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
      roles: liveUser.roles || decoded.roles || ['buyer'],
    };

    return next();
  } catch (error) {
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
        roles: liveUser.roles || decoded.roles || ['buyer'],
      };
    }

    return next();
  } catch {
    // Optional auth - gracefully treat invalid/expired tokens as unauthenticated
    return next();
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        data: null,
        errorCode: 'AUTH_REQUIRED'
      });
    }

    const hasRole = roles.some(role => req.user!.roles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        data: null,
        errorCode: 'AUTH_INSUFFICIENT_PERMISSIONS'
      });
    }

    return next();
  };
};
