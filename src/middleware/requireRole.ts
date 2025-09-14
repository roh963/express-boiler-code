
import { Request, Response, NextFunction } from 'express';
import { UserPayload } from '../types/express';

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ errors: [{ field: 'user', message: 'Unauthorized' }] });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ errors: [{ field: 'role', message: 'Forbidden' }] });
    }
    next();
  };
}

// For feedback DELETE: allow if admin or owner
export function requireAdminOrOwner(getResourceUserId: (req: Request) => string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ errors: [{ field: 'user', message: 'Unauthorized' }] });
    }
  const user = req.user as UserPayload;
    if (user.role === 'ADMIN' || user._id.toString() === getResourceUserId(req)) {
      return next();
    }
    return res.status(403).json({ errors: [{ field: 'role', message: 'Forbidden' }] });
  };
}
