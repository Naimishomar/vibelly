import { httpServer, connectDB, connectRedis, redisClient } from './server';
import { ENV } from './config/env';

// Import socket handlers
import './socket/presence';
import './socket/matchmaking';
import './socket/webrtc';
import './socket/chat';
import './socket/groupChat';
import './socket/live';

const start = async () => {
  await connectDB();
  await connectRedis();

  // Clear stale online users on server boot
  try {
    await redisClient.del('online:users');
    console.log('🧹 Cleared stale online users from Redis');
  } catch (err) {
    console.error('Failed to clear stale users:', err);
  }

  httpServer.listen(ENV.PORT, () => {
    console.log(`Server is running on port ${ENV.PORT}`);
  });
};

start();
