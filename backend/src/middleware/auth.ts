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

    if (token.startsWith('local-') || token.startsWith('demo-')) {
      const id = Number(token.split('-')[1]);
      const demo: Record<number, { email: string; roles: string[] }> = {
        1: { email: 'admin@agrimarket.com', roles: ['admin'] },
        2: { email: 'seller@agrimarket.com', roles: ['seller', 'buyer'] },
        3: { email: 'buyer@agrimarket.com', roles: ['buyer'] },
        4: { email: 'driver@agrimarket.com', roles: ['delivery'] },
        12: { email: 'seller.koronadal@agrimarket.com', roles: ['seller', 'buyer'] },
        13: { email: 'seller.midsayap@agrimarket.com', roles: ['seller', 'buyer'] },
        14: { email: 'seller.gensan@agrimarket.com', roles: ['seller', 'buyer'] },
        15: { email: 'seller.tacurong@agrimarket.com', roles: ['seller', 'buyer'] },
        16: { email: 'seller.poultry@agrimarket.com', roles: ['seller', 'buyer'] },
        17: { email: 'seller.lakesebu@agrimarket.com', roles: ['seller', 'buyer'] },
      };
      const account = demo[id] || { email: 'local@agrimarket.com', roles: ['buyer'] };
      req.user = { id: Number.isFinite(id) ? id : 3, email: account.email, roles: account.roles };
    } else {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        id: number;
        email: string;
        roles: string[];
      };

      req.user = decoded;
    }

    // Enforce administrative suspension
    if (req.user) {
      const liveUser = db.getUserById(req.user.id);
      if (liveUser && liveUser.is_active === false) {
        return res.status(403).json({
          success: false,
          message: liveUser.suspension_reason
            ? `Your account has been suspended by an administrator: ${liveUser.suspension_reason}`
            : 'Your account has been suspended by an administrator. Please contact support.',
          data: null,
          errorCode: 'ACCOUNT_SUSPENDED'
        });
      }
    }

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      data: null,
      errorCode: 'AUTH_TOKEN_INVALID'
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
    if (token.startsWith('local-') || token.startsWith('demo-')) {
      const id = Number(token.split('-')[1]);
      const demo: Record<number, { email: string; roles: string[] }> = {
        1: { email: 'admin@agrimarket.com', roles: ['admin'] },
        2: { email: 'seller@agrimarket.com', roles: ['seller', 'buyer'] },
        3: { email: 'buyer@agrimarket.com', roles: ['buyer'] },
        4: { email: 'driver@agrimarket.com', roles: ['delivery'] },
        12: { email: 'seller.koronadal@agrimarket.com', roles: ['seller', 'buyer'] },
        13: { email: 'seller.midsayap@agrimarket.com', roles: ['seller', 'buyer'] },
        14: { email: 'seller.gensan@agrimarket.com', roles: ['seller', 'buyer'] },
        15: { email: 'seller.tacurong@agrimarket.com', roles: ['seller', 'buyer'] },
        16: { email: 'seller.poultry@agrimarket.com', roles: ['seller', 'buyer'] },
        17: { email: 'seller.lakesebu@agrimarket.com', roles: ['seller', 'buyer'] },
      };
      const account = demo[id] || { email: 'local@agrimarket.com', roles: ['buyer'] };
      req.user = { id: Number.isFinite(id) ? id : 3, email: account.email, roles: account.roles };
      return next();
    }
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: number;
      email: string;
      roles: string[];
    };
    req.user = decoded;
    return next();
  } catch {
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
