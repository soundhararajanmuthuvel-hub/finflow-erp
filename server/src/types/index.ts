import { Request } from 'express';
import { Role } from './enums.js';

export * from './enums.js';

export interface AuthUserPayload {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  companyId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}
