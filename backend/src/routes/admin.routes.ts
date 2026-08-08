import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';
import User from '../models/User';
import Report from '../models/Report';
import Session from '../models/Session';
import CreatorProfile from '../models/CreatorProfile';

const router = Router();

// GET /api/admin/users
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password -__v').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/users/:id/ban
router.post('/users/:id/ban', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { action } = req.body; // 'ban' or 'unban'
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.isBanned = action === 'ban';
    await user.save();
    
    res.json({ success: true, isBanned: user.isBanned });
  } catch (error) {
    console.error('Error updating ban status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/reports
router.get('/reports', requireAuth, requireAdmin, async (req, res) => {
  try {
    const reports = await Report.find({})
      .populate('reporter', 'name username email profileImage isBanned')
      .populate('reportedUser', 'name username email profileImage isBanned')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch related session data for each report
    const reportsWithSessions = await Promise.all(reports.map(async (report: any) => {
      const reporterId = report.reporter?._id?.toString();
      const reportedUserId = report.reportedUser?._id?.toString();

      if (reporterId && reportedUserId) {
        const sessions = await Session.find({
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
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/analytics
router.get('/analytics', requireAuth, requireAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { redisClient } = require('../server');
    const uniqueVisitsToday = await redisClient.pfcount(`visits:${today}`);
    
    res.json({ uniqueVisitsToday });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/settings
router.get('/settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { redisClient } = require('../server');
    const guestAccessEnabled = await redisClient.get('appSettings:guestAccessEnabled');
    
    res.json({ 
      guestAccessEnabled: guestAccessEnabled === null ? true : guestAccessEnabled === 'true' || guestAccessEnabled === true
    });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/settings
router.post('/settings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { redisClient } = require('../server');
    const { guestAccessEnabled } = req.body;
    
    if (typeof guestAccessEnabled === 'boolean') {
      await redisClient.set('appSettings:guestAccessEnabled', guestAccessEnabled ? 'true' : 'false');
    }
    
    res.json({ success: true, guestAccessEnabled });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
