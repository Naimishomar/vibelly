import { io } from '../server';
import {
  LiveRoom,
  MAX_VIEWERS,
  getLiveRoom,
  getRoomByCreator,
  addLiveRoom,
  removeLiveRoom,
  getAllLiveRooms,
} from './liveRooms';
import { verifyAccessToken } from '../utils/jwt';
import CreatorProfile from '../models/CreatorProfile';
import CreatorSubscription from '../models/CreatorSubscription';
import User from '../models/User';

function endStream(creatorSocketId: string) {
  const room = getRoomByCreator(creatorSocketId);
  if (!room) return;
  removeLiveRoom(room.roomCode);
  io.to(`live:${room.roomCode}`).emit('live:stream-ended', { roomCode: room.roomCode });
  for (const viewerId of room.viewers) {
    io.to(viewerId).emit('live:stream-ended', { roomCode: room.roomCode });
  }
  room.viewers.clear();
}

function leaveRoom(socketId: string) {
  for (const room of getAllLiveRooms()) {
    if (room.viewers.has(socketId)) {
      room.viewers.delete(socketId);
      io.sockets.sockets.get(socketId)?.leave(`live:${room.roomCode}`);
      io.to(room.creatorSocketId).emit('live:viewer-left', {
        viewerSocketId: socketId,
        viewerCount: room.viewers.size,
      });
    }
  }
}

io.on('connection', (socket) => {
  // ── Creator ──
  socket.on('live:start', async (data) => {
    const { roomCode, title, creatorName, creatorProfileImage, price, authToken, thumbnail, isPrivate } = data || {};
    if (!roomCode || getLiveRoom(roomCode)) return;

    // Paid streams require an authenticated creator with ACTIVE SUBSCRIPTION (₹500/month).
    let creatorUserId: string | undefined;
    if (typeof price === 'number' && price > 0) {
      let decoded: any;
      try {
        decoded = verifyAccessToken(authToken || '');
        if (!decoded?.id) throw new Error('no user');
      } catch {
        socket.emit('live:start-failed', { message: 'Sign in to start a paid stream' });
        return;
      }
      const user = await User.findById(decoded.id);
      if (!user) {
        socket.emit('live:start-failed', { message: 'User not found' });
        return;
      }
      if (user.role !== 'admin') {
        const sub = await CreatorSubscription.findOne({
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

    const room: LiveRoom = {
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
    addLiveRoom(room);
    socket.join(`live:${room.roomCode}`);
    (socket.data as any).liveRole = 'creator';
    socket.emit('live:started', { roomCode, price: room.price, isPrivate: room.isPrivate });
  });

  socket.on('live:stop', () => {
    endStream(socket.id);
    socket.leave(`live:${(socket.data as any).liveRoomCode || ''}`);
    delete (socket.data as any).liveRole;
    delete (socket.data as any).liveRoomCode;
  });

  // ── Viewer ──
  socket.on('live:join', (data) => {
    const { roomCode, accessToken } = data || {};
    const room = getLiveRoom(roomCode);
    if (!room) {
      socket.emit('live:join-failed', { message: 'Stream not found' });
      return;
    }
    if (socket.id === room.creatorSocketId) return;

    // Paid stream gate: verify live-access OR profile-subscription token.
    if (room.price > 0) {
      let authorized = false;
      try {
        const decoded = verifyAccessToken(accessToken || '');
        if (decoded?.type === 'live-access' && decoded.roomCode === roomCode) {
          authorized = true;
        } else if (
          decoded?.type === 'profile-access' &&
          room.creatorUserId &&
          decoded.creatorId === room.creatorUserId
        ) {
          authorized = true;
        }
      } catch {
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

    if (room.viewers.size >= MAX_VIEWERS) {
      socket.emit('live:join-failed', {
        message: `Room is full (max ${MAX_VIEWERS} viewers)`,
        roomFull: true,
      });
      return;
    }

    room.viewers.add(socket.id);
    socket.join(`live:${room.roomCode}`);
    (socket.data as any).liveRole = 'viewer';
    (socket.data as any).liveRoomCode = roomCode;

    socket.emit('live:join-success', {
      roomCode,
      creatorSocketId: room.creatorSocketId,
      title: room.title,
      creatorName: room.creatorName,
      price: room.price,
    });

    io.to(room.creatorSocketId).emit('live:viewer-joined', {
      viewerSocketId: socket.id,
      viewerCount: room.viewers.size,
    });
  });

  socket.on('live:leave', () => {
    leaveRoom(socket.id);
    socket.leave(`live:${(socket.data as any).liveRoomCode || ''}`);
    delete (socket.data as any).liveRole;
    delete (socket.data as any).liveRoomCode;
  });

  // ── Live comments ──
  socket.on('live:comment', (data) => {
    const { roomCode, user, text } = data || {};
    if (!roomCode || !text) return;
    const room = getLiveRoom(roomCode);
    if (!room) return;
    // Only viewers in the room or the creator can comment
    if (socket.id !== room.creatorSocketId && !room.viewers.has(socket.id)) return;

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
    io.to(`live:${room.roomCode}`).emit('live:new-comment', comment);
  });

  // ── Live emoji reactions (volatile, fire-and-forget like groups) ──
  socket.on('live:reaction', (data) => {
    const { roomCode, emoji } = data || {};
    if (!roomCode || !emoji) return;
    const room = getLiveRoom(roomCode);
    if (!room) return;
    if (socket.id !== room.creatorSocketId && !room.viewers.has(socket.id)) return;
    io.to(`live:${room.roomCode}`).emit('live:new-reaction', {
      emoji: String(emoji).slice(0, 8),
      id: Date.now() + Math.random(),
      userId: (data as any).userId || '',
    });
  });

  // ── Directory (private rooms are hidden; viewers join only via code) ──
  socket.on('live:list', () => {
    const streams = getAllLiveRooms()
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
    const role = (socket.data as any).liveRole;
    if (role === 'creator') {
      endStream(socket.id);
    } else if (role === 'viewer') {
      leaveRoom(socket.id);
    }
  });
});
