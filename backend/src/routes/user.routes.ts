import express from 'express';
import User from '../models/User';
import { requireAuth } from '../middlewares/auth.middleware';
import Report from '../models/Report';

const router = express.Router();

router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { gender, country } = req.body;
    
    const user = await User.findById((req as any).user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (gender) user.gender = gender;
    if (country) user.country = country;

    await user.save();

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Endpoint to fetch current user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById((req as any).user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Endpoint to report a user / stream
router.post('/report', requireAuth, async (req, res) => {
  try {
    const { reportedUserId, reason, type, roomCode, streamTitle, amountPaid } = req.body;
    const reporterId = (req as any).user.id;

    if (!reportedUserId) {
      return res.status(400).json({ error: 'Reported user ID is required' });
    }

    const report = new Report({
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
  } catch (error) {
    console.error('Error reporting user:', error);
    res.status(500).json({ error: 'Failed to report user' });
  }
});

// Endpoint to search users by username or name
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.json({ users: [] });
    }
    
    // Perform case-insensitive regex search
    const users = await User.find({
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
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

export default router;
