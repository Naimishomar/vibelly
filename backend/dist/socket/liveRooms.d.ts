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
export declare const MAX_VIEWERS = 10;
export declare function getLiveRoom(roomCode: string): LiveRoom | undefined;
export declare function getRoomByCreator(creatorSocketId: string): LiveRoom | undefined;
export declare function addLiveRoom(room: LiveRoom): void;
export declare function removeLiveRoom(roomCode: string): void;
export declare function getAllLiveRooms(): LiveRoom[];
//# sourceMappingURL=liveRooms.d.ts.map