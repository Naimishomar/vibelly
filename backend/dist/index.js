"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const env_1 = require("./config/env");
// Import socket handlers
require("./socket/presence");
require("./socket/matchmaking");
require("./socket/webrtc");
require("./socket/chat");
require("./socket/groupChat");
require("./socket/live");
const start = async () => {
    await (0, server_1.connectDB)();
    await (0, server_1.connectRedis)();
    // Clear stale online users on server boot
    try {
        await server_1.redisClient.del('online:users');
        console.log('🧹 Cleared stale online users from Redis');
    }
    catch (err) {
        console.error('Failed to clear stale users:', err);
    }
    server_1.httpServer.listen(env_1.ENV.PORT, () => {
        console.log(`Server is running on port ${env_1.ENV.PORT}`);
    });
};
start();
//# sourceMappingURL=index.js.map