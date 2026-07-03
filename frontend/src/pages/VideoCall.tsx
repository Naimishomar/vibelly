import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, SkipForward,
  AlertTriangle, MessageSquare, Send, X, Headphones, RefreshCw
} from 'lucide-react';
import { useCallStore } from '../store/callStore';
import { webrtcService, attachStreamToVideo, type MediaErrorCode } from '../services/webrtcService';
import { socketService } from '../services/socketService';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import LightRays from '../components/LightRays';
import SEO from '../components/SEO';
import BlinkingDotsGrid from '../components/BlinkingDotsGrid';

const MEDIA_ERROR_MESSAGES: Record<MediaErrorCode, string> = {
  'not-supported': 'Your browser does not support camera access. Try Chrome or Firefox on HTTPS/localhost.',
  'permission-denied': 'Camera or microphone access was denied. Allow permissions in your browser settings and try again.',
  'not-found': 'No camera or microphone was found. Connect a device and try again.',
  'in-use': 'Camera is already in use by another application. Please close other apps using your camera and try again.',
  'unknown': 'Could not access your camera or microphone. Please check your device and try again.',
};

function getMediaErrorMessage(error: string): string {
  if (error in MEDIA_ERROR_MESSAGES) return MEDIA_ERROR_MESSAGES[error as MediaErrorCode];
  return error; // Show the raw error message if it's from Cloudflare or WebRTC
}

