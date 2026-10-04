import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { AuthService } from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AuthController {
  static async login(req: AuthenticatedRequest, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      sendSuccess(res, result, 'Logged in successfully');
    } catch (error: any) {
      sendError(res, error.message, 401);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401);
        return;
      }
      const user = await AuthService.getMe(req.user.id);
      sendSuccess(res, user, 'Profile retrieved');
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }
}
