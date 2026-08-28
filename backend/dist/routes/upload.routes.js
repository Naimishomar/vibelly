"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const r2_service_1 = require("../services/r2.service");
const User_1 = __importDefault(require("../models/User"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const server_1 = require("../server");
const router = (0, express_1.Router)();
// Multer memory storage config (max 10MB)
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only images and videos are allowed.'));
        }
    },
});
// Profile Photo Upload (Persistent)
router.post('/profile', auth_middleware_1.requireAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: 'No file provided' });
        const result = await (0, r2_service_1.uploadToR2)(req.file, 'profiles');
        // Update user document
        await User_1.default.findByIdAndUpdate(req.user.id, { profileImage: result.url });
        res.json({ url: result.url });
    }
    catch (error) {
        console.error('[Upload Profile]', error);
        res.status(500).json({ error: 'Failed to upload profile photo' });
    }
});
// Creator gallery photo upload (Persistent)
router.post('/creator-gallery', auth_middleware_1.requireAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: 'No file provided' });
        const result = await (0, r2_service_1.uploadToR2)(req.file, 'creators');
        res.json({ url: result.url });
    }
    catch (error) {
        console.error('[Upload Creator Gallery]', error);
        res.status(500).json({ error: 'Failed to upload photo' });
    }
});
// Creator verification files (selfie + ID). Stored persistently for manual review.
router.post('/verification', auth_middleware_1.requireAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: 'No file provided' });
        const result = await (0, r2_service_1.uploadToR2)(req.file, 'verification');
        res.json({ url: result.url });
    }
    catch (error) {
        console.error('[Upload Verification]', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});
// Live stream thumbnail upload (Persistent)
router.post('/thumbnail', auth_middleware_1.requireAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: 'No file provided' });
        const result = await (0, r2_service_1.uploadToR2)(req.file, 'thumbnails');
        res.json({ url: result.url });
    }
    catch (error) {
        console.error('[Upload Thumbnail]', error);
        res.status(500).json({ error: 'Failed to upload thumbnail' });
    }
});
// Group Photo Upload (Persistent)
router.post('/group', auth_middleware_1.requireAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: 'No file provided' });
        const result = await (0, r2_service_1.uploadToR2)(req.file, 'groups');
        res.json({ url: result.url });
    }
    catch (error) {
        console.error('[Upload Group]', error);
        res.status(500).json({ error: 'Failed to upload group photo' });
    }
});
// Ephemeral Chat/Call Attachment Upload (Auto-deleted on fixed 6-hour schedule)
router.post('/ephemeral', auth_middleware_1.requireAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: 'No file provided' });
        const result = await (0, r2_service_1.uploadToR2)(req.file, 'ephemeral');
        // Add to a global Redis Set for the cron job to sweep
        await server_1.redisClient.sadd('ephemeral:media:batch', result.s3Key);
        res.json({ url: result.url });
    }
    catch (error) {
        console.error('[Upload Ephemeral]', error);
        res.status(500).json({ error: error.message || 'Failed to upload file' });
    }
});
// Creator post photos upload — up to 3 images, compressed via sharp
router.post('/post-photos', auth_middleware_1.requireAuth, upload.array('files', 3), async (req, res) => {
    try {
        const files = req.files || [];
        if (!files.length)
            return res.status(400).json({ error: 'No files provided' });
        if (files.length > 3)
            return res.status(400).json({ error: 'Maximum 3 photos per post' });
        const results = await Promise.all(files.map((f) => (0, r2_service_1.uploadToR2WithCompression)(f)));
        res.json({
            urls: results.map((r) => r.url),
            keys: results.map((r) => r.s3Key),
        });
    }
    catch (error) {
        console.error('[Upload Post Photos]', error);
        res.status(500).json({ error: error.message || 'Failed to upload post photos' });
    }
});
exports.default = router;
//# sourceMappingURL=upload.routes.js.map