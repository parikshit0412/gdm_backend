import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email: string;
  roles: number[];
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Support both cookie and Bearer token
    let token: string | undefined;

    // 1. Check HTTP-only cookie
    if (req.cookies?.token) {
      token = req.cookies.token as string;
    }

    // 2. Fallback to Authorization header
    const authHeader = req.headers.authorization;
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    const secret = process.env.JWT_SECRET!;
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    let token: string | undefined;
    if (req.cookies?.token) {
      token = req.cookies.token as string;
    }
    const authHeader = req.headers.authorization;
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (token) {
      const secret = process.env.JWT_SECRET!;
      const decoded = jwt.verify(token, secret) as JwtPayload;
      req.user = decoded;
    }
  } catch {
    // Ignore invalid tokens for optional authentication
  }
  next();
};

/**
 * Role-based guard middleware factory.
 * Pass required role IDs — user must have AT LEAST ONE.
 */
export const requireRole = (...requiredRoleIds: number[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const userRoles = req.user.roles;
    const hasRole = requiredRoleIds.some((roleId) => userRoles.includes(roleId));

    if (!hasRole) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${requiredRoleIds.join(', ')}`,
      });
      return;
    }

    next();
  };
};

// Convenience role constants
export const ROLES = {
  JOB_SEEKER: 1,
  JOB_POSTER: 2,
  BUSINESS_PROMOTER: 3,
  SUPER_USER: 4,
} as const;
