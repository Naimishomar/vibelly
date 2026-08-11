import { socketService } from './socketService';

export type MediaErrorCode = 'not-supported' | 'permission-denied' | 'not-found' | 'in-use' | 'unknown';


function parseMediaError(err: unknown): MediaErrorCode {
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') return 'permission-denied';
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') return 'not-found';
    if (err.name === 'NotReadableError' || err.name === 'TrackStartError') return 'in-use';
  }
  return 'unknown';
}

export function attachStreamToVideo(video: HTMLVideoElement | null, stream: MediaStream | null) {
  if (!video || !stream) return;
  // If the browser doesn't update dynamically when tracks are added, force a new MediaStream
  if (video.srcObject === stream) {
    video.srcObject = new MediaStream(stream.getTracks());
  } else {
    video.srcObject = stream;
  }
  void video.play().catch((e) => console.warn('Video play blocked by browser:', e));
}

class WebRTCService {
  public peerConnection: RTCPeerConnection | null = null;
  public localStream: MediaStream | null = null;
  public remoteStream: MediaStream | null = null;

  private peerSocketId: string | null = null;
  private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
  private onConnectionFailedCallback: (() => void) | null = null;

  // Queues for handling race conditions where signaling arrives before camera is ready
  private queuedOffer: { peerSocketId?: string | null; offer: RTCSessionDescriptionInit } | null = null;
  private queuedCandidates: { peerSocketId?: string | null; candidate: RTCIceCandidateInit }[] = [];

  // Stale signaling (offer/answer/ICE) from a previous match can arrive in-flight after a Skip
  // and corrupt the fresh RTCPeerConnection (double setRemoteDescription => InvalidStateError,
  // which manifests as a black screen: matched + name shown but no remote video).
  // Drop any signaling that is not from the peer we are currently matched with.
  private isStalePeer(senderSocketId?: string | null): boolean {
    if (!this.peerSocketId || !senderSocketId) return false;
    return senderSocketId !== this.peerSocketId;
  }

  isMediaSupported(): boolean {
    return !!(navigator.mediaDevices?.getUserMedia);
  }