export default function VideoCall() {
  const { isSearching, isMatched, peerSocketId, peerData, messages, setMatch, endCall, addMessage } = useCallStore();
  const { user } = useAuthStore();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isAudioOnly = location.pathname.includes('/audio');

  useEffect(() => {
    const isAuth = useAuthStore.getState().isAuthenticated;
    const isPremium = useAuthStore.getState().user?.premiumStatus;
    const guestAccess = useAuthStore.getState().guestAccessEnabled;
    
    if (isAudioOnly && (!isAuth || !isPremium)) {
      navigate('/pricing');
    } else if (!isAudioOnly && !isAuth && !guestAccess) {
      navigate('/');
    }
  }, [isAudioOnly, navigate]);

  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(!isAudioOnly);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mediaError, setMediaError] = useState<MediaErrorCode | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(!isAudioOnly);
  const [localStreamVersion, setLocalStreamVersion] = useState(0);
  const [remoteStreamVersion, setRemoteStreamVersion] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [peerFlag, setPeerFlag] = useState<string | null>(null);
  const [countryCodeMap, setCountryCodeMap] = useState<Record<string, string>>({});
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isChatOpenRef = useRef(isChatOpen);

  const startLocalCamera = useCallback(async () => {
    const resolution = user?.premiumStatus ? '720' : '480'; // Could be 1080, but 720 is a good premium default
    if (isAudioOnly) {
      setIsCameraLoading(true);
      const { stream, error } = await webrtcService.startLocalStream(false, resolution);
      setIsCameraLoading(false);
      if (error) setMediaError(error);
      else setMediaError(null);
      return stream;
    }

    setIsCameraLoading(true);
    const { stream, error } = await webrtcService.startLocalStream(true, resolution);
    setIsCameraLoading(false);

    if (error) {
      setMediaError(error);
      return null;
    }

    setMediaError(null);
    setLocalStreamVersion((v) => v + 1);
    return stream;
  }, [isAudioOnly]);

  useEffect(() => {
    socketService.connect();

    const onMatchFound = async (data: {
      roomId: string;
      peerSocketId: string;
      peerData: typeof peerData;
      isInitiator: boolean;
    }) => {
      setMatch({ roomId: data.roomId, peerSocketId: data.peerSocketId, peerData: data.peerData });

      const onRemoteStream = (stream: MediaStream) => {
        attachStreamToVideo(remoteVideoRef.current, stream);
        setRemoteStreamVersion(v => v + 1);
      };

      const resolution = user?.premiumStatus ? '720' : '480';
      const { ok, error } = await webrtcService.initialize(
        data.peerSocketId,
        !isAudioOnly,
        onRemoteStream,
        resolution,
        data.isInitiator
      );

      if (!ok && !mediaError) {
        setMediaError((error as MediaErrorCode) || 'unknown');
      }

      attachStreamToVideo(localVideoRef.current, webrtcService.localStream);
    };

    const onOffer = async (data: { offer: RTCSessionDescriptionInit }) => {
      await webrtcService.handleOffer(data.offer);
    };

    const onAnswer = async (data: { answer: RTCSessionDescriptionInit }) => {
      await webrtcService.handleAnswer(data.answer);
    };

    const onIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
      await webrtcService.handleIceCandidate(data.candidate);
    };

    const onPartnerDisconnected = () => {
      handleSkip(true);
    };

    const onReceiveMessage = (data: { message: string; timestamp: Date }) => {
      addMessage({ from: 'peer', text: data.message, timestamp: data.timestamp });
      if (!isChatOpenRef.current) {
        setUnreadCount((c) => c + 1);
      }
    };

    const onTyping = (data: { isTyping: boolean }) => {
      setPeerTyping(data.isTyping);
    };

    socketService.on('match-found', onMatchFound);
    socketService.on('webrtc-offer', onOffer);
    socketService.on('webrtc-answer', onAnswer);
    socketService.on('webrtc-ice-candidate', onIceCandidate);
    socketService.on('partner-disconnected', onPartnerDisconnected);
    socketService.on('receive-message', onReceiveMessage);
    socketService.on('typing', onTyping);

    void startLocalCamera();
    handleStartSearch();

    return () => {
      socketService.off('match-found', onMatchFound);
      socketService.off('webrtc-offer', onOffer);
      socketService.off('webrtc-answer', onAnswer);
      socketService.off('webrtc-ice-candidate', onIceCandidate);
      socketService.off('partner-disconnected', onPartnerDisconnected);
      socketService.off('receive-message', onReceiveMessage);
      socketService.off('typing', onTyping);

      socketService.emit('cancel-search', { queueName: isAudioOnly ? 'random-audio-v2' : 'random-video-480-v2' });
      webrtcService.endCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAudioOnly && isVideoOn && !isCameraLoading) {
      attachStreamToVideo(localVideoRef.current, webrtcService.localStream);
    }
  }, [localStreamVersion, isVideoOn, isCameraLoading, isAudioOnly]);

  useEffect(() => {
    if (isMatched && remoteVideoRef.current && webrtcService.remoteStream) {
      attachStreamToVideo(remoteVideoRef.current, webrtcService.remoteStream);
    }
  }, [isMatched, remoteStreamVersion]);

  useEffect(() => {
    if (!isAudioOnly || !isMatched) return;

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let animationFrame: number;

    const startAudioAnalysis = () => {
      const stream = webrtcService.remoteStream;
      if (!stream || stream.getAudioTracks().length === 0) return;

      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevel = () => {
          analyser!.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          setAudioLevel(average / 255);
          animationFrame = requestAnimationFrame(updateLevel);
        };

        updateLevel();
      } catch (e) {
        console.error('Audio analysis error:', e);
      }
    };

    const interval = setInterval(() => {
      if (webrtcService.remoteStream?.getAudioTracks().length) {
        clearInterval(interval);
        startAudioAnalysis();
      }
    }, 500);

    return () => {
      clearInterval(interval);
      if (animationFrame) cancelAnimationFrame(animationFrame);
      microphone?.disconnect();
      analyser?.disconnect();
      if (audioContext?.state !== 'closed') {
        void audioContext?.close().catch(() => {});
      }
      setAudioLevel(0);
    };
  }, [isAudioOnly, isMatched]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetch('https://flagcdn.com/en/codes.json')
      .then(res => res.json())
      .then((data: Record<string, string>) => {
        const reverseMap: Record<string, string> = {};
        for (const [code, name] of Object.entries(data)) {
          if (!code.includes('-')) reverseMap[name] = code;
        }
        setCountryCodeMap(reverseMap);
      })
      .catch(err => console.error('Failed to fetch country codes:', err));
  }, []);

  useEffect(() => {
    if (peerData?.country && countryCodeMap[peerData.country]) {
      const code = countryCodeMap[peerData.country];
      setPeerFlag(`https://flagcdn.com/w40/${code}.png`);
    } else {
      setPeerFlag(null);
    }
  }, [peerData, countryCodeMap]);

  useEffect(() => {
    if (isChatOpen) setUnreadCount(0);
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  const handleStartSearch = (previousPeerSocketId?: string | null) => {
    useCallStore.getState().setSearching(true);
    
    // Read from secure router state
    const state = location.state as { targetCountry?: string; targetGender?: string } | null;
    const targetCountry = state?.targetCountry;
    const genderPrefStr = state?.targetGender;
    
    let targetGender = undefined;
    if (genderPrefStr === 'Opposite Gender') targetGender = 'opposite';
    else if (genderPrefStr === 'Same Gender') targetGender = 'same';
    else if (genderPrefStr === 'Random Gender') targetGender = 'random';

    const currentUser = useAuthStore.getState().user;
    const isAuth = useAuthStore.getState().isAuthenticated;

    socketService.emit('search', {
      userId: isAuth && currentUser ? currentUser._id : 'guest-' + Math.random().toString(36).substring(7),
      queueName: location.pathname.includes('/audio') ? 'random-audio-v2' : 'random-video-480-v2',
      targetCountry: targetCountry || undefined,
      targetGender,
      previousPeerSocketId
    });
  };

  const handleSkip = (isPartnerDisconnect = false) => {
    const currentState = useCallStore.getState();
    if (currentState.isSearching) return;
    webrtcService.endPeerConnection();
    if (currentState.peerSocketId && !isPartnerDisconnect) {
      socketService.emit('skip', { peerSocketId: currentState.peerSocketId });
    }
    handleStartSearch(currentState.peerSocketId);
  };

  const handleEndCall = () => {
    webrtcService.endCall();
    if (peerSocketId) socketService.emit('skip', { peerSocketId });
    endCall();
    navigate('/');
  };

  const handleReport = async () => {
    if (!peerData?.userId) {
      alert('Cannot report anonymous user.');
      return;
    }
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const authState = useAuthStore.getState();
      const res = await fetch(`${backendUrl}/api/users/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authState.accessToken && { Authorization: `Bearer ${authState.accessToken}` })
        },
        body: JSON.stringify({
          reportedUserId: peerData.userId,
          reason: isAudioOnly ? 'Audio Call Report' : 'Video Call Report'
        })
      });
      if (res.ok) {
        alert('User reported successfully. Thank you for keeping the community safe.');
      } else {
        alert('Failed to report user. You may need to log in.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to report user.');
    }
  };

  const toggleMic = () => {
    const enabled = !isMicOn;
    setIsMicOn(enabled);
    webrtcService.localStream?.getAudioTracks().forEach((t) => { t.enabled = enabled; });
  };

  const toggleVideo = async () => {
    const enabled = !isVideoOn;
    const resolution = user?.premiumStatus ? '720' : '480';
    const success = await webrtcService.setVideoEnabled(enabled, resolution);
    if (!success) {
      setMediaError('permission-denied');
      return;
    }
    setIsVideoOn(enabled);
    setMediaError(null);
    setLocalStreamVersion((v) => v + 1);
  };

  const handleRetryCamera = () => {
    setMediaError(null);
    void startLocalCamera();
  };

  const handleSendMessage = () => {
    const text = messageInput.trim();
    if (!text || !peerSocketId) return;
    socketService.emit('send-message', { peerSocketId, message: text });
    addMessage({ from: 'me', text, timestamp: new Date() });
    setMessageInput('');
    socketService.emit('typing', { peerSocketId, isTyping: false });
    setIsTyping(false);
  };

  const handleInputChange = (val: string) => {
    setMessageInput(val);
    if (!peerSocketId) return;
    if (!isTyping) {
      setIsTyping(true);
      socketService.emit('typing', { peerSocketId, isTyping: true });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.emit('typing', { peerSocketId, isTyping: false });
    }, 1500);
  };

  const showLocalPreview = !isAudioOnly && (webrtcService.localStream || isCameraLoading);

  return (
    <div className="h-screen w-full bg-black flex flex-col relative overflow-hidden select-none">
      <SEO 
        title="Random Video Call | Meet Strangers Instantly - Vibelly" 
        description="Start a random video call or voice chat instantly on Vibelly. Talk to strangers safely and anonymously in high quality."
        canonicalUrl="/call"
      />

      {isAudioOnly && (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center gap-2 py-2 bg-zinc-800/90 border-b border-zinc-700 backdrop-blur text-white text-sm shadow-md">
          <Headphones size={16} />
          <span className="font-medium">Audio-only mode</span>
        </div>
      )}

      {/* Media error banner */}
      {mediaError && (
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between gap-3 px-4 py-3 bg-red-950/90 border-b border-red-500/40 text-red-200 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle size={16} className="shrink-0 text-red-400" />
            <span className="truncate">{getMediaErrorMessage(mediaError)}</span>
          </div>
          <button
            onClick={handleRetryCamera}
            className="cursor-pointer shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-medium transition-colors"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      )}

      <div className="absolute inset-0 bg-[#15171B] flex items-center justify-center">
        {/* ─── Dot Grid ─── */}
        {(isSearching || !isMatched) && (
          <BlinkingDotsGrid />
        )}
        {isSearching || !isMatched ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 text-zinc-400"
          >
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-white/20 border-t-white animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                {isAudioOnly ? <Headphones size={28} className="text-white" /> : <Video size={28} className="text-white" />}
              </div>
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-white">Finding someone…</p>
              <p className="text-sm text-zinc-500 mt-1">Looking for a {isAudioOnly ? 'voice' : 'video'} partner</p>
              {!isAudioOnly && webrtcService.localStream && (
                <p className="text-xs text-green-400/80 mt-2">Camera ready</p>
              )}
            </div>
          </motion.div>
        ) : (
          <>
            {isAudioOnly && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-6 relative w-full h-full justify-center"
              >
                <div className="absolute inset-0 pointer-events-none z-0">
                  <LightRays
                    raysOrigin="top-center"
                    raysColor="#ffffff"
                    raysSpeed={0.6}
                    lightSpread={0.5}
                    rayLength={3}
                    followMouse={true}
                    mouseInfluence={0.1}
                    noiseAmount={0}
                    distortion={0}
                    className="w-full h-full"
                    pulsating={false}
                    fadeDistance={1.3}
                    saturation={1}
                  />
                </div>
                <div className="relative z-10 flex flex-col items-center">
                  {/* Outer wave 2 */}
                  <motion.div 
                    animate={{ 
                      scale: 1 + audioLevel * 1.5, 
                      opacity: Math.max(0, 0.3 - audioLevel * 0.3) 
                    }}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
                    className="absolute inset-0 rounded-full bg-white/10"
                  />
                  {/* Outer wave 1 */}
                  <motion.div 
                    animate={{ 
                      scale: 1 + audioLevel * 0.8, 
                      opacity: Math.max(0, 0.5 - audioLevel * 0.5) 
                    }}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
                    className="absolute inset-0 rounded-full bg-white/20"
                  />
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center shadow-2xl shadow-black/50 z-10 overflow-hidden">
                    {peerData?.profileImage ? (
                      <img src={peerData.profileImage} alt={peerData.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl font-bold text-white">
                        {peerData?.name?.[0]?.toUpperCase() ?? '?'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-center mt-4 relative z-10">
                  <p className="text-white font-semibold text-lg flex items-center justify-center gap-2">
                    {peerData?.name ?? 'Stranger'}
                    {peerFlag && <img src={peerFlag} alt="flag" className="w-5 h-4 rounded-sm object-cover" />}
                  </p>
                  {peerTyping ? (
                    <p className="text-zinc-400 text-sm italic animate-pulse mt-1">typing…</p>
                  ) : (
                    <p className="text-zinc-500 text-sm mt-1">
                      {audioLevel > 0.05 ? 'Speaking...' : 'Connected'}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
            <video 
              ref={remoteVideoRef} 
              className={isAudioOnly ? "hidden" : "w-full h-full object-contain bg-zinc-950"} 
              autoPlay 
              playsInline 
            />
          </>
        )}
      </div>

      {/* Local video PiP — visible while waiting or in call */}
      {showLocalPreview && (
        <motion.div
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          className="absolute top-6 right-6 w-44 h-64 bg-zinc-800 rounded-2xl overflow-hidden shadow-2xl border border-white/10 cursor-move z-10"
        >
          {isCameraLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-zinc-800">
              <div className="w-8 h-8 rounded-full border-2 border-violet-500/40 border-t-violet-500 animate-spin" />
              <span className="text-[10px] text-zinc-500">Starting camera…</span>
            </div>
          ) : isVideoOn && webrtcService.localStream ? (
            <video ref={localVideoRef} className="w-full h-full object-cover mirror" autoPlay playsInline muted />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
              <VideoOff size={28} className="text-zinc-500" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 text-[10px] text-zinc-400 font-medium bg-black/50 px-1.5 py-0.5 rounded">You</div>
        </motion.div>
      )}

      {!isAudioOnly && isMatched && peerTyping && (
        <div className="absolute top-16 left-6 z-10 text-xs text-zinc-300 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2">
          <span className="flex gap-0.5">
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
          Stranger is typing
        </div>
      )}

      {!isAudioOnly && isMatched && (
        <div className="absolute top-6 left-6 z-10 text-xs text-zinc-300 bg-black/60 backdrop-blur px-3 py-1.5 rounded-2xl flex flex-col gap-0.5 shadow-lg">
          <div className="flex items-center gap-2">
            {peerFlag && <img src={peerFlag} alt="flag" className="w-4 h-3 rounded-sm object-cover" />}
            <span className="font-medium text-white">{peerData?.name || 'Stranger'}</span>
          </div>
          {peerData?.username && !peerData.username.startsWith('guest-') && (
            <span className="text-[10px] text-violet-400 select-all cursor-text font-mono" title="Copy Username">
              @{peerData.username}
            </span>
          )}
        </div>
      )}

      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 md:gap-3 bg-zinc-900/80 backdrop-blur-xl p-2 md:p-3 rounded-full border border-white/10 shadow-2xl w-[95%] md:w-auto justify-center md:justify-start">

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleMic}
          className={`cursor-pointer p-3 md:p-3.5 rounded-full transition-colors ${isMicOn ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-1 ring-red-500/50'}`}
          title={isMicOn ? 'Mute mic' : 'Unmute mic'}
        >
          {isMicOn ? <Mic size={20} className="md:w-[22px] md:h-[22px]" /> : <MicOff size={20} className="md:w-[22px] md:h-[22px]" />}
        </motion.button>

        {!isAudioOnly && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => void toggleVideo()}
            className={`cursor-pointer p-3 md:p-3.5 rounded-full transition-colors ${isVideoOn ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-1 ring-red-500/50'}`}
            title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoOn ? <Video size={20} className="md:w-[22px] md:h-[22px]" /> : <VideoOff size={20} className="md:w-[22px] md:h-[22px]" />}
          </motion.button>
        )}

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsChatOpen((o) => !o)}
          className="cursor-pointer relative p-3 md:p-3.5 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors text-white"
          title="Toggle chat"
        >
          <MessageSquare size={20} className="md:w-[22px] md:h-[22px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
              {unreadCount}
            </span>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleEndCall}
          className="cursor-pointer p-3 md:p-3.5 rounded-full bg-red-500 hover:bg-red-600 transition-colors text-white shadow-lg shadow-red-500/30"
          title="End call"
        >
          <PhoneOff size={20} className="md:w-[22px] md:h-[22px]" />
        </motion.button>

        <div className="w-px h-8 bg-white/20 mx-1 hidden sm:block" />

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSkip(false)}
          className="cursor-pointer px-4 md:px-5 py-2.5 md:py-3 rounded-full bg-white hover:bg-zinc-200 transition-colors text-black font-semibold text-sm flex items-center gap-2 shadow-lg shadow-white/10"
          title="Skip to next person"
        >
          Next
          <SkipForward size={16} className="md:w-[18px] md:h-[18px]" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleReport}
          className="cursor-pointer p-3 md:p-3.5 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-500 hover:text-orange-400 hidden sm:block"
          title="Report user"
        >
          <AlertTriangle size={20} className="md:w-[22px] md:h-[22px]" />
        </motion.button>
      </div>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
            className="fixed inset-x-0 bottom-0 top-[30%] md:absolute md:inset-auto md:top-0 md:right-0 md:bottom-0 md:w-80 bg-zinc-900/95 backdrop-blur-xl border-t md:border-t-0 md:border-l border-white/10 flex flex-col z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-2xl rounded-t-3xl md:rounded-none"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-white" />
                <span className="text-sm font-semibold text-white">Chat</span>
                {isMatched && (
                  <span className="text-[10px] bg-zinc-500/20 text-zinc-400 px-1.5 py-0.5 rounded-full">Connected</span>
                )}
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="cursor-pointer text-zinc-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-zinc-700">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-zinc-600 text-sm text-center">
                    {isMatched ? 'Say hi 👋' : 'Connect to start chatting'}
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm break-words ${
                        msg.from === 'me'
                          ? 'bg-white text-black rounded-br-sm font-medium shadow-sm'
                          : 'bg-zinc-800 text-white rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))
              )}

              {peerTyping && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 px-4 py-2 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t border-white/10">
              <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isMatched ? 'Type a message…' : 'Waiting for match…'}
                  disabled={!isMatched}
                  className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none disabled:opacity-50"
                />
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={handleSendMessage}
                  disabled={!isMatched || !messageInput.trim()}
                  className="cursor-pointer text-white hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
