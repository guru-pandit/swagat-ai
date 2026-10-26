import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { authenticate } from '../middleware/auth';
import { authController } from '../controllers/auth.controller';
import { oauthService } from '../services/oauth.service';

export const authRouter = Router();

authRouter.post('/login', asyncHandler(authController.login));
authRouter.post('/refresh', asyncHandler(authController.refresh));
authRouter.post('/logout', asyncHandler(authController.logout));
// Reading the current session is a GET because it does not change authentication state.
authRouter.get('/me', authenticate, asyncHandler(authController.me));

/** POST /api/auth/google  — body: { idToken: string } from Google Sign-In button */
authRouter.post('/google', asyncHandler(async (req, res) => {
  const data = await oauthService.googleLogin(req.body.idToken);
  res.json({ success: true, data });
}));
