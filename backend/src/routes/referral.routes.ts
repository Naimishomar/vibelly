import express from 'express';
import User from '../models/User';
import { requireAuth } from '../middlewares/auth.middleware';
import { ensureReferralCode, claimReferral, REWARD_DAYS_PER_REFERRAL } from '../services/referral.service';

const router = express.Router();

// Get my referral code, link and stats
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const code = await ensureReferralCode(userId);
    const user = await User.findById(userId).select('referralCode referralCount referralRewardDays premiumStatus premiumExpiryDate name username');

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
        rewardPerReferral: REWARD_DAYS_PER_REFERRAL
      }
    });
  } catch (error) {
    console.error('Error fetching referral info:', error);
    res.status(500).json({ error: 'Failed to fetch referral info' });
  }
});

// Claim a pending referral (from ?ref=CODE captured at signup/login)
router.post('/claim', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Referral code is required' });
    }

    const userId = (req as any).user.id;
    const result = await claimReferral(userId, code);

    const refreshed = await User.findById(userId).select('premiumStatus premiumExpiryDate referralCode referralCount referralRewardDays');

    res.json({
      success: true,
      rewardDays: result.rewardDays,
      user: refreshed
    });
  } catch (error: any) {
    console.error('Error claiming referral:', error);
    res.status(400).json({ error: error?.message || 'Failed to claim referral' });
  }
});

export default router;
