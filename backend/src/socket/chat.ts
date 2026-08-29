import { io, redisClient } from '../server';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User';
import { isPremiumActive } from '../utils/premium';

io.on('connection', (socket) => {
  // Existing WebRTC in-session chat
  socket.on('send-message', (data) => {
    const { peerSocketId, message } = data;
    io.to(peerSocketId).emit('receive-message', { peerSocketId: socket.id, message, timestamp: new Date() });
  });

  socket.on('typing', (data) => {
    const { peerSocketId, isTyping } = data;
    io.to(peerSocketId).emit('typing', { peerSocketId: socket.id, isTyping });
  });

  // New Global Direct Messaging
  socket.on('send-direct-message', async (data) => {
    const { senderId, targetSocketId, targetUserId, message, attachmentUrl, attachmentType } = data;
    
    const msgObj = {
      id: uuidv4(),
      senderId,
      message,
      attachmentUrl,
      attachmentType,
      timestamp: new Date().toISOString()
    };

    // Save to Redis and check limits
    try {
      const senderUser = await User.findById(senderId);
      if (!senderUser) return;

      const conversationKey = `chat:${[senderId, targetUserId].sort().join(':')}`;
      const msgCount = await redisClient.llen(conversationKey);

      if (msgCount === 0 && !isPremiumActive(senderUser)) {
        // Reset check
        const now = new Date();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if (now.getTime() - new Date(senderUser.lastChatResetDate).getTime() > oneWeek) {
          senderUser.chatsThisWeek = 0;
          senderUser.lastChatResetDate = now;
        }

        if (senderUser.chatsThisWeek >= 2) {
          // Block message
          socket.emit('chat-error', { message: 'Free users can only start 2 new chats per week. Upgrade to Premium for unlimited chats.' });
          return;
        }

        senderUser.chatsThisWeek += 1;
        await senderUser.save();
      }

      // Look up target's socketId dynamically to ensure real-time delivery
      // even if the sender didn't have the target's socketId
      const onlineUsers = await redisClient.hvals('online:users');
      let actualTargetSocketId = targetSocketId;

      for (const rawUser of onlineUsers) {
        if (!rawUser) continue;
        const u = typeof rawUser === 'string' ? JSON.parse(rawUser) : rawUser;
        if (u.userId === targetUserId) {
          actualTargetSocketId = u.socketId;
          break;
        }
      }

      // Forward to recipient via Socket if they have an active socket
      if (actualTargetSocketId) {
        io.to(actualTargetSocketId).emit('receive-direct-message', msgObj);
      }
      
      // Push to the list (Upstash auto stringifies objects if using proper SDK, but we'll stringify to be safe)
      await redisClient.lpush(conversationKey, JSON.stringify(msgObj));
      
      // Cap the list at 25 messages (LTRIM 0 24)
      await redisClient.ltrim(conversationKey, 0, 24);
      
      // Reset TTL to 24 hours (86400 seconds) on every new message
      await redisClient.expire(conversationKey, 86400);

      // Add to Inbox Sorted Set with timestamp score
      const nowScore = Date.now();
      await redisClient.zadd(`inbox:${senderId}`, { score: nowScore, member: targetUserId });
      await redisClient.zadd(`inbox:${targetUserId}`, { score: nowScore, member: senderId });
      
      // Expire inbox keys after 24 hours of inactivity just in case
      await redisClient.expire(`inbox:${senderId}`, 86400);
      await redisClient.expire(`inbox:${targetUserId}`, 86400);
      
    } catch (error) {
      console.error('Failed to save direct message to Redis:', error);
    }
  });

  socket.on('direct-typing', async (data) => {
    const { targetUserId, isTyping, senderId } = data;
    try {
      // Find targetSocketId
      const onlineUsers = await redisClient.hvals('online:users');
      for (const rawUser of onlineUsers) {
        if (!rawUser) continue;
        const u = typeof rawUser === 'string' ? JSON.parse(rawUser) : rawUser;
        if (u.userId === targetUserId) {
          io.to(u.socketId).emit('receive-direct-typing', { senderId, isTyping });
          break;
        }
      }
    } catch (err) {
      console.error('Failed to forward typing event:', err);
    }
  });
});
