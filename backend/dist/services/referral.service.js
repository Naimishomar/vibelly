"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimReferral = exports.grantPremiumDays = exports.ensureReferralCode = exports.REWARD_DAYS_PER_REFERRAL = void 0;
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = require("mongoose");
exports.REWARD_DAYS_PER_REFERRAL = 3;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const randomCode = (length = 8) => {
    let code = '';
    for (let i = 0; i < length; i++) {
        code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return code;
};
const ensureReferralCode = async (userId) => {
    const user = await User_1.default.findById(userId);
    if (!user)
        throw new Error('User not found');
    if (user.referralCode)
        return user.referralCode;
    let code = randomCode();
    // Extremely unlikely collision, but loop just in case
    for (let i = 0; i < 5 && (await User_1.default.findOne({ referralCode: code })); i++) {
        code = randomCode();
    }
    user.referralCode = code;
    await user.save();
    return code;
};
exports.ensureReferralCode = ensureReferralCode;
/**
 * Extend a user's premium by `days`. Persists and also bumps `premiumStatus`.
 */
const grantPremiumDays = async (userId, days) => {
    const user = await User_1.default.findById(userId);
    if (!user)
        return null;
    const now = Date.now();
    const base = user.premiumStatus && user.premiumExpiryDate
        ? Math.max(user.premiumExpiryDate.getTime(), now)
        : now;
    user.premiumExpiryDate = new Date(base + days * 24 * 60 * 60 * 1000);
    user.premiumStatus = true;
    await user.save();
    return user;
};
exports.grantPremiumDays = grantPremiumDays;
/**
 * Claim a referral: called by a newly-registered (or first-time) user
 * right after auth. Rewards BOTH the referrer and the referred user.
 */
const claimReferral = async (userId, code) => {
    const normalized = code.trim();
    const referred = await User_1.default.findById(userId);
    if (!referred)
        throw new Error('User not found');
    if (referred.referredBy)
        throw new Error('Referral already claimed');
    const referrer = await User_1.default.findOne({ referralCode: normalized });
    if (!referrer)
        throw new Error('Invalid referral code');
    if (String(referrer._id) === String(referred._id)) {
        throw new Error('You cannot refer yourself');
    }
    referred.referredBy = new mongoose_1.Types.ObjectId(referrer._id);
    await referred.save();
    referrer.referralCount = (referrer.referralCount || 0) + 1;
    referrer.referralRewardDays = (referrer.referralRewardDays || 0) + exports.REWARD_DAYS_PER_REFERRAL;
    await referrer.save();
    // Grant premium to both sides
    await (0, exports.grantPremiumDays)(referred._id.toString(), exports.REWARD_DAYS_PER_REFERRAL);
    await (0, exports.grantPremiumDays)(referrer._id.toString(), exports.REWARD_DAYS_PER_REFERRAL);
    return { referred, referrer, rewardDays: exports.REWARD_DAYS_PER_REFERRAL };
};
exports.claimReferral = claimReferral;
//# sourceMappingURL=referral.service.js.map