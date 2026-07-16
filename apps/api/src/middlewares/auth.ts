import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User, IUser } from '../models/User.js';
import { UserRole } from '@learnquest/shared-types';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const authenticate = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
        id: string;
        username: string;
        role: UserRole;
      };

      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          message: 'User account is inactive or not found.',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      req.user = user;
      next();
    } catch (err) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired access token.',
        code: 'TOKEN_EXPIRED',
      });
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...allowedRoles: UserRole[]): RequestHandler => {
  return (req: any, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`,
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
};
