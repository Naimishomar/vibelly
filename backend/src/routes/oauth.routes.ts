import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

const router = Router();

// Helper to generate tokens and redirect
const handleAuthSuccess = (req: any, res: any) => {
  const user = req.user;
  const frontendUrl = process.env.NODE_ENV === 'production' ? 'https://vibelly.fun' : (process.env.FRONTEND_URL || 'http://localhost:5173');

  if (!user) {
    return res.redirect(`${frontendUrl}?error=auth_failed`);
  }

  const payload = { 
    id: user._id, 
    _id: user._id,
    name: user.name,
    username: user.username, 
    email: user.email,
    profileImage: user.profileImage,
    premiumStatus: user.premiumStatus,
    gender: user.gender,
    country: user.country
  };
  
  const accessToken = jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, ENV.JWT_REFRESH_SECRET, { expiresIn: '7d' });

  // Redirect to frontend callback route with tokens
  const redirectUrl = `${frontendUrl}/oauth-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
  res.redirect(redirectUrl);
};

// ─── GOOGLE ───
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/' }), handleAuthSuccess);

// ─── GITHUB ───
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get('/github/callback', passport.authenticate('github', { session: false, failureRedirect: '/' }), handleAuthSuccess);

// ─── APPLE ───
router.get('/apple', passport.authenticate('apple'));
router.post('/apple/callback', passport.authenticate('apple', { session: false, failureRedirect: '/' }), handleAuthSuccess);

export default router;
