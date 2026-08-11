"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_VIEWERS = void 0;
exports.getLiveRoom = getLiveRoom;
exports.getRoomByCreator = getRoomByCreator;
exports.addLiveRoom = addLiveRoom;
exports.removeLiveRoom = removeLiveRoom;
exports.getAllLiveRooms = getAllLiveRooms;
exports.MAX_VIEWERS = 10;
// In-memory registry of active streams. Single-process backend, so this is
// enough for the P2P (peer-to-peer) live streaming model.
const liveRooms = new Map();
function getLiveRoom(roomCode) {
    return liveRooms.get(roomCode);
}
function getRoomByCreator(creatorSocketId) {
    for (const room of liveRooms.values()) {
        if (room.creatorSocketId === creatorSocketId)
            return room;
    }
    return undefined;
}
function addLiveRoom(room) {
    liveRooms.set(room.roomCode, room);
}
function removeLiveRoom(roomCode) {
    liveRooms.delete(roomCode);
}
function getAllLiveRooms() {
    return [...liveRooms.values()];
}
//# sourceMappingURL=liveRooms.js.map