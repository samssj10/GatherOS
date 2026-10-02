import { Router } from 'express';
import * as controller from '../controllers/authController';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

export const authRouter = Router();

authRouter.post('/login', validate({ body: controller.loginBodySchema }), controller.login);
authRouter.get('/me', requireAuth, controller.me);
authRouter.post('/logout', controller.logout);
