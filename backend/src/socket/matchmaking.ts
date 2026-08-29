import { io } from '../server';
import { addToQueue, removeFromQueue } from '../redis/matchmaking';
import User from '../models/User';
import { isPremiumActive } from '../utils/premium';

io.on('connection', (socket) => {
  socket.on('search', async (data) => {
    const { userId, queueName = 'random-video-480', targetCountry, previousPeerSocketId } = data;
    let { targetGender } = data;

    // Security Check: Validate premium status for gender filtering
    if (targetGender && targetGender !== 'random') {
      try {
        if (!userId || userId.startsWith('guest-')) {
          targetGender = undefined; // Guests cannot use gender filter
        } else {
          const user = await User.findById(userId).select('premiumStatus premiumExpiryDate');
          if (!isPremiumActive(user)) {
            targetGender = undefined; // Non-premium (or expired) users cannot use gender filter
          }
        }
      } catch (err) {
        console.error('Error validating premium status for gender filter:', err);
        targetGender = undefined; // Fail safe
      }
    }

    console.log(`User ${userId} started searching in ${queueName} with targetCountry ${targetCountry || 'global'} and targetGender ${targetGender || 'default'}`);
    await removeFromQueue(socket.id, queueName);
    await addToQueue(socket.id, userId, queueName, targetCountry, targetGender, previousPeerSocketId);
  });

  socket.on('cancel-search', async (data) => {
    const { queueName = 'random-video-480' } = data;
    console.log(`User ${socket.id} cancelled search`);
    await removeFromQueue(socket.id, queueName);
  });

  socket.on('skip', async (data) => {
    const { peerSocketId } = data;
    io.to(peerSocketId).emit('partner-disconnected');
    const { redisClient } = require('../server');
    await redisClient.del(`activeMatch:${socket.id}`);
    await redisClient.del(`activeMatch:${peerSocketId}`);
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    const { redisClient } = require('../server');
    const peerSocketId = await redisClient.get(`activeMatch:${socket.id}`);
    
    if (peerSocketId) {
      io.to(peerSocketId).emit('partner-disconnected');
      await redisClient.del(`activeMatch:${socket.id}`);
      await redisClient.del(`activeMatch:${peerSocketId}`);
    }
    
    await removeFromQueue(socket.id, 'random-video-480');
    await removeFromQueue(socket.id, 'random-audio');
    await removeFromQueue(socket.id, 'random-video-480-v2');
    await removeFromQueue(socket.id, 'random-audio-v2');
    await removeFromQueue(socket.id, 'random-text');
  });
});
