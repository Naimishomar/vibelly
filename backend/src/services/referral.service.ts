import User from '../models/User';
import { Types } from 'mongoose';

export const REWARD_DAYS_PER_REFERRAL = 3;

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

const randomCode = (length = 8) => {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
};

export const ensureReferralCode = async (userId: string): Promise<string> => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (user.referralCode) return user.referralCode;

  let code = randomCode();
  // Extremely unlikely collision, but loop just in case
  for (let i = 0; i < 5 && (await User.findOne({ referralCode: code })); i++) {
    code = randomCode();
  }

  user.referralCode = code;
  await user.save();
  return code;
};

/**
 * Extend a user's premium by `days`. Persists and also bumps `premiumStatus`.
 */
export const grantPremiumDays = async (userId: string, days: number) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const now = Date.now();
  const base = user.premiumStatus && user.premiumExpiryDate
    ? Math.max(user.premiumExpiryDate.getTime(), now)
    : now;
  user.premiumExpiryDate = new Date(base + days * 24 * 60 * 60 * 1000);
  user.premiumStatus = true;
  await user.save();
  return user;
};

/**
 * Claim a referral: called by a newly-registered (or first-time) user
 * right after auth. Rewards BOTH the referrer and the referred user.
 */
export const claimReferral = async (userId: string, code: string) => {
  const normalized = code.trim();

  const referred = await User.findById(userId);
  if (!referred) throw new Error('User not found');
  if (referred.referredBy) throw new Error('Referral already claimed');

  const referrer = await User.findOne({ referralCode: normalized });
  if (!referrer) throw new Error('Invalid referral code');

  if (String(referrer._id) === String(referred._id)) {
    throw new Error('You cannot refer yourself');
  }

  referred.referredBy = new Types.ObjectId(referrer._id);
  await referred.save();

  referrer.referralCount = (referrer.referralCount || 0) + 1;
  referrer.referralRewardDays = (referrer.referralRewardDays || 0) + REWARD_DAYS_PER_REFERRAL;
  await referrer.save();

  // Grant premium to both sides
  await grantPremiumDays(referred._id.toString(), REWARD_DAYS_PER_REFERRAL);
  await grantPremiumDays(referrer._id.toString(), REWARD_DAYS_PER_REFERRAL);

  return { referred, referrer, rewardDays: REWARD_DAYS_PER_REFERRAL };
};
