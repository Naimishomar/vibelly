"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("../server");
const matchmaking_1 = require("../redis/matchmaking");
const User_1 = __importDefault(require("../models/User"));
const premium_1 = require("../utils/premium");
server_1.io.on('connection', (socket) => {
    socket.on('search', async (data) => {
        const { userId, queueName = 'random-video-480', targetCountry, previousPeerSocketId } = data;
        let { targetGender } = data;
        // Security Check: Validate premium status for gender filtering
        if (targetGender && targetGender !== 'random') {
            try {
                if (!userId || userId.startsWith('guest-')) {
                    targetGender = undefined; // Guests cannot use gender filter
                }
                else {
                    const user = await User_1.default.findById(userId).select('premiumStatus premiumExpiryDate');
                    if (!(0, premium_1.isPremiumActive)(user)) {
                        targetGender = undefined; // Non-premium (or expired) users cannot use gender filter
                    }
                }
            }
            catch (err) {
                console.error('Error validating premium status for gender filter:', err);
                targetGender = undefined; // Fail safe
            }
        }
        console.log(`User ${userId} started searching in ${queueName} with targetCountry ${targetCountry || 'global'} and targetGender ${targetGender || 'default'}`);
        await (0, matchmaking_1.removeFromQueue)(socket.id, queueName);
        await (0, matchmaking_1.addToQueue)(socket.id, userId, queueName, targetCountry, targetGender, previousPeerSocketId);
    });
    socket.on('cancel-search', async (data) => {
        const { queueName = 'random-video-480' } = data;
        console.log(`User ${socket.id} cancelled search`);
        await (0, matchmaking_1.removeFromQueue)(socket.id, queueName);
    });
    socket.on('skip', async (data) => {
        const { peerSocketId } = data;
        server_1.io.to(peerSocketId).emit('partner-disconnected');
        const { redisClient } = require('../server');
        await redisClient.del(`activeMatch:${socket.id}`);
        await redisClient.del(`activeMatch:${peerSocketId}`);
    });
    socket.on('disconnect', async () => {
        console.log('User disconnected:', socket.id);
        const { redisClient } = require('../server');
        const peerSocketId = await redisClient.get(`activeMatch:${socket.id}`);
        if (peerSocketId) {
            server_1.io.to(peerSocketId).emit('partner-disconnected');
            await redisClient.del(`activeMatch:${socket.id}`);
            await redisClient.del(`activeMatch:${peerSocketId}`);
        }
        await (0, matchmaking_1.removeFromQueue)(socket.id, 'random-video-480');
        await (0, matchmaking_1.removeFromQueue)(socket.id, 'random-audio');
        await (0, matchmaking_1.removeFromQueue)(socket.id, 'random-video-480-v2');
        await (0, matchmaking_1.removeFromQueue)(socket.id, 'random-audio-v2');
        await (0, matchmaking_1.removeFromQueue)(socket.id, 'random-text');
    });
});
//# sourceMappingURL=matchmaking.js.map