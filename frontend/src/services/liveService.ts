import { socketService } from './socketService';
import { attachStreamToVideo } from './webrtcService';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];

interface LiveStreamInfo {
  title: string;
  creatorName: string;
}

class LiveService {
  // ── Creator mode ──
  private creatorPcs = new Map<string, RTCPeerConnection>();
  private queuedCreatorCandidates = new Map<string, RTCIceCandidateInit[]>();
  private localStream: MediaStream | null = null;
  private creatorHandlersBound = false;
  private onCreatorViewerCount: ((count: number) => void) | null = null;

  // ── Viewer mode ──
  private viewerPc: RTCPeerConnection | null = null;
  private creatorSocketId: string | null = null;
  private remoteStream: MediaStream | null = null;
  private viewerHandlersBound = false;
  private onRemoteStream: ((stream: MediaStream) => void) | null = null;
  private onViewerEnded: (() => void) | null = null;

  // ─────────────── Creator ───────────────

  async startStream(
    stream: MediaStream,
    roomCode: string,
    title: string,
    creatorName: string,
    onViewerCount: (count: number) => void,
    price: number = 0,
    authToken?: string,
    thumbnail?: string,
    isPrivate?: boolean,
    creatorProfileImage?: string
  ) {
    this.localStream = stream;
    this.onCreatorViewerCount = onViewerCount;
    this.creatorHandlersBound = false;
    this.bindCreatorHandlers();
    socketService.emit('live:start', {
      roomCode,
      title,
      creatorName,
      creatorProfileImage,
      price,
      authToken,
      thumbnail,
      isPrivate,
    });
  }

  private bindCreatorHandlers() {
    if (this.creatorHandlersBound) return;
    this.creatorHandlersBound = true;

    socketService.on('live:viewer-joined', ({ viewerCount }: { viewerCount: number }) => {
      this.onCreatorViewerCount?.(viewerCount);
    });

    socketService.on('live:viewer-left', ({ viewerCount }: { viewerCount: number }) => {
      this.onCreatorViewerCount?.(viewerCount);
      // Close the viewer's peer connection; cleanup happens below.
    });

    socketService.on('webrtc-offer', async (data) => {
      const { peerSocketId, offer } = data;
      if (!this.localStream) return;

      let pc = this.creatorPcs.get(peerSocketId);
      if (!pc) {
        pc = this.createCreatorPc(peerSocketId);
        this.creatorPcs.set(peerSocketId, pc);
        for (const track of this.localStream.getTracks()) {
          pc.addTrack(track, this.localStream);
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const queued = this.queuedCreatorCandidates.get(peerSocketId) || [];
      for (const candidate of queued) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
      }
      this.queuedCreatorCandidates.delete(peerSocketId);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketService.emit('webrtc-answer', { peerSocketId, answer: pc.localDescription });
    });

    socketService.on('webrtc-ice-candidate', (data) => {
      const { peerSocketId, candidate } = data;
      const pc = this.creatorPcs.get(peerSocketId);
      if (!pc || !pc.remoteDescription) {
        const list = this.queuedCreatorCandidates.get(peerSocketId) || [];
        list.push(candidate);
        this.queuedCreatorCandidates.set(peerSocketId, list);
        return;
      }
      pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    });
  }

  private createCreatorPc(viewerSocketId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.emit('webrtc-ice-candidate', {
          peerSocketId: viewerSocketId,
          candidate: event.candidate,
        });
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        pc.close();
        this.creatorPcs.delete(viewerSocketId);
      }
    };
    return pc;
  }

  stopStream() {
    socketService.emit('live:stop');
    for (const pc of this.creatorPcs.values()) {
      pc.close();
    }
    this.creatorPcs.clear();
    this.queuedCreatorCandidates.clear();
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
  }

  // ─────────────── Viewer ───────────────

  async joinStream(
    roomCode: string,
    onRemoteStream: (stream: MediaStream) => void,
    onEnded: () => void,
    accessToken?: string
  ): Promise<LiveStreamInfo> {
    this.onRemoteStream = onRemoteStream;
    this.onViewerEnded = onEnded;
    this.bindViewerHandlers();

    return new Promise<LiveStreamInfo>((resolve, reject) => {
      const onSuccess = async (data: { creatorSocketId: string; title: string; creatorName: string }) => {
        cleanup();
        this.creatorSocketId = data.creatorSocketId;
        await this.createViewerPc();
        resolve({ title: data.title, creatorName: data.creatorName });
      };
      const onFailed = (data: { message?: string; requiresPayment?: boolean; price?: number; roomFull?: boolean }) => {
        cleanup();
        const err: any = new Error(data?.message || 'Stream not found');
        err.requiresPayment = !!data?.requiresPayment;
        err.price = data?.price;
        err.roomFull = !!data?.roomFull;
        reject(err);
      };
      const cleanup = () => {
        socketService.off('live:join-success', onSuccess);
        socketService.off('live:join-failed', onFailed);
      };

      socketService.on('live:join-success', onSuccess);
      socketService.on('live:join-failed', onFailed);
      socketService.emit('live:join', { roomCode, accessToken });
    });
  }

  private bindViewerHandlers() {
    if (this.viewerHandlersBound) return;
    this.viewerHandlersBound = true;

    socketService.on('webrtc-answer', async (data) => {
      if (!this.viewerPc) return;
      const { answer } = data;
      await this.viewerPc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socketService.on('webrtc-ice-candidate', (data) => {
      if (!this.viewerPc) return;
      const { candidate } = data;
      this.viewerPc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    });

    socketService.on('live:stream-ended', () => {
      this.onViewerEnded?.();
    });
  }

  private async createViewerPc() {
    if (!this.creatorSocketId) return;

    this.remoteStream = new MediaStream();
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.viewerPc = pc;

    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });

    pc.onicecandidate = (event) => {
      if (event.candidate && this.creatorSocketId) {
        socketService.emit('webrtc-ice-candidate', {
          peerSocketId: this.creatorSocketId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      if (!this.remoteStream) this.remoteStream = new MediaStream();
      if (!this.remoteStream.getTracks().some((t) => t.id === event.track.id)) {
        this.remoteStream.addTrack(event.track);
      }
      this.onRemoteStream?.(this.remoteStream);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.onViewerEnded?.();
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketService.emit('webrtc-offer', {
      peerSocketId: this.creatorSocketId,
      offer: pc.localDescription,
    });
  }

  leaveStream() {
    socketService.emit('live:leave');
    if (this.viewerPc) {
      this.viewerPc.close();
      this.viewerPc = null;
    }
    this.creatorSocketId = null;
    this.remoteStream = null;
  }

  // ─────────────── Comments & reactions ───────────────

  private commentHandler: ((comment: any) => void) | null = null;
  private reactionHandler: ((reaction: any) => void) | null = null;

  sendComment(roomCode: string, user: any, text: string) {
    socketService.emit('live:comment', { roomCode, user, text });
  }

  sendReaction(roomCode: string, emoji: string, userId?: string) {
    socketService.emit('live:reaction', { roomCode, emoji, userId });
  }

  onComment(cb: (comment: any) => void) {
    if (this.commentHandler) socketService.off('live:new-comment', this.commentHandler);
    this.commentHandler = cb;
    socketService.on('live:new-comment', cb);
  }

  onReaction(cb: (reaction: any) => void) {
    if (this.reactionHandler) socketService.off('live:new-reaction', this.reactionHandler);
    this.reactionHandler = cb;
    socketService.on('live:new-reaction', cb);
  }

  clearCommentHandlers() {
    if (this.commentHandler) socketService.off('live:new-comment', this.commentHandler);
    if (this.reactionHandler) socketService.off('live:new-reaction', this.reactionHandler);
    this.commentHandler = null;
    this.reactionHandler = null;
  }

  // ─────────────── Directory ───────────────

  async fetchLiveStreams(): Promise<
    { roomCode: string; title: string; creatorName: string; thumbnail: string; price: number; isPrivate: boolean; viewerCount: number }[]
  > {
    return new Promise((resolve) => {
      const onResult = (data: { streams: any[] }) => {
        socketService.off('live:list-result', onResult);
        resolve(data.streams || []);
      };
      socketService.on('live:list-result', onResult);
      socketService.emit('live:list');
    });
  }
}

export const liveService = new LiveService();
export { attachStreamToVideo };
