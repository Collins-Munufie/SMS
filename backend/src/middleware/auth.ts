import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../utils/prisma';
import { Role } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, config.jwtSecret, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    const userPayload = decoded as AuthUser;
    
    // Check if account is active (not revoked)
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userPayload.id },
        select: { isActive: true },
      });

      if (!dbUser || !dbUser.isActive) {
        return res.status(403).json({ error: 'Account access has been revoked by Admin.' });
      }
    } catch {
      // Fallback
    }

    req.user = userPayload;
    next();
  });
};

export const authorizeRoles = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Permission denied. Access restricted to roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
};
