import { Router } from 'express';
import User from '../models/User';
import CreatorProfile from '../models/CreatorProfile';
import CreatorPost from '../models/CreatorPost';
import Follow from '../models/Follow';
import { requireAuth } from '../middlewares/auth.middleware';
import { getAllLiveRooms } from '../socket/liveRooms';
import { deleteFromR2 } from '../services/r2.service';


const router = Router();

const ensureProfile = async (userId: string) => {
  let profile = await CreatorProfile.findOne({ user: userId });
  if (!profile) {
    profile = await CreatorProfile.create({ user: userId });
  }
  return profile;
};

const serializeProfile = async (profile: any, viewerId?: string) => {
  const user = await User.findById(profile.user).select('_id name username profileImage premiumStatus role isBanned');
  const [followerCount, followingCount, isFollowing] = await Promise.all([
    Follow.countDocuments({ following: profile.user }),
    Follow.countDocuments({ follower: profile.user }),
    viewerId ? Follow.exists({ follower: viewerId, following: profile.user }) : Promise.resolve(null),
  ]);
  return {
    _id: profile._id,
    user,
    bio: profile.bio,
    coverImage: profile.coverImage,
    galleryPhotos: profile.galleryPhotos,
    subscriptionPrice: profile.subscriptionPrice,
    isVerified: profile.verification.status === 'approved',
    verificationStatus: profile.verification.status,
    followerCount,
    followingCount,
    isFollowing: !!isFollowing,
  };
};

// Get a creator's public profile
router.get('/:userId', async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const profile = await ensureProfile(req.params.userId);

    // Optional: pass viewer id via query for follow state (no auth required for public view)
    const data = await serializeProfile(profile, req.query.viewerId ? String(req.query.viewerId) : undefined);
    res.json({ profile: data });
  } catch (error) {
    console.error('[Creator profile]', error);
    res.status(500).json({ error: 'Failed to load creator profile' });
  }
});

