"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const referral_service_1 = require("../services/referral.service");
const router = express_1.default.Router();
// Get my referral code, link and stats
router.get('/me', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const code = await (0, referral_service_1.ensureReferralCode)(userId);
        const user = await User_1.default.findById(userId).select('referralCode referralCount referralRewardDays premiumStatus premiumExpiryDate name username');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            success: true,
            referral: {
                code,
                link: `${process.env.FRONTEND_URL || 'https://vibelly.fun'}/?ref=${code}`,
                count: user.referralCount || 0,
                rewardDays: user.referralRewardDays || 0,
                rewardPerReferral: referral_service_1.REWARD_DAYS_PER_REFERRAL
            }
        });
    }
    catch (error) {
        console.error('Error fetching referral info:', error);
        res.status(500).json({ error: 'Failed to fetch referral info' });
    }
});
// Claim a pending referral (from ?ref=CODE captured at signup/login)
router.post('/claim', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { code } = req.body;
        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Referral code is required' });
        }
        const userId = req.user.id;
        const result = await (0, referral_service_1.claimReferral)(userId, code);
        const refreshed = await User_1.default.findById(userId).select('premiumStatus premiumExpiryDate referralCode referralCount referralRewardDays');
        res.json({
            success: true,
            rewardDays: result.rewardDays,
            user: refreshed
        });
    }
    catch (error) {
        console.error('Error claiming referral:', error);
        res.status(400).json({ error: error?.message || 'Failed to claim referral' });
    }
});
exports.default = router;
//# sourceMappingURL=referral.routes.js.map