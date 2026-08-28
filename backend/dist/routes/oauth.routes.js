"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
// Helper to generate tokens and redirect
const handleAuthSuccess = (req, res) => {
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
    const accessToken = jsonwebtoken_1.default.sign(payload, env_1.ENV.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jsonwebtoken_1.default.sign(payload, env_1.ENV.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    // Redirect to frontend callback route with tokens
    const redirectUrl = `${frontendUrl}/oauth-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
    res.redirect(redirectUrl);
};
// ─── GOOGLE ───
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: '/' }), handleAuthSuccess);
// ─── GITHUB ───
router.get('/github', passport_1.default.authenticate('github', { scope: ['user:email'], session: false }));
router.get('/github/callback', passport_1.default.authenticate('github', { session: false, failureRedirect: '/' }), handleAuthSuccess);
// ─── APPLE ───
router.get('/apple', passport_1.default.authenticate('apple'));
router.post('/apple/callback', passport_1.default.authenticate('apple', { session: false, failureRedirect: '/' }), handleAuthSuccess);
exports.default = router;
//# sourceMappingURL=oauth.routes.js.map