import { Router } from 'express';
import multer from 'multer';
import { uploadToR2 } from '../services/r2.service';
import User from '../models/User';
import { requireAuth } from '../middlewares/auth.middleware';
import { redisClient } from '../server';

const router = Router();

// Multer memory storage config (max 10MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  },
});

// Profile Photo Upload (Persistent)
router.post('/profile', requireAuth, upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const result = await uploadToR2(req.file, 'profiles');

    // Update user document
    await User.findByIdAndUpdate(req.user.id, { profileImage: result.url });

    res.json({ url: result.url });
  } catch (error) {
    console.error('[Upload Profile]', error);
    res.status(500).json({ error: 'Failed to upload profile photo' });
  }
});

// Creator gallery photo upload (Persistent)
router.post('/creator-gallery', requireAuth, upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const result = await uploadToR2(req.file, 'creators');
    res.json({ url: result.url });
  } catch (error) {
    console.error('[Upload Creator Gallery]', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Creator verification files (selfie + ID). Stored persistently for manual review.
router.post('/verification', requireAuth, upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const result = await uploadToR2(req.file, 'verification');
    res.json({ url: result.url });
  } catch (error) {
    console.error('[Upload Verification]', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Live stream thumbnail upload (Persistent)
router.post('/thumbnail', requireAuth, upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const result = await uploadToR2(req.file, 'thumbnails');
    res.json({ url: result.url });
  } catch (error) {
    console.error('[Upload Thumbnail]', error);
    res.status(500).json({ error: 'Failed to upload thumbnail' });
  }
});

// Group Photo Upload (Persistent)
router.post('/group', requireAuth, upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const result = await uploadToR2(req.file, 'groups');
    res.json({ url: result.url });
  } catch (error) {
    console.error('[Upload Group]', error);
    res.status(500).json({ error: 'Failed to upload group photo' });
  }
});

// Ephemeral Chat/Call Attachment Upload (Auto-deleted on fixed 6-hour schedule)
router.post('/ephemeral', requireAuth, upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const result = await uploadToR2(req.file, 'ephemeral');

    // Add to a global Redis Set for the cron job to sweep
    await redisClient.sadd('ephemeral:media:batch', result.s3Key);

    res.json({ url: result.url });
  } catch (error: any) {
    console.error('[Upload Ephemeral]', error);
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
});

export default router;
