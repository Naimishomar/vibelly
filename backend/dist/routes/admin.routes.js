"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const User_1 = __importDefault(require("../models/User"));
const Report_1 = __importDefault(require("../models/Report"));
const Session_1 = __importDefault(require("../models/Session"));
const router = (0, express_1.Router)();
// GET /api/admin/users
router.get('/users', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, async (req, res) => {
    try {
        const users = await User_1.default.find({}).select('-password -__v').sort({ createdAt: -1 });
        res.json(users);
    }
    catch (error) {
        console.error('Error fetching users for admin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/admin/users/:id/ban
router.post('/users/:id/ban', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, async (req, res) => {
    try {
        const { action } = req.body; // 'ban' or 'unban'
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.isBanned = action === 'ban';
        await user.save();
        res.json({ success: true, isBanned: user.isBanned });
    }
    catch (error) {
        console.error('Error updating ban status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/admin/reports
router.get('/reports', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, async (req, res) => {
    try {
        const reports = await Report_1.default.find({})
            .populate('reporter', 'name username email profileImage isBanned')
            .populate('reportedUser', 'name username email profileImage isBanned')
            .sort({ createdAt: -1 })
            .lean();
        // Fetch related session data for each report
        const reportsWithSessions = await Promise.all(reports.map(async (report) => {
            const reporterId = report.reporter?._id?.toString();
            const reportedUserId = report.reportedUser?._id?.toString();
            if (reporterId && reportedUserId) {
                const sessions = await Session_1.default.find({
                    $or: [
                        { user1: reporterId, user2: reportedUserId },
                        { user1: reportedUserId, user2: reporterId }
                    ]
                }).sort({ startedAt: -1 }).limit(10).lean();
                return { ...report, sessions };
            }
            return { ...report, sessions: [] };
        }));
        res.json(reportsWithSessions);
    }
    catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/admin/analytics
router.get('/analytics', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const { redisClient } = require('../server');
        const uniqueVisitsToday = await redisClient.pfcount(`visits:${today}`);
        res.json({ uniqueVisitsToday });
    }
    catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/admin/settings
router.get('/settings', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, async (req, res) => {
    try {
        const { redisClient } = require('../server');
        const guestAccessEnabled = await redisClient.get('appSettings:guestAccessEnabled');
        res.json({
            guestAccessEnabled: guestAccessEnabled === null ? true : guestAccessEnabled === 'true' || guestAccessEnabled === true
        });
    }
    catch (error) {
        console.error('Error fetching admin settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/admin/settings
router.post('/settings', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, async (req, res) => {
    try {
        const { redisClient } = require('../server');
        const { guestAccessEnabled } = req.body;
        if (typeof guestAccessEnabled === 'boolean') {
            await redisClient.set('appSettings:guestAccessEnabled', guestAccessEnabled ? 'true' : 'false');
        }
        res.json({ success: true, guestAccessEnabled });
    }
    catch (error) {
        console.error('Error updating admin settings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.routes.js.map