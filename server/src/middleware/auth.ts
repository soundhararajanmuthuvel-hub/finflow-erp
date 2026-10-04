import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../types/enums.js';
import { config } from '../config/index.js';
import { AuthenticatedRequest, AuthUserPayload } from '../types/index.js';
import { sendError } from '../utils/response.js';

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication token required', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    sendError(res, 'Invalid or expired authentication token', 401);
    return;
  }
};

export const requireRoles = (roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'Forbidden: Insufficient privileges', 403);
      return;
    }

    next();
  };
};

export const canManageFinances = requireRoles([
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.FINANCE_MANAGER,
]);

export const canViewData = requireRoles([
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.FINANCE_MANAGER,
  Role.STAFF,
  Role.VIEWER,
]);
