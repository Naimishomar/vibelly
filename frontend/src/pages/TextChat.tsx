import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, SkipForward, AlertTriangle, Send, X
} from 'lucide-react';
import { useCallStore } from '../store/callStore';
import { socketService } from '../services/socketService';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import SEO from '../components/SEO';
import BlinkingDotsGrid from '../components/BlinkingDotsGrid';

export default function TextChat() {
  const { isSearching, isMatched, peerSocketId, peerData, messages, setMatch, endCall, addMessage } = useCallStore();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [messageInput, setMessageInput] = useState('');
  const [peerTyping, setPeerTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Component Mount
    const state = location.state as { targetCountry?: string; targetGender?: string } | null;
    handleStartSearch(null, state?.targetCountry, state?.targetGender);

    const onMatchFound = (data: any) => {
      setMatch(data);
      setPeerTyping(false);
    };

    const onPartnerDisconnected = () => {
      addMessage({ from: 'system', text: 'Partner disconnected.', timestamp: new Date() });
      setTimeout(() => {
        handleSkip(true);
      }, 1500);
    };

    const onReceiveMessage = (data: { peerSocketId: string, message: string, timestamp: Date }) => {
      addMessage({ from: 'them', text: data.message, timestamp: data.timestamp });
    };

    const onTyping = (data: { peerSocketId: string, isTyping: boolean }) => {
      setPeerTyping(data.isTyping);
    };

    socketService.on('match-found', onMatchFound);
    socketService.on('partner-disconnected', onPartnerDisconnected);
    socketService.on('receive-message', onReceiveMessage);
    socketService.on('typing', onTyping);

    return () => {
      socketService.off('match-found', onMatchFound);
      socketService.off('partner-disconnected', onPartnerDisconnected);
      socketService.off('receive-message', onReceiveMessage);
      socketService.off('typing', onTyping);

      socketService.emit('cancel-search', { queueName: 'random-text' });
      endCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartSearch = (previousPeerSocketId?: string | null, stateTargetCountry?: string, stateTargetGender?: string) => {
    useCallStore.getState().setSearching(true);
    
    // Read from secure router state on mount, or fallback
    const state = location.state as { targetCountry?: string; targetGender?: string } | null;
    const targetCountry = stateTargetCountry || state?.targetCountry;
    const genderPrefStr = stateTargetGender || state?.targetGender;
    
    let targetGender = undefined;
    if (genderPrefStr === 'Girl') targetGender = 'female';
    else if (genderPrefStr === 'Boy') targetGender = 'male';
    else if (genderPrefStr === 'Random Gender') targetGender = 'random';

    const currentUser = useAuthStore.getState().user;
    const isAuth = useAuthStore.getState().isAuthenticated;

    socketService.emit('search', {
      userId: isAuth && currentUser ? currentUser._id : 'guest-' + Math.random().toString(36).substring(7),
      queueName: 'random-text',
      targetCountry: targetCountry || undefined,
      targetGender,
      previousPeerSocketId
    });
  };

  const handleSkip = (isPartnerDisconnect = false) => {
    const currentState = useCallStore.getState();
    if (currentState.isSearching) return;
    
    if (currentState.peerSocketId && !isPartnerDisconnect) {
      socketService.emit('skip', { peerSocketId: currentState.peerSocketId });
    }
    
    // Reset state and re-queue
    currentState.endCall();
    currentState.setSearching(true); 
    handleStartSearch(currentState.peerSocketId);
  };

  const handleEndChat = () => {
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
          reason: 'Text Chat Report'
        })
      });
      if (res.ok) {
        alert('User reported successfully.');
      } else {
        alert('Failed to report user.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to report user.');
    }
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

  return (
    <div className="min-h-screen h-[100dvh] bg-[#15171B] text-white flex flex-col font-sans overflow-hidden">
      <SEO title="Random Text Chat | Talk to Strangers" description="Instant text chat with random strangers online." />
      <BlinkingDotsGrid />
      
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-black/40 backdrop-blur-md border-b border-white/5 z-20">
        <div className="flex items-center gap-4">
          <div className="text-xl sm:text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity" onClick={handleEndChat} style={{ fontFamily: '"Playfair Display", serif' }}>
            Vibelly
          </div>
          {peerData?.country && peerData.country !== 'unspecified' && (
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs text-zinc-300 border border-white/10">
              Matched in {peerData.country}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={handleReport} className="text-zinc-500 hover:text-red-400 p-2 rounded-full transition-colors group relative">
            <AlertTriangle size={20} />
            <span className="absolute top-10 right-0 bg-zinc-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Report User</span>
          </button>
          
          <button
            onClick={() => handleSkip(false)}
            disabled={isSearching}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <SkipForward size={16} />
            <span className="hidden sm:inline">Skip</span>
          </button>

          <button onClick={handleEndChat} className="bg-red-500/10 text-red-500 hover:bg-red-500/20 p-2 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative flex flex-col z-10 w-full max-w-4xl mx-auto">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 pb-20">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex flex-col ${msg.from === 'me' ? 'items-end' : msg.from === 'system' ? 'items-center' : 'items-start'}`}
              >
                {msg.from === 'system' ? (
                  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs text-zinc-400 my-4 shadow-sm">
                    {msg.text}
                  </div>
                ) : (
                  <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-md ${
                    msg.from === 'me'
                      ? 'bg-blue-600 text-white rounded-br-sm shadow-blue-900/20'
                      : 'bg-zinc-800 text-zinc-100 rounded-bl-sm border border-white/5'
                  }`}>
                    <p className="text-sm sm:text-base break-words whitespace-pre-wrap">{msg.text}</p>
                  </div>
                )}
              </motion.div>
            ))}
            
            {peerTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-start">
                <div className="bg-zinc-800 text-zinc-400 rounded-2xl rounded-bl-sm px-4 py-3 text-sm flex items-center gap-1 border border-white/5 shadow-md">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* Searching Overlay */}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#15171B]/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 rounded-full animate-pulse" />
                <div className="relative w-20 h-20 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                  <MessageSquare size={32} className="text-white animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Finding a match...</h3>
              <p className="text-zinc-400 text-sm">Waiting for someone to connect</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#15171B] via-[#15171B]/95 to-transparent pt-10">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex items-center gap-3 w-full bg-zinc-800/90 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-2xl focus-within:border-white/20 transition-all focus-within:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
          >
            <input
              type="text"
              value={messageInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={isSearching ? "Connecting..." : "Type a message..."}
              disabled={isSearching || !isMatched}
              className="flex-1 bg-transparent text-white px-3 py-2 text-sm sm:text-base outline-none placeholder:text-zinc-500 min-w-0"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!messageInput.trim() || isSearching || !isMatched}
              className="p-2.5 bg-white text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-200 transition-colors shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.15)] active:scale-95"
            >
              <Send size={18} className={messageInput.trim() ? "translate-x-0.5" : ""} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
