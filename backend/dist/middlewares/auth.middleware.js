"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.requireAuth = void 0;
const jwt_1 = require("../utils/jwt");
const User_1 = __importDefault(require("../models/User"));
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized: No token provided' });
            return;
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'Unauthorized: Malformed token' });
            return;
        }
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        const user = await User_1.default.findById(decoded.id);
        if (!user) {
            res.status(401).json({ error: 'Unauthorized: User not found' });
            return;
        }
        if (user.isBanned) {
            res.status(403).json({ error: 'Forbidden: Your account has been banned' });
            return;
        }
        // Lazy check for premium expiry
        if (user.premiumStatus && user.premiumExpiryDate && new Date() > user.premiumExpiryDate) {
            user.premiumStatus = false;
            await user.save();
        }
        // @ts-ignore
        req.user = user;
        next();
    }
    catch (error) {
        console.error('[requireAuth] Error:', error);
        res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
};
exports.requireAuth = requireAuth;
const requireAdmin = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: 'Unauthorized: User not authenticated' });
            return;
        }
        if (user.role !== 'admin') {
            res.status(403).json({ error: 'Forbidden: Admin access required' });
            return;
        }
        next();
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error checking admin status' });
    }
};
exports.requireAdmin = requireAdmin;
//# sourceMappingURL=auth.middleware.js.map