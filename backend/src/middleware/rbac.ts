import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User.js';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' });
      return;
    }

    if (req.user.role === 'Super Admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    res.status(403).json({
      success: false,
      error: `Forbidden: Role '${req.user.role}' lacks necessary privileges for this action`,
    });
  };
}

export function preventViewerControl(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  if (req.user.role === 'Viewer') {
    res.status(403).json({
      success: false,
      error: 'Forbidden: Viewers are not permitted to issue device control commands or modifications',
    });
    return;
  }

  next();
}
