"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("../server");
const liveRooms_1 = require("./liveRooms");
const jwt_1 = require("../utils/jwt");
const CreatorSubscription_1 = __importDefault(require("../models/CreatorSubscription"));
const User_1 = __importDefault(require("../models/User"));
function endStream(creatorSocketId) {
    const room = (0, liveRooms_1.getRoomByCreator)(creatorSocketId);
    if (!room)
        return;
    (0, liveRooms_1.removeLiveRoom)(room.roomCode);
    server_1.io.to(`live:${room.roomCode}`).emit('live:stream-ended', { roomCode: room.roomCode });
    for (const viewerId of room.viewers) {
        server_1.io.to(viewerId).emit('live:stream-ended', { roomCode: room.roomCode });
    }
    room.viewers.clear();
}
function leaveRoom(socketId) {
    for (const room of (0, liveRooms_1.getAllLiveRooms)()) {
        if (room.viewers.has(socketId)) {
            room.viewers.delete(socketId);
            server_1.io.sockets.sockets.get(socketId)?.leave(`live:${room.roomCode}`);
            server_1.io.to(room.creatorSocketId).emit('live:viewer-left', {
                viewerSocketId: socketId,
                viewerCount: room.viewers.size,
            });
        }
    }
}
server_1.io.on('connection', (socket) => {
    // ── Creator ──
    socket.on('live:start', async (data) => {
        const { roomCode, title, creatorName, creatorProfileImage, price, authToken, thumbnail, isPrivate } = data || {};
        if (!roomCode || (0, liveRooms_1.getLiveRoom)(roomCode))
            return;
        // Paid streams require an authenticated creator with ACTIVE SUBSCRIPTION (₹500/month).
        let creatorUserId;
        if (typeof price === 'number' && price > 0) {
            let decoded;
            try {
                decoded = (0, jwt_1.verifyAccessToken)(authToken || '');
                if (!decoded?.id)
                    throw new Error('no user');
            }
            catch {
                socket.emit('live:start-failed', { message: 'Sign in to start a paid stream' });
                return;
            }
            const user = await User_1.default.findById(decoded.id);
            if (!user) {
                socket.emit('live:start-failed', { message: 'User not found' });
                return;
            }
            if (user.role !== 'admin') {
                const sub = await CreatorSubscription_1.default.findOne({
                    creator: decoded.id,
                    status: 'active',
                    expiresAt: { $gt: new Date() },
                }).lean();
                if (!sub) {
                    socket.emit('live:start-failed', {
                        message: 'You need an active creator subscription (₹500/month) to start a paid stream. Activate it from your profile.',
                        needsSubscription: true,
                    });
                    return;
                }
            }
            creatorUserId = decoded.id;
        }
        const room = {
            roomCode,
            title: title || 'Live Stream',
            creatorName: creatorName || 'Anonymous',
            creatorProfileImage: creatorProfileImage || '',
            creatorSocketId: socket.id,
            creatorUserId,
            thumbnail: thumbnail || '',
            isPrivate: !!isPrivate,
            price: typeof price === 'number' && price > 0 ? Math.floor(price) : 0,
            createdAt: Date.now(),
            viewers: new Set(),
        };
        (0, liveRooms_1.addLiveRoom)(room);
        socket.join(`live:${room.roomCode}`);
        socket.data.liveRole = 'creator';
        socket.emit('live:started', { roomCode, price: room.price, isPrivate: room.isPrivate });
    });
    socket.on('live:stop', () => {
        endStream(socket.id);
        socket.leave(`live:${socket.data.liveRoomCode || ''}`);
        delete socket.data.liveRole;
        delete socket.data.liveRoomCode;
    });
    // ── Viewer ──
    socket.on('live:join', (data) => {
        const { roomCode, accessToken } = data || {};
        const room = (0, liveRooms_1.getLiveRoom)(roomCode);
        if (!room) {
            socket.emit('live:join-failed', { message: 'Stream not found' });
            return;
        }
        if (socket.id === room.creatorSocketId)
            return;
        // Paid stream gate: verify live-access OR profile-subscription token.
        if (room.price > 0) {
            let authorized = false;
            try {
                const decoded = (0, jwt_1.verifyAccessToken)(accessToken || '');
                if (decoded?.type === 'live-access' && decoded.roomCode === roomCode) {
                    authorized = true;
                }
                else if (decoded?.type === 'profile-access' &&
                    room.creatorUserId &&
                    decoded.creatorId === room.creatorUserId) {
                    authorized = true;
                }
            }
            catch {
                authorized = false;
            }
            if (!authorized) {
                socket.emit('live:join-failed', {
                    message: 'Payment required to watch this stream',
                    requiresPayment: true,
                    price: room.price,
                });
                return;
            }
        }
        if (room.viewers.size >= liveRooms_1.MAX_VIEWERS) {
            socket.emit('live:join-failed', {
                message: `Room is full (max ${liveRooms_1.MAX_VIEWERS} viewers)`,
                roomFull: true,
            });
            return;
        }
        room.viewers.add(socket.id);
        socket.join(`live:${room.roomCode}`);
        socket.data.liveRole = 'viewer';
        socket.data.liveRoomCode = roomCode;
        socket.emit('live:join-success', {
            roomCode,
            creatorSocketId: room.creatorSocketId,
            title: room.title,
            creatorName: room.creatorName,
            price: room.price,
        });
        server_1.io.to(room.creatorSocketId).emit('live:viewer-joined', {
            viewerSocketId: socket.id,
            viewerCount: room.viewers.size,
        });
    });
    socket.on('live:leave', () => {
        leaveRoom(socket.id);
        socket.leave(`live:${socket.data.liveRoomCode || ''}`);
        delete socket.data.liveRole;
        delete socket.data.liveRoomCode;
    });
    // ── Live comments ──
    socket.on('live:comment', (data) => {
        const { roomCode, user, text } = data || {};
        if (!roomCode || !text)
            return;
        const room = (0, liveRooms_1.getLiveRoom)(roomCode);
        if (!room)
            return;
        // Only viewers in the room or the creator can comment
        if (socket.id !== room.creatorSocketId && !room.viewers.has(socket.id))
            return;
        const comment = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
            user: {
                _id: user?._id || '',
                name: user?.name || 'Anonymous',
                username: user?.username || '',
                profileImage: user?.profileImage || '',
            },
            text: String(text).slice(0, 300),
            timestamp: new Date().toISOString(),
        };
        server_1.io.to(`live:${room.roomCode}`).emit('live:new-comment', comment);
    });
    // ── Live emoji reactions (volatile, fire-and-forget like groups) ──
    socket.on('live:reaction', (data) => {
        const { roomCode, emoji } = data || {};
        if (!roomCode || !emoji)
            return;
        const room = (0, liveRooms_1.getLiveRoom)(roomCode);
        if (!room)
            return;
        if (socket.id !== room.creatorSocketId && !room.viewers.has(socket.id))
            return;
        server_1.io.to(`live:${room.roomCode}`).emit('live:new-reaction', {
            emoji: String(emoji).slice(0, 8),
            id: Date.now() + Math.random(),
            userId: data.userId || '',
        });
    });
    // ── Directory (private rooms are hidden; viewers join only via code) ──
    socket.on('live:list', () => {
        const streams = (0, liveRooms_1.getAllLiveRooms)()
            .filter((r) => !r.isPrivate)
            .map((r) => ({
            roomCode: r.roomCode,
            title: r.title,
            creatorName: r.creatorName,
            creatorProfileImage: r.creatorProfileImage || '',
            creatorUserId: r.creatorUserId || '',
            thumbnail: r.thumbnail || '',
            price: r.price,
            isPrivate: r.isPrivate || false,
            viewerCount: r.viewers.size,
        }));
        socket.emit('live:list-result', { streams });
    });
    socket.on('disconnect', () => {
        const role = socket.data.liveRole;
        if (role === 'creator') {
            endStream(socket.id);
        }
        else if (role === 'viewer') {
            leaveRoom(socket.id);
        }
    });
});
//# sourceMappingURL=live.js.map