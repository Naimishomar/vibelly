import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Radio, Users, Copy, Check, Video, Square, Play, Loader2, RefreshCw, Lock, ShieldCheck, Image as ImageIcon, EyeOff, Send, Smile, Flag, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import BlinkingDotsGrid from '../components/BlinkingDotsGrid';
import { socketService } from '../services/socketService';
import { liveService, attachStreamToVideo } from '../services/liveService';
import { checkLiveAccess, fetchLiveEarnings, reportUser, getCreatorPaymentDetails, checkCreatorSubscription, type CreatorPaymentDetails } from '../services/livePaymentService';
import { uploadImage } from '../services/uploadService';
import { useAuthStore } from '../store/useAuthStore';

type Mode = 'browse' | 'live';

interface LiveStream {
  roomCode: string;
  title: string;
  creatorName: string;
  creatorProfileImage?: string;
  creatorUserId?: string;
  thumbnail: string;
  price: number;
  isPrivate: boolean;
  viewerCount: number;
}

interface ChatComment {
  id: string;
  user: { _id: string; name: string; username: string; profileImage: string };
  text: string;
  timestamp: string;
}

const genRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏', '🙌', '💯'];

export default function LiveStream() {
  const [mode, setMode] = useState<Mode>('browse');
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  // Creator state
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [roomCode] = useState(genRoomCode);
  const [isGoingLive, setIsGoingLive] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [livePrice, setLivePrice] = useState(0);
  const [livePrivate, setLivePrivate] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [earnings, setEarnings] = useState<number | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Viewer state
  const [watching, setWatching] = useState(false);
  const [watchedTitle, setWatchedTitle] = useState('');
  const [watchedCreator, setWatchedCreator] = useState('');
  const [joinError, setJoinError] = useState('');
  const [comments, setComments] = useState<ChatComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [reactions, setReactions] = useState<{ id: number; emoji: string }[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);
  
  // Payment details modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentModalDetails, setPaymentModalDetails] = useState<CreatorPaymentDetails | null>(null);
  const [paymentModalPrice, setPaymentModalPrice] = useState(0);
  const [loadingPaymentDetails, setLoadingPaymentDetails] = useState(false);

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const accessTokenRef = useRef<string | null>(null);
  const activeRoomRef = useRef<string>('');

  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    socketService.connect();
    loadStreams();
    fetchLiveEarnings().then((d) => d && setEarnings(d.liveEarnings || 0)).catch(() => {});
    const interval = setInterval(loadStreams, 5000);

    // Deep-link support: /live?room=CODE
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      const timer = setTimeout(() => joinByCode(roomParam), 800);
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live comments + reactions
  useEffect(() => {
    liveService.onComment((comment: ChatComment) => {
      setComments((prev) => [...prev.slice(-99), comment]);
    });
    liveService.onReaction((reaction) => {
      setReactions((prev) => [...prev.slice(-19), { id: reaction.id, emoji: reaction.emoji }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2500);
    });
    return () => liveService.clearCommentHandlers();
  }, []);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [comments]);

  const loadStreams = async () => {
    setIsLoadingList(true);
    try {
      const result = await liveService.fetchLiveStreams();
      setStreams(result);
    } catch {
      setStreams([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleThumbnailPick = (file: File) => {
    setThumbnail(file);
    setThumbnailUrl(URL.createObjectURL(file));
  };

  const startLive = async () => {
    const parsedPrice = Math.floor(Number(price));
    if (parsedPrice > 0 && !isAuthenticated) {
      alert('Please sign in to start a paid stream.');
      return;
    }

    // Check if creator has active subscription (₹500/month) to enable live streaming
    const subStatus = await checkCreatorSubscription();
    if (!subStatus?.active) {
      alert('You need an active creator subscription (₹500/month) to go live. Please activate it from your profile.');
      return;
    }

    let thumbUrl = '';
    if (thumbnail) {
      thumbUrl = (await uploadImage(thumbnail, 'thumbnail')) || '';
    }

    // Listen for start rejection (paid stream requires verified creator)
    const failHandler = (data: any) => {
      socketService.off('live:start-failed', failHandler);
      setIsGoingLive(false);
      if (data?.needsVerification) {
        alert('You must get your creator profile verified before starting a paid stream. Visit your profile to verify.');
      } else {
        alert(data?.message || 'Could not start the stream');
      }
    };
    socketService.on('live:start-failed', failHandler);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user', frameRate: { max: 15 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      attachStreamToVideo(localVideoRef.current, stream);
      const name = user?.name || user?.username || 'Anonymous';
      await liveService.startStream(
        stream,
        roomCode,
        title.trim() || 'Live Stream',
        name,
        setViewerCount,
        parsedPrice,
        useAuthStore.getState().accessToken || undefined,
        thumbUrl,
        isPrivate,
        user?.profileImage || ''
      );
      socketService.off('live:start-failed', failHandler);
      setIsGoingLive(false);
      setLivePrice(parsedPrice);
      setLivePrivate(isPrivate);
      setIsLive(true);
      setViewerCount(0);
    } catch (err) {
      socketService.off('live:start-failed', failHandler);
      console.error('Failed to start stream:', err);
      setIsGoingLive(false);
      alert('Could not access camera/mic. Please check permissions.');
    }
  };

  const endLive = () => {
    liveService.stopStream();
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setIsLive(false);
    setLivePrice(0);
    setLivePrivate(false);
    setViewerCount(0);
    setThumbnail(null);
    setThumbnailUrl('');
    loadStreams();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const attemptJoin = async (room: string) => {
    setWatching(true);
    setJoinError('');
    setComments([]);
    activeRoomRef.current = room;
    try {
      const info = await liveService.joinStream(
        room,
        (stream) => attachStreamToVideo(remoteVideoRef.current, stream),
        () => handleStreamEnded(),
        accessTokenRef.current || undefined
      );
      setWatchedTitle(info.title);
      setWatchedCreator(info.creatorName);
    } catch (err: any) {
      setWatching(false);
      activeRoomRef.current = '';
      if (err?.requiresPayment) {
        await promptPay(room, err?.price);
        return;
      }
      setJoinError(err instanceof Error ? err.message : 'Failed to join stream');
    }
  };

  const promptPay = async (room: string, price: number) => {
    if (!isAuthenticated) {
      setJoinError('Please sign in to subscribe to this stream.');
      return;
    }
    
    // Find the stream to get creator info
    const stream = streams.find((s) => s.roomCode === room);
    if (!stream || !stream.creatorUserId) {
      setJoinError('Stream not found');
      return;
    }
    
    setLoadingPaymentDetails(true);
    const details = await getCreatorPaymentDetails();
    setLoadingPaymentDetails(false);
    
    setPaymentModalDetails(details);
    setPaymentModalPrice(price);
    setShowPaymentModal(true);
  };

  const joinByCode = async (code?: string) => {
    const room = (code || joinCode).trim().toUpperCase();
    if (!room) return;
    setJoinError('');

    const stream = streams.find((s) => s.roomCode === room);
    if (stream && stream.price > 0) {
      const access = await checkLiveAccess(room);
      if (access?.access) {
        accessTokenRef.current = access.token || null;
        await attemptJoin(room);
      } else if (access && !access.access) {
        await promptPay(room, access.price);
      } else {
        await attemptJoin(room);
      }
    } else {
      await attemptJoin(room);
    }
  };

  const handleStreamEnded = () => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setWatching(false);
    liveService.leaveStream();
    activeRoomRef.current = '';
    accessTokenRef.current = null;
    loadStreams();
  };

  const leaveWatch = () => {
    handleStreamEnded();
  };

  const sendComment = () => {
    const text = commentText.trim();
    if (!text || !activeRoomRef.current) return;
    liveService.sendComment(
      activeRoomRef.current,
      { _id: user?._id || '', name: user?.name || 'Anonymous', username: user?.username || '', profileImage: user?.profileImage || '' },
      text
    );
    setCommentText('');
  };

  const sendEmoji = (emoji: string) => {
    if (!activeRoomRef.current) return;
    liveService.sendReaction(activeRoomRef.current, emoji, user?._id);
  };

  const submitReport = async () => {
    const stream = streams.find((s) => s.roomCode === activeRoomRef.current);
    const creatorId = stream?.creatorUserId;
    const reason = reportReason.trim();
    if (!creatorId || !reason) return;
    await reportUser({
      reportedUserId: creatorId,
      reason,
      type: 'paid-no-show',
      roomCode: activeRoomRef.current,
      streamTitle: watchedTitle,
      amountPaid: livePrice || undefined,
    });
    setShowReport(false);
    setReportReason('');
    setReportSent(true);
    setTimeout(() => setReportSent(false), 3000);
  };

  useEffect(() => {
    return () => {
      if (isLive) liveService.stopStream();
      else if (watching) liveService.leaveStream();
    };
  }, [isLive, watching]);

  return (
    <div className="min-h-screen bg-[#15171B] text-white flex flex-col font-sans relative overflow-hidden">
      <SEO title="Live Streams | Vibelly" description="Start a live stream or watch creators stream in real time on Vibelly. Free, anonymous, and peer-to-peer." />
      <BlinkingDotsGrid />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-10">
          {/* Tabs */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <button
              onClick={() => { setMode('browse'); setWatching(false); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${mode === 'browse' ? 'bg-white text-black' : 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800'}`}
            >
              <Play size={16} /> Watch Live
            </button>
            <button
              onClick={() => { setMode('live'); if (watching) leaveWatch(); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${mode === 'live' ? 'bg-red-500 text-white' : 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800'}`}
            >
              <Radio size={16} /> Go Live
            </button>
          </div>

          {mode === 'browse' && (
            <div>
              {/* Watch area */}
              {watching ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-2xl overflow-hidden bg-black aspect-video relative border border-white/10">
                      <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
                      <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 px-2.5 py-1 rounded-full text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <h2 className="text-xl font-semibold">{watchedTitle}</h2>
                          <p className="text-sm text-zinc-400">Streaming by {watchedCreator}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowReport(true)}
                          className="flex items-center gap-1.5 bg-zinc-800/60 text-red-400 px-3 py-2 rounded-xl text-xs font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Report stream"
                        >
                          <Flag size={14} /> Report
                        </button>
                        <button
                          onClick={leaveWatch}
                          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          <Square size={14} /> Leave
                        </button>
                      </div>
                    </div>
                    {reportSent && <p className="text-emerald-400 text-sm">Report submitted. Thanks for keeping Vibelly safe.</p>}
                  </div>

                  {/* Live chat panel */}
                  <div className="bg-zinc-900/60 border border-white/10 rounded-2xl flex flex-col h-[480px] overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Live Chat</h3>
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Users size={14} /> <span className="text-xs">{streams.find((s) => s.roomCode === activeRoomRef.current)?.viewerCount || 0}</span>
                      </div>
                    </div>

                    {/* Reaction overlay */}
                    <div className="relative flex-1 overflow-hidden">
                      <div ref={chatScrollRef} className="absolute inset-0 overflow-y-auto px-4 py-3 space-y-2">
                        {comments.length === 0 ? (
                          <p className="text-zinc-600 text-sm text-center mt-8">No messages yet. Say hi!</p>
                        ) : (
                          comments.map((c) => (
                            <div key={c.id} className="flex items-start gap-2">
                              <div className="w-6 h-6 rounded-full bg-zinc-700 flex-shrink-0 overflow-hidden">
                                {c.user.profileImage ? <img src={c.user.profileImage} alt="" className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-[10px] font-bold">{c.user.name[0]?.toUpperCase()}</span>}
                              </div>
                              <div className="text-sm">
                                <span className="text-zinc-400 font-medium mr-1.5">{c.user.name}</span>
                                <span className="text-zinc-100 break-words">{c.text}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {/* Floating reactions */}
                      {reactions.map((r) => (
                        <span key={r.id} className="absolute bottom-2 left-1/2 -translate-x-1/2 text-3xl animate-bounce pointer-events-none">{r.emoji}</span>
                      ))}
                    </div>

                    <div className="border-t border-white/10 p-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 bg-zinc-800 rounded-lg text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer">
                          <Smile size={18} />
                        </button>
                        <input
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') sendComment(); }}
                          placeholder="Say something…"
                          className="flex-1 bg-zinc-800/60 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-white/30 transition-colors placeholder:text-zinc-600"
                        />
                        <button onClick={sendComment} className="p-2 bg-white text-black rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
                          <Send size={16} />
                        </button>
                      </div>
                      {showEmojiPicker && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {QUICK_EMOJIS.map((e) => (
                            <button key={e} onClick={() => sendEmoji(e)} className="text-xl hover:scale-125 transition-transform cursor-pointer">{e}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Join by code */}
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-zinc-900/60 border border-white/10 rounded-2xl p-5 mb-8">
                    <div className="flex-1">
                      <label className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">Enter Room Code</label>
                      <input
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && joinByCode()}
                        placeholder="e.g. AB123"
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white uppercase outline-none focus:border-white/30 transition-colors placeholder:text-zinc-600"
                      />
                      {joinError && <p className="text-red-400 text-xs mt-1.5">{joinError}</p>}
                    </div>
                    <button
                      onClick={() => joinByCode()}
                      disabled={!joinCode.trim()}
                      className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-medium disabled:opacity-40 hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <Play size={16} /> Join
                    </button>
                  </div>

                  {/* Active streams */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live Now
                    </h2>
                    <button onClick={loadStreams} className="text-zinc-400 hover:text-white transition-colors cursor-pointer">
                      <RefreshCw size={18} />
                    </button>
                  </div>

                  {isLoadingList ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="animate-spin text-white/60 w-8 h-8" />
                    </div>
                  ) : streams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-zinc-500 py-16 bg-zinc-900/40 rounded-2xl border border-white/5">
                      <Radio size={48} className="mb-4 opacity-20" />
                      <p>No one is live right now.</p>
                      <button onClick={() => setMode('live')} className="mt-4 text-sm font-medium text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors cursor-pointer">
                        Start the first stream
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {streams.map((s) => (
                        <div key={s.roomCode} className="group rounded-2xl bg-zinc-900/60 border border-white/10 overflow-hidden hover:bg-zinc-800/80 transition-colors">
                          {/* Thumbnail */}
                          <button onClick={() => joinByCode(s.roomCode)} className="w-full cursor-pointer">
                            <div className="relative aspect-video bg-black overflow-hidden">
                              {s.thumbnail ? (
                                <img src={s.thumbnail} alt={s.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                  <Video size={36} />
                                </div>
                              )}
                              <span className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                              </span>
                              {s.price > 0 && (
                                <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-semibold text-amber-300">
                                  <Lock size={10} /> ₹{s.price}
                                </span>
                              )}
                              <span className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur px-2 py-0.5 rounded-full text-[10px] text-zinc-300">
                                <Users size={10} /> {s.viewerCount}
                              </span>
                            </div>
                          </button>
                          {/* Meta: avatar + title (YouTube style) */}
                          <div className="p-3 flex gap-3">
                            <button onClick={() => s.creatorUserId && window.location.assign(`/creator/${s.creatorUserId}`)} className="flex-shrink-0 cursor-pointer">
                              <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden">
                                {s.creatorProfileImage ? <img src={s.creatorProfileImage} alt="" className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-xs font-bold">{s.creatorName[0]?.toUpperCase()}</span>}
                              </div>
                            </button>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-white leading-snug text-sm line-clamp-2">{s.title}</h3>
                              <Link to={`/creator/${s.creatorUserId}`} className="text-xs text-zinc-400 hover:text-white transition-colors">{s.creatorName}</Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {mode === 'live' && (
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden">
              {!isLive ? (
                <div className="p-6 md:p-8">
                  <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                    <Radio size={22} className="text-red-400" /> Start Streaming
                  </h2>
                  {earnings !== null && (
                    <div className="flex items-center gap-2 mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-300">
                      <ShieldCheck size={16} />
                      <span>You've earned <strong className="font-semibold">₹{earnings.toLocaleString('en-IN')}</strong> from live streams (70% per subscription).</span>
                    </div>
                  )}
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">Stream Title</label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Morning hangout ☕"
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/30 transition-colors placeholder:text-zinc-600"
                      />
                    </div>

                    {/* Thumbnail upload */}
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">Thumbnail</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 bg-zinc-800 rounded-xl px-4 py-3 cursor-pointer hover:bg-zinc-700 transition-colors text-sm">
                          <ImageIcon size={16} />
                          {thumbnail ? 'Change' : 'Upload'} Thumbnail
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleThumbnailPick(e.target.files[0])} />
                        </label>
                        {thumbnailUrl && <img src={thumbnailUrl} alt="Thumbnail preview" className="w-20 h-12 object-cover rounded-lg border border-white/10" />}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">
                        Price to watch (₹, per subscription — leave empty for free)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g. 49"
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/30 transition-colors placeholder:text-zinc-600"
                      />
                      {Number(price) > 0 && (
                        <p className="text-xs text-zinc-400 mt-1.5 flex items-center gap-1">
                          <Lock size={11} /> Paid stream — you earn 70%, Vibelly takes 30%. Requires a verified creator profile.
                        </p>
                      )}
                    </div>

                    {/* Private toggle */}
                    <label className="flex items-center justify-between gap-3 bg-zinc-900/60 border border-white/10 rounded-xl px-4 py-3 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <EyeOff size={16} className="text-zinc-400" />
                        <div>
                          <span className="text-sm text-zinc-300">Private stream</span>
                          <p className="text-[11px] text-zinc-500">Hidden from the browse list. Only people with the room code can join.</p>
                        </div>
                      </div>
                      <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="w-4 h-4 accent-red-500 cursor-pointer" />
                    </label>

                    <div>
                      <label className="block text-xs text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">Room Code</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 font-mono text-lg tracking-widest">
                          {roomCode}
                        </div>
                        <button onClick={copyCode} className="p-3 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors cursor-pointer">
                          {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={startLive}
                      disabled={isGoingLive}
                      className="flex items-center justify-center gap-2 w-full bg-red-500 text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isGoingLive ? <Loader2 className="animate-spin w-5 h-5" /> : <Video size={18} />}
                      {isGoingLive ? 'Starting…' : 'Go Live'}
                    </button>
                    <p className="text-xs text-zinc-500">
                      Viewers connect directly to your browser (peer-to-peer). Each room supports up to <strong>10 viewers</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 md:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1.5 bg-red-500 px-2.5 py-1 rounded-full text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                      </span>
                      {livePrice > 0 && (
                        <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full text-xs font-semibold">
                          <Lock size={11} /> ₹{livePrice} per subscription
                        </span>
                      )}
                      {livePrivate && (
                        <span className="flex items-center gap-1 bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full text-xs font-semibold">
                          <EyeOff size={11} /> Private
                        </span>
                      )}
                      <span className="text-sm text-zinc-300 flex items-center gap-1.5">
                        <Users size={14} /> {viewerCount} / 10 watching
                      </span>
                    </div>
                    <button
                      onClick={endLive}
                      className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <Square size={14} /> End Stream
                    </button>
                  </div>
                  <div className="rounded-2xl overflow-hidden bg-black aspect-video relative border border-white/10">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
                    {thumbnailUrl && <img src={thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none" />}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <span>Share this code:</span>
                    <span className="font-mono font-bold tracking-widest text-white bg-zinc-800 px-3 py-1 rounded-lg">{roomCode}</span>
                    <button onClick={copyCode} className="text-zinc-400 hover:text-white transition-colors cursor-pointer">
                      {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        <Footer />
      </div>

      {/* Payment Details Modal (UPI/Bank) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => { setShowPaymentModal(false); setPaymentModalDetails(null); }}>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Access Paid Stream</h3>
              <button onClick={() => { setShowPaymentModal(false); setPaymentModalDetails(null); }} className="text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Lock size={16} className="text-amber-400" />
                  <span className="font-medium">₹{paymentModalPrice} to join</span>
                </div>
                <p className="text-xs text-zinc-400">Pay the creator directly via UPI or Bank Transfer. After payment, share the transaction screenshot with the creator so they can add you as a Prime Member.</p>
              </div>

              {loadingPaymentDetails ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="animate-spin w-6 h-6 text-zinc-400" />
                </div>
              ) : paymentModalDetails ? (
                <div className="space-y-3">
                  {paymentModalDetails.upiId && (
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-sky-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-500">UPI ID</span>
                        <button onClick={() => { navigator.clipboard.writeText(paymentModalDetails.upiId || ''); }} className="text-xs text-sky-400 hover:text-sky-300">Copy</button>
                      </div>
                      <div className="font-mono text-sky-400 break-all">{paymentModalDetails.upiId}</div>
                      <p className="text-xs text-zinc-500 mt-2">Open your UPI app (GPay, PhonePe, Paytm) and send ₹{paymentModalPrice} to this ID</p>
                    </div>
                  )}
                  {paymentModalDetails.bankAccount && (
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-emerald-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-500">Bank Account</span>
                        <button onClick={() => { navigator.clipboard.writeText(paymentModalDetails.bankAccount || ''); }} className="text-xs text-emerald-400 hover:text-emerald-300">Copy</button>
                      </div>
                      <div className="font-mono text-emerald-400 whitespace-pre-wrap break-all">{paymentModalDetails.bankAccount}</div>
                      <p className="text-xs text-zinc-500 mt-2">Transfer ₹{paymentModalPrice} via IMPS/NEFT/UPI to this account</p>
                    </div>
                  )}
                  {!paymentModalDetails.upiId && !paymentModalDetails.bankAccount && (
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-red-500/20 text-center">
                      <p className="text-red-400 text-sm">This creator hasn't set up payment details yet.</p>
                      <p className="text-xs text-zinc-500 mt-1">Please contact them directly to arrange payment.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-red-500/20 text-center">
                  <p className="text-red-400 text-sm">Could not load payment details.</p>
                  <p className="text-xs text-zinc-500 mt-1">Please contact the creator directly.</p>
                </div>
              )}

              <div className="bg-zinc-800/30 rounded-xl p-3 border border-white/5 text-center">
                <p className="text-xs text-zinc-400 mb-2">After paying, tell the creator your username. They will add you as a Prime Member and you'll get instant access.</p>
                <button 
                  onClick={() => { setShowPaymentModal(false); setPaymentModalDetails(null); }}
                  className="w-full bg-zinc-700 text-white py-2 rounded-xl text-sm hover:bg-zinc-600 transition-colors"
                >
                  Close - I'll Pay Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowReport(false)}>
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Flag size={18} className="text-red-400" />
              <h3 className="text-lg font-semibold">Report this stream</h3>
            </div>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue — e.g. stream didn't start after payment, illegal content, impersonation…"
              className="w-full bg-zinc-800/60 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 transition-colors placeholder:text-zinc-600 min-h-[100px]"
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setShowReport(false)} className="px-4 py-2 rounded-xl text-sm text-zinc-300 hover:bg-white/10 transition-colors cursor-pointer">Cancel</button>
              <button onClick={submitReport} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer">
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
