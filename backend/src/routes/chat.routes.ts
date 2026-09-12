import { Router } from 'express';
import { redisClient } from '../server';
import { requireAuth } from '../middlewares/auth.middleware';
import User from '../models/User';

const router = Router();

// GET /api/chat/online - Fetch all online users
router.get('/online', async (req, res) => {
  try {
    const rawUsers = await redisClient.hvals('online:users');
    
    // Upstash sometimes returns parsed JSON directly. Let's ensure everything is parsed.
    const onlineUsers = rawUsers.map((user: any) => {
      if (typeof user === 'string') {
        try { return JSON.parse(user); } catch (e) { return user; }
      }
      return user;
    });

    res.json({ onlineUsers });
  } catch (error) {
    console.error('Error fetching online users:', error);
    res.status(500).json({ error: 'Failed to fetch online users' });
  }
});

// GET /api/chat/inbox - Fetch recent chat partners
router.get('/inbox', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    // Auto-remove expired chats (older than 24h)
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    await redisClient.zremrangebyscore(`inbox:${userId}`, 0, twentyFourHoursAgo);

    // Get remaining recent chats (sorted by most recent first)
    // ZRANGE with rev: true returns array of member strings
    const recentUserIds = (await redisClient.zrange(`inbox:${userId}`, 0, -1, { rev: true })) as string[];
    
    if (!recentUserIds || recentUserIds.length === 0) {
      return res.json({ inbox: [] });
    }

    // Fetch user details from MongoDB
    const users = await User.find({ _id: { $in: recentUserIds } })
      .select('_id name username profileImage premiumStatus')
      .lean();

    // Map the users to match the sorted order from Redis
    const inbox = recentUserIds.map(id => users.find(u => u._id.toString() === id)).filter(Boolean);

    res.json({ inbox });
  } catch (error) {
    console.error('Error fetching inbox:', error);
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});

function canAccessConversation(req: any, userId: string, peerId: string): boolean {
  const authenticatedUser = req.user;
  const requesterIds = new Set([
    authenticatedUser?._id?.toString(),
    authenticatedUser?.id?.toString(),
    authenticatedUser?.username,
  ].filter(Boolean));
  return requesterIds.has(userId) || requesterIds.has(peerId);
}

// GET /api/chat/history/:userId/:peerId - Fetch up to 25 latest messages
router.get('/history/:userId/:peerId', requireAuth, async (req, res) => {
  try {
    const userId = String(req.params.userId);
    const peerId = String(req.params.peerId);
    if (!canAccessConversation(req, userId, peerId)) {
      res.status(403).json({ error: 'Forbidden: You are not part of this conversation' });
      return;
    }
    const conversationKey = `chat:${[userId, peerId].sort().join(':')}`;

    // Get all messages from the list (which is capped at 25 anyway)
    const rawMessages = await redisClient.lrange(conversationKey, 0, -1);
    
    const messages = rawMessages.map(msg => {
       if (typeof msg === 'string') {
           try { return JSON.parse(msg); } catch(e) { return msg; }
       }
       return msg;
    });

    // Messages are LPUSHed, so index 0 is the newest. We want chronological order (oldest first)
    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// DELETE /api/chat/history/:userId/:peerId - Clear chat history between two users
router.delete('/history/:userId/:peerId', requireAuth, async (req, res) => {
  try {
    const userId = String(req.params.userId);
    const peerId = String(req.params.peerId);
    if (!canAccessConversation(req, userId, peerId)) {
      res.status(403).json({ error: 'Forbidden: You are not part of this conversation' });
      return;
    }
    const conversationKey = `chat:${[userId, peerId].sort().join(':')}`;
    
    await redisClient.del(conversationKey);
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

// GET /api/chat/groups - Fetch all active group rooms
router.get('/groups', async (req, res) => {
  try {
    const keys = await redisClient.keys('group:msgs:*');
    const groups = keys.map((key: string) => {
      const roomId = key.replace('group:msgs:', '');
      return { roomId };
    });
    res.json({ groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

export default router;