// Get the signed-in user's own creator profile
router.get('/me/profile', requireAuth, async (req, res) => {
  try {
    console.log('[Creator me] User ID:', (req as any).user.id, 'Auth header:', req.headers.authorization?.substring(0, 20) + '...');
    const profile = await ensureProfile((req as any).user.id);
    console.log('[Creator me] Profile created/found:', profile._id);
    const data = await serializeProfile(profile, (req as any).user.id);
    res.json({ profile: data });
  } catch (error) {
    console.error('[Creator me]', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// Update creator profile (bio, cover, subscription price)
router.put('/me/profile', requireAuth, async (req, res) => {
  try {
    const { bio, coverImage, subscriptionPrice } = req.body;
    const profile = await ensureProfile((req as any).user.id);

    if (typeof bio === 'string') profile.bio = bio.slice(0, 500);
    if (typeof coverImage === 'string') profile.coverImage = coverImage;
    if (typeof subscriptionPrice === 'number') {
      profile.subscriptionPrice = Math.max(0, Math.floor(subscriptionPrice));
    }

    await profile.save();
    const data = await serializeProfile(profile, (req as any).user.id);
    res.json({ success: true, profile: data });
  } catch (error) {
    console.error('[Creator update]', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Add a gallery photo (URL produced by upload endpoint)
router.post('/me/gallery', requireAuth, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Photo URL is required' });

    const profile = await ensureProfile((req as any).user.id);
    if (profile.galleryPhotos.length >= 12) {
      return res.status(400).json({ error: 'Maximum 12 photos allowed' });
    }
    profile.galleryPhotos.push(url);
    await profile.save();
    res.json({ success: true, galleryPhotos: profile.galleryPhotos });
  } catch (error) {
    console.error('[Creator gallery add]', error);
    res.status(500).json({ error: 'Failed to add photo' });
  }
});

// Remove a gallery photo
router.delete('/me/gallery', requireAuth, async (req, res) => {
  try {
    const { url } = req.body;
    const profile = await ensureProfile((req as any).user.id);
    profile.galleryPhotos = profile.galleryPhotos.filter((p: string) => p !== url);
    await profile.save();
    res.json({ success: true, galleryPhotos: profile.galleryPhotos });
  } catch (error) {
    console.error('[Creator gallery remove]', error);
    res.status(500).json({ error: 'Failed to remove photo' });
  }
});

// Submit verification (selfie + ID). Photos must be uploaded first via /api/upload/verification.
router.post('/me/verify', requireAuth, async (req, res) => {
  try {
    const { selfieUrl, idUrl } = req.body;
    if (!selfieUrl || !idUrl) {
      return res.status(400).json({ error: 'Both selfie and ID photos are required' });
    }
    const profile = await ensureProfile((req as any).user.id);
    if (profile.verification.status === 'pending') {
      return res.status(400).json({ error: 'Verification already in review' });
    }
    profile.verification = {
      status: 'pending',
      selfieUrl,
      idUrl,
      submittedAt: new Date(),
    };
    await profile.save();
    res.json({ success: true, verificationStatus: 'pending' });
  } catch (error) {
    console.error('[Creator verify]', error);
    res.status(500).json({ error: 'Failed to submit verification' });
  }
});

// List active live streams by a creator
router.get('/streams/:userId', async (req, res) => {
  try {
    const rooms = getAllLiveRooms().filter((r) => r.creatorUserId === String(req.params.userId || ''));
    res.json({
      streams: rooms.map((r) => ({
        roomCode: r.roomCode,
        title: r.title,
        creatorName: r.creatorName,
        creatorProfileImage: r.creatorProfileImage || '',
        creatorUserId: r.creatorUserId || '',
        thumbnail: r.thumbnail || '',
        price: r.price,
        isPrivate: r.isPrivate || false,
        viewerCount: r.viewers.size,
      })),
    });
  } catch (error) {
    console.error('[Creator streams]', error);
    res.status(500).json({ error: 'Failed to load streams' });
  }
});

// Follow a creator
router.post('/follow/:userId', requireAuth, async (req, res) => {
  try {
    const follower = (req as any).user.id;
    const following = String(req.params.userId || '');
    if (follower === following) return res.status(400).json({ error: 'You cannot follow yourself' });

    const target = await User.findById(following);
    if (!target) return res.status(404).json({ error: 'User not found' });

    const existing = await Follow.findOne({ follower, following });
    if (!existing) {
      await Follow.create({ follower, following });
    }
    const followerCount = await Follow.countDocuments({ following });
    res.json({ success: true, isFollowing: true, followerCount });
  } catch (error) {
    console.error('[Follow]', error);
    res.status(500).json({ error: 'Failed to follow' });
  }
});

// Unfollow a creator
router.delete('/follow/:userId', requireAuth, async (req, res) => {
  try {
    const follower = (req as any).user.id;
    const following = String(req.params.userId || '');
    await Follow.deleteOne({ follower, following });
    const followerCount = await Follow.countDocuments({ following });
    res.json({ success: true, isFollowing: false, followerCount });
  } catch (error) {
    console.error('[Unfollow]', error);
    res.status(500).json({ error: 'Failed to unfollow' });
  }
});

// ─────────────────────────────────────────────────────────────────
// CREATOR POSTS
// ─────────────────────────────────────────────────────────────────

// GET /posts/:userId — paginated posts for a creator (public)
router.get('/posts/:userId', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = 12;
    const skip = (page - 1) * limit;

    const posts = await CreatorPost.find({ creator: String(req.params.userId || '') })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('creator', '_id name username profileImage')
      .populate('comments.user', '_id name username profileImage')
      .lean();

    const total = await CreatorPost.countDocuments({ creator: String(req.params.userId || '') });

    res.json({ posts, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[Posts GET]', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// POST /posts — create a new post (auth required)
router.post('/posts', requireAuth, async (req, res) => {
  try {
    const { images, imageKeys, caption } = req.body;
    if (!Array.isArray(images) || images.length < 1 || images.length > 3) {
      return res.status(400).json({ error: 'Provide 1-3 image URLs' });
    }
    const post = await CreatorPost.create({
      creator: (req as any).user.id,
      images,
      imageKeys: imageKeys || [],
      caption: (caption || '').slice(0, 500),
    });
    await post.populate('creator', '_id name username profileImage');
    res.status(201).json({ success: true, post });
  } catch (error) {
    console.error('[Posts CREATE]', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// DELETE /posts/:postId — delete own post (deletes R2 images)
router.delete('/posts/:postId', requireAuth, async (req, res) => {
  try {
    const post = await CreatorPost.findById(String(req.params.postId || ''));
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (String(post.creator) !== (req as any).user.id) {
      return res.status(403).json({ error: 'Not your post' });
    }
    // Delete images from R2
    await Promise.all((post.imageKeys || []).map((key: string) => deleteFromR2(key)));
    await post.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error('[Posts DELETE]', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// POST /posts/:postId/like — toggle like
router.post('/posts/:postId/like', requireAuth, async (req, res) => {
  try {
    const post = await CreatorPost.findById(String(req.params.postId || ''));
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const userId = (req as any).user.id;
    const alreadyLiked = post.likes.some((id: any) => String(id) === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id: any) => String(id) !== userId);
    } else {
      post.likes.push(userId);
    }
    await post.save();
    res.json({ success: true, liked: !alreadyLiked, likeCount: post.likes.length });
  } catch (error) {
    console.error('[Posts LIKE]', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// POST /posts/:postId/comment — add a comment
router.post('/posts/:postId/comment', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    const post = await CreatorPost.findById(String(req.params.postId || ''));
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.comments.push({ user: (req as any).user.id, text: text.slice(0, 300) } as any);
    await post.save();
    await post.populate('comments.user', '_id name username profileImage');

    const newComment = post.comments[post.comments.length - 1];
    res.status(201).json({ success: true, comment: newComment });
  } catch (error) {
    console.error('[Posts COMMENT]', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// DELETE /posts/:postId/comment/:commentId — delete a comment (owner or post creator)
router.delete('/posts/:postId/comment/:commentId', requireAuth, async (req, res) => {
  try {
    const post = await CreatorPost.findById(String(req.params.postId || ''));
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const userId = (req as any).user.id;
    const comment = post.comments.find((c: any) => String(c._id) === String(req.params.commentId || ''));
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const isCommentOwner = String(comment.user) === userId;
    const isPostOwner = String(post.creator) === userId;
    if (!isCommentOwner && !isPostOwner) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    post.comments = post.comments.filter((c: any) => String(c._id) !== String(req.params.commentId || '')) as any;
    await post.save();
    res.json({ success: true });
  } catch (error) {
    console.error('[Posts DELETE COMMENT]', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;

