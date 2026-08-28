"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refresh = exports.login = void 0;
const User_1 = __importDefault(require("../models/User"));
const jwt_1 = require("../utils/jwt");
// Mocked Email OTP / Login for development
const login = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }
        let user = await User_1.default.findOne({ email });
        if (!user) {
            // Auto-register for mocked flow
            const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
            user = new User_1.default({
                name: email.split('@')[0],
                username,
                email,
            });
            await user.save();
        }
        const tokens = (0, jwt_1.generateTokens)(user);
        res.json({ user, ...tokens });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.login = login;
const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token required' });
            return;
        }
        const decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
        const user = await User_1.default.findById(decoded.id);
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        const tokens = (0, jwt_1.generateTokens)(user);
        res.json({ ...tokens });
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
};
exports.refresh = refresh;
//# sourceMappingURL=auth.controller.js.map