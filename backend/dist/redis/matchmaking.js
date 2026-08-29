"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromQueue = exports.addToQueue = void 0;
const server_1 = require("../server");
const uuid_1 = require("uuid");
const Session_1 = __importDefault(require("../models/Session"));
const User_1 = __importDefault(require("../models/User"));
const premium_1 = require("../utils/premium");
const addToQueue = async (socketId, userId, baseQueueName, targetCountry, targetGender, previousPeerSocketId) => {
    let userGender = 'unspecified';
    let isPremium = false;
    let myCountry = 'unspecified';
    if (!userId.startsWith('guest-')) {
        const user = await User_1.default.findById(userId);
        if (user) {
            userGender = user.gender || 'unspecified';
            isPremium = (0, premium_1.isPremiumActive)(user);
            myCountry = user.country || 'unspecified';
        }
    }
    // Determine which queues to check based on gender and premium status
    const oppositeGender = userGender === 'male' ? 'female' : 'male';
    let queuesToCheck = [];
    if (isPremium && targetGender) {
        if (targetGender === 'female') {
            queuesToCheck = [`${baseQueueName}:female`, `${baseQueueName}:unspecified`, `${baseQueueName}:male`];
        }
        else if (targetGender === 'male') {
            queuesToCheck = [`${baseQueueName}:male`, `${baseQueueName}:unspecified`, `${baseQueueName}:female`];
        }
        else {
            // random gender or unspecified user gender
            queuesToCheck = [`${baseQueueName}:male`, `${baseQueueName}:female`, `${baseQueueName}:unspecified`].sort(() => Math.random() - 0.5);
        }
    }
    else if (isPremium && userGender !== 'unspecified') {
        // Default Premium users with defined gender to opposite gender, fallback to others
        queuesToCheck = [`${baseQueueName}:${oppositeGender}`, `${baseQueueName}:unspecified`, `${baseQueueName}:${userGender}`];
    }
    else {
        // Free users or unspecified gender
        if (userGender !== 'unspecified') {
            // 90% of the time, free users won't even check the opposite gender queue.
            // If they do check it, we put same gender first to minimize opposite gender matches.
            const shouldCheckOpposite = Math.random() < 0.1;
            if (shouldCheckOpposite) {
                queuesToCheck = [`${baseQueueName}:${userGender}`, `${baseQueueName}:unspecified`, `${baseQueueName}:${oppositeGender}`];
            }
            else {
                queuesToCheck = [`${baseQueueName}:${userGender}`, `${baseQueueName}:unspecified`];
            }
        }
        else {
            queuesToCheck = [`${baseQueueName}:male`, `${baseQueueName}:female`, `${baseQueueName}:unspecified`];
        }
    }
    let peerData = null;
    let matchedQueue = '';
    for (const q of queuesToCheck) {
        if (isPremium && targetCountry) {
            // If targetCountry is specified, find the first user from that country
            const list = await server_1.redisClient.lrange(q, 0, -1);
            const parsedList = list.map(item => {
                if (typeof item === 'object')
                    return { ...item, original: item };
                const [sId, uId, ctry] = item.split('|');
                return { socketId: sId, userId: uId, country: ctry, original: item };
            });
            const matches = parsedList.filter(u => u && u.country?.toLowerCase() === targetCountry.toLowerCase());
            for (const match of matches) {
                if (match && match.socketId !== previousPeerSocketId && match.socketId !== socketId) {
                    const removedCount = await server_1.redisClient.lrem(q, 1, match.original);
                    if (removedCount > 0) {
                        peerData = match;
                        matchedQueue = q;
                        break;
                    }
                }
            }
            if (peerData)
                break;
        }
        else {
            // Find the first peer that is NOT ourselves and NOT the previous peer
            const list = await server_1.redisClient.lrange(q, 0, -1);
            const parsedList = list.map(item => {
                if (typeof item === 'object')
                    return { ...item, original: item };
                const [sId, uId, ctry] = item.split('|');
                return { socketId: sId, userId: uId, country: ctry, original: item };
            });
            const matches = parsedList.filter(u => u && u.socketId !== socketId && u.socketId !== previousPeerSocketId && u.userId !== userId);
            for (const match of matches) {
                const removedCount = await server_1.redisClient.lrem(q, 1, match.original);
                if (removedCount > 0) {
                    peerData = match;
                    matchedQueue = q;
                    break;
                }
            }
            if (peerData)
                break;
        }
    }
    // Fallback: If no match found but we skipped someone previously, let's allow matching with them
    // so we don't wait infinitely in a 2-person queue.
    if (!peerData && previousPeerSocketId) {
        for (const q of queuesToCheck) {
            const list = await server_1.redisClient.lrange(q, 0, -1);
            const parsedList = list.map(item => {
                if (typeof item === 'object')
                    return { ...item, original: item };
                const [sId, uId, ctry] = item.split('|');
                return { socketId: sId, userId: uId, country: ctry, original: item };
            });
            const matches = isPremium && targetCountry
                ? parsedList.filter(u => u && u.country?.toLowerCase() === targetCountry.toLowerCase() && u.socketId !== socketId && u.userId !== userId)
                : parsedList.filter(u => u && u.socketId !== socketId && u.userId !== userId);
            for (const match of matches) {
                const removedCount = await server_1.redisClient.lrem(q, 1, match.original);
                if (removedCount > 0) {
                    peerData = match;
                    matchedQueue = q;
                    break;
                }
            }
            if (peerData)
                break;
        }
    }
    if (peerData) {
        // Don't match with ourselves (same user ID or same socket connection)
        if (peerData.userId === userId || peerData.socketId === socketId) {
            // Discard this ghost and recursively try to find a real partner.
            return (0, exports.addToQueue)(socketId, userId, baseQueueName, targetCountry, targetGender, previousPeerSocketId);
        }
        // Match found!
        console.log(`Match found between ${userId} and ${peerData.userId}!`);
        const roomId = (0, uuid_1.v4)();
        const callType = baseQueueName.includes('text') ? 'text' : (baseQueueName.includes('audio') ? 'audio' : 'video');
        // Create session in DB
        try {
            const session = new Session_1.default({ roomId, user1: userId, user2: peerData.userId, callType });
            await session.save();
        }
        catch (e) {
            console.error('Failed to create session in DB', e);
        }
        // Fetch user details if they are not guests
        const user1Data = userId.startsWith('guest-')
            ? { name: 'Guest', username: userId, profileImage: '', country: 'unspecified' }
            : await User_1.default.findById(userId).select('name username profileImage premiumStatus country');
        const user2Data = peerData.userId.startsWith('guest-')
            ? { name: 'Guest', username: peerData.userId, profileImage: '', country: peerData.country || 'unspecified' }
            : await User_1.default.findById(peerData.userId).select('name username profileImage premiumStatus country');
        server_1.io.to(socketId).emit('match-found', {
            roomId,
            peerSocketId: peerData.socketId,
            peerData: user2Data,
            isInitiator: true,
        });
        server_1.io.to(peerData.socketId).emit('match-found', {
            roomId,
            peerSocketId: socketId,
            peerData: user1Data,
            isInitiator: false,
        });
        // Track active match so we can handle unexpected disconnects
        await server_1.redisClient.set(`activeMatch:${socketId}`, peerData.socketId);
        await server_1.redisClient.set(`activeMatch:${peerData.socketId}`, socketId);
    }
    else {
        // No one waiting — add self to queue
        const myQueue = `${baseQueueName}:${userGender}`;
        console.log(`No match found. User ${userId} is waiting in queue ${myQueue}.`);
        const queueItem = `${socketId}|${userId}|${myCountry}`;
        await server_1.redisClient.rpush(myQueue, queueItem);
    }
};
exports.addToQueue = addToQueue;
const removeFromQueue = async (socketId, baseQueueName) => {
    const queues = [`${baseQueueName}:male`, `${baseQueueName}:female`, `${baseQueueName}:unspecified`];
    for (const q of queues) {
        const list = await server_1.redisClient.lrange(q, 0, -1);
        for (const data of list) {
            let currentSocketId = '';
            if (typeof data === 'object') {
                currentSocketId = data.socketId;
            }
            else if (typeof data === 'string') {
                currentSocketId = data.split('|')[0] || '';
            }
            if (currentSocketId === socketId) {
                await server_1.redisClient.lrem(q, 1, data);
                break;
            }
        }
    }
};
exports.removeFromQueue = removeFromQueue;
//# sourceMappingURL=matchmaking.js.map