import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { LoginSchema } from '../validators/index.js';

const router = Router();

router.post('/login', validateRequest(LoginSchema), AuthController.login);
router.get('/me', authenticate, AuthController.getMe);

export default router;
