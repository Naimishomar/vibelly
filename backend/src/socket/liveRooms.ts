export interface LiveRoom {
  roomCode: string;
  title: string;
  creatorName: string;
  creatorProfileImage?: string;
  creatorSocketId: string;
  creatorUserId?: string;
  thumbnail?: string;
  isPrivate?: boolean;
  price: number;
  createdAt: number;
  viewers: Set<string>;
}

export const MAX_VIEWERS = 10;

// In-memory registry of active streams. Single-process backend, so this is
// enough for the P2P (peer-to-peer) live streaming model.
const liveRooms = new Map<string, LiveRoom>();

export function getLiveRoom(roomCode: string): LiveRoom | undefined {
  return liveRooms.get(roomCode);
}

export function getRoomByCreator(creatorSocketId: string): LiveRoom | undefined {
  for (const room of liveRooms.values()) {
    if (room.creatorSocketId === creatorSocketId) return room;
  }
  return undefined;
}

export function addLiveRoom(room: LiveRoom) {
  liveRooms.set(room.roomCode, room);
}

export function removeLiveRoom(roomCode: string) {
  liveRooms.delete(roomCode);
}

export function getAllLiveRooms(): LiveRoom[] {
  return [...liveRooms.values()];
}