  async startLocalStream(videoEnabled: boolean, resolution: '480' | '720' | '1080' = '480'): Promise<{ stream: MediaStream | null; error: MediaErrorCode | null }> {
    if (!this.isMediaSupported()) {
      return { stream: null, error: 'not-supported' };
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    let idealWidth = 640;
    let idealHeight = 480;
    if (resolution === '720') {
      idealWidth = 1280;
      idealHeight = 720;
    } else if (resolution === '1080') {
      idealWidth = 1920;
      idealHeight = 1080;
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled
          ? { 
              width: { ideal: idealWidth }, 
              height: { ideal: idealHeight }, 
              facingMode: 'user',
              frameRate: { max: 15 } // Crucial for slow networks: halves bandwidth
            }
          : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      return { stream: this.localStream, error: null };
    } catch (err) {
      console.error('Camera/mic access denied or unavailable:', err);
      return { stream: null, error: parseMediaError(err) };
    }
  }

  async initialize(
    peerSocketId: string,
    videoEnabled: boolean,
    onRemoteStream: (stream: MediaStream) => void,
    resolution: '480' | '720' | '1080' = '480',
    isInitiator: boolean,
    onConnectionFailed?: () => void
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      this.peerSocketId = peerSocketId;
      this.onRemoteStreamCallback = onRemoteStream;
      this.onConnectionFailedCallback = onConnectionFailed || null;

      if (!this.localStream) {
        const { stream, error } = await this.startLocalStream(videoEnabled, resolution);
        if (!stream) {
          console.error('Failed to start local stream:', error);
          return { ok: false, error: error || 'unknown' };
        }
      }

      this.remoteStream = new MediaStream();
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { urls: 'stun:stun.services.mozilla.com:3478' },
          // Free TURN server fallback for restrictive networks/NAT Hairpinning issues
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
        ]
      });

      this.peerConnection.oniceconnectionstatechange = () => {
        if (this.peerConnection?.iceConnectionState === 'failed') {
          this.onConnectionFailedCallback?.();
        }
      };

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.peerSocketId) {
          socketService.emit('webrtc-ice-candidate', {
            peerSocketId: this.peerSocketId,
            candidate: event.candidate,
          });
        }
      };

      this.peerConnection.ontrack = (event) => {
        const track = event.track;
        if (!this.remoteStream!.getTracks().some((t) => t.id === track.id)) {
          this.remoteStream!.addTrack(track);
        }
        this.onRemoteStreamCallback?.(this.remoteStream!);
      };

      if (this.localStream) {
        for (const track of this.localStream.getTracks()) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      }

      if (isInitiator) {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        socketService.emit('webrtc-offer', {
          peerSocketId: this.peerSocketId,
          offer: this.peerConnection.localDescription,
        });
      } else {
        // Process any queued offer that arrived while we were getting camera permissions
        if (this.queuedOffer) {
          const offerToProcess = this.queuedOffer;
          this.queuedOffer = null;
          await this.handleOffer(offerToProcess);
        }
      }

      return { ok: true };
    } catch (error) {
      console.error('WebRTC initialization error:', error);
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async handleOffer(data: { peerSocketId?: string | null; offer: RTCSessionDescriptionInit }) {
    if (this.isStalePeer(data.peerSocketId)) return;
    const offer = data.offer;
    if (!this.peerConnection) {
      this.queuedOffer = data;
      return;
    }
    // Ignore duplicate/stale offers — setting a remote description twice throws
    // 'InvalidStateError: Can't set remote offer twice' and kills the connection.
    const state = this.peerConnection.signalingState;
    if (state !== 'stable' && state !== 'have-local-offer') {
      return;
    }
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    this.flushIceCandidates();

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    if (this.peerSocketId) {
      socketService.emit('webrtc-answer', {
        peerSocketId: this.peerSocketId,
        answer: this.peerConnection.localDescription,
      });
    }
  }

  async handleAnswer(data: { peerSocketId?: string | null; answer: RTCSessionDescriptionInit }) {
    if (!this.peerConnection || this.isStalePeer(data.peerSocketId)) return;
    // Only accept an answer while we actually have an outstanding local offer
    // (a stale answer from a previous peer would otherwise throw here).
    if (this.peerConnection.signalingState !== 'have-local-offer') {
      return;
    }
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    this.flushIceCandidates();
  }

  private async flushIceCandidates() {
    if (!this.peerConnection) return;
    for (const entry of this.queuedCandidates) {
      if (this.isStalePeer(entry.peerSocketId)) continue;
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(entry.candidate)).catch(console.error);
    }
    this.queuedCandidates = [];
  }

  async handleIceCandidate(data: { peerSocketId?: string | null; candidate: RTCIceCandidateInit }) {
    if (this.isStalePeer(data.peerSocketId)) return;
    if (!this.peerConnection || !this.peerConnection.remoteDescription) {
      this.queuedCandidates.push(data);
      return;
    }
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(console.error);
  }

  async setVideoEnabled(enabled: boolean, resolution: '480' | '720' | '1080' = '480'): Promise<boolean> {
    if (!this.localStream || !this.peerConnection) return false;

    const videoTracks = this.localStream.getVideoTracks();
    if (enabled) {
      if (videoTracks.length > 0) {
        videoTracks.forEach((t) => { t.enabled = true; });
        return true;
      }

      try {
        let idealWidth = 640;
        let idealHeight = 480;
        if (resolution === '720') {
          idealWidth = 1280;
          idealHeight = 720;
        } else if (resolution === '1080') {
          idealWidth = 1920;
          idealHeight = 1080;
        }

        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: idealWidth }, height: { ideal: idealHeight }, facingMode: 'user' },
        });
        const videoTrack = videoStream.getVideoTracks()[0];
        this.localStream.addTrack(videoTrack);
        
        const senders = this.peerConnection.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(videoTrack);
        } else {
          this.peerConnection.addTrack(videoTrack, this.localStream);
          // Needs renegotiation, but simple peer handles it if we create a new offer
          const offer = await this.peerConnection.createOffer();
          await this.peerConnection.setLocalDescription(offer);
          socketService.emit('webrtc-offer', {
            peerSocketId: this.peerSocketId,
            offer: this.peerConnection.localDescription,
          });
        }
        
        return true;
      } catch (err) {
        console.error('Failed to re-enable camera:', err);
        return false;
      }
    }

    videoTracks.forEach((t) => { t.enabled = false; });
    return true;
  }

  endPeerConnection() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteStream = null;
    this.peerSocketId = null;
    this.onRemoteStreamCallback = null;
    this.onConnectionFailedCallback = null;
    this.queuedOffer = null;
    this.queuedCandidates = [];
  }

  endCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    this.endPeerConnection();
  }
}

export const webrtcService = new WebRTCService();
