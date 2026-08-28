"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const Report_1 = __importDefault(require("../models/Report"));
const router = express_1.default.Router();
router.put('/profile', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { gender, country } = req.body;
        const user = await User_1.default.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (gender)
            user.gender = gender;
        if (country)
            user.country = country;
        await user.save();
        res.json({ success: true, user });
    }
    catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});
// Endpoint to fetch current user profile
router.get('/me', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ success: true, user });
    }
    catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});
// Endpoint to report a user / stream
router.post('/report', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { reportedUserId, reason, type, roomCode, streamTitle, amountPaid } = req.body;
        const reporterId = req.user.id;
        if (!reportedUserId) {
            return res.status(400).json({ error: 'Reported user ID is required' });
        }
        const report = new Report_1.default({
            reporter: reporterId,
            reportedUser: reportedUserId,
            reason: reason || 'Inappropriate behavior',
            type: type || 'call',
            roomCode: roomCode || '',
            streamTitle: streamTitle || '',
            amountPaid: amountPaid || undefined,
        });
        await report.save();
        res.json({ success: true, message: 'Report submitted successfully' });
    }
    catch (error) {
        console.error('Error reporting user:', error);
        res.status(500).json({ error: 'Failed to report user' });
    }
});
// Endpoint to search users by username or name
router.get('/search', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.json({ users: [] });
        }
        // Perform case-insensitive regex search
        const users = await User_1.default.find({
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { name: { $regex: q, $options: 'i' } }
            ],
            isBanned: false
        })
            .select('_id name username profileImage premiumStatus')
            .limit(20)
            .lean();
        res.json({ users });
    }
    catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});
exports.default = router;
//# sourceMappingURL=user.routes.js.map