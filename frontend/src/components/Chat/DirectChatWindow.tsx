import { useState, useEffect, useRef } from 'react';
import { Send, Clock, Paperclip, Loader2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface DirectChatWindowProps {
  socket: any;
  currentUser: any;
  selectedUser: any;
  onBack?: () => void;
}

interface Message {
  id: string;
  senderId: string;
  message: string;
  attachmentUrl?: string;
  attachmentType?: string;
  timestamp: string;
}

export default function DirectChatWindow({ socket, currentUser, selectedUser, onBack }: DirectChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authState = useAuthStore.getState();

  // Fetch history when selectedUser changes
  useEffect(() => {
    if (!selectedUser || !currentUser) return;

    const fetchHistory = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const token = localStorage.getItem('vibe_token') || authState.accessToken;
        const res = await fetch(`${backendUrl}/api/chat/history/${currentUser._id || currentUser.username}/${selectedUser.userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      } catch (e) {
        console.error('Failed to fetch chat history', e);
      }
    };

    fetchHistory();
  }, [selectedUser, currentUser]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleReceiveMessage = (msg: Message) => {
      // Only append if the message is from the selected user
      if (msg.senderId === selectedUser.userId || msg.senderId === currentUser._id || msg.senderId === currentUser.username) {
        setMessages((prev) => {
          // Prevent duplicates (though socket and fetch shouldn't overlap if handled properly)
          if (prev.find(m => m.id === msg.id)) return prev;
          
          // Apply ephemeral cap locally just to keep UI in sync
          const newMessages = [...prev, msg];
          return newMessages.slice(-25); // Keep only last 25
        });
      }
    };

    const handleChatError = (err: { message: string }) => {
      alert(err.message);
      // Remove optimistic message if needed, but alert is enough for now
      setMessages(prev => prev.filter(m => m.id !== 'optimistic'));
    };

    const handleReceiveTyping = (data: { senderId: string, isTyping: boolean }) => {
      if (data.senderId === selectedUser.userId) {
        setIsTyping(data.isTyping);
      }
    };

    socket.on('receive-direct-message', handleReceiveMessage);
    socket.on('chat-error', handleChatError);
    socket.on('receive-direct-typing', handleReceiveTyping);

    return () => {
      socket.off('receive-direct-message', handleReceiveMessage);
      socket.off('chat-error', handleChatError);
      socket.off('receive-direct-typing', handleReceiveTyping);
    };
  }, [socket, selectedUser, currentUser]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent, url?: string, type?: string) => {
    e?.preventDefault();
    if ((!inputText.trim() && !url) || !socket || !currentUser || !selectedUser) return;

    const senderId = currentUser._id || currentUser.username;
    const msgObj = {
      senderId,
      targetSocketId: selectedUser.socketId,
      targetUserId: selectedUser.userId,
      message: inputText.trim(),
      attachmentUrl: url,
      attachmentType: type
    };

    socket.emit('send-direct-message', msgObj);

    // Optimistic update
    const optimisticMsg: Message = {
      id: 'optimistic', // use fixed ID so we can remove it if error happens
      senderId,
      message: inputText.trim(),
      attachmentUrl: url,
      attachmentType: type,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => {
      const newMessages = [...prev, optimisticMsg];
      return newMessages.slice(-25);
    });
    
    setInputText('');
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('direct-typing', {
      senderId,
      targetUserId: selectedUser.userId,
      isTyping: false
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    
    if (socket && selectedUser && currentUser) {
      socket.emit('direct-typing', {
        senderId: currentUser._id || currentUser.username,
        targetUserId: selectedUser.userId,
        isTyping: true
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('direct-typing', {
          senderId: currentUser._id || currentUser.username,
          targetUserId: selectedUser.userId,
          isTyping: false
        });
      }, 2000);
    }
  };

  const handleReport = async () => {
    if (!selectedUser || !currentUser) return;
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/users/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.accessToken}`
        },
        body: JSON.stringify({
          reportedUserId: selectedUser.userId,
          reason: 'Direct Chat Report'
        })
      });
      if (res.ok) {
        alert('User reported successfully. Thank you for keeping the community safe.');
      } else {
        alert('Failed to report user.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to report user.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be under 10MB");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('socketId', socket.id);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/upload/ephemeral`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authState.accessToken}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const type = file.type.startsWith('video/') ? 'video' : 'image';
        handleSend(undefined, data.url, type);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to upload attachment');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload attachment');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-transparent border-l border-white/5 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="bg-[#131313] p-8 rounded-3xl border border-white/10 flex flex-col items-center shadow-2xl relative z-10">
          <div className="w-20 h-20 bg-[#1A1A1A] rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-inner">
            <Clock size={32} className="text-zinc-400 opacity-80" />
          </div>
          <h2 className="text-2xl font-normal text-white mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Vibelly Direct</h2>
          <p className="text-zinc-500 text-sm mb-6 text-center max-w-[250px]">
            Select a user to start a secure, temporary conversation.
          </p>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-zinc-400 font-medium tracking-wide uppercase">Auto-deleting</span>
          </div>
        </div>
      </div>
    );
  }

  const myId = currentUser._id || currentUser.username;

  return (
    <div className="flex-1 flex flex-col bg-transparent border-l border-white/5 relative z-10 overflow-hidden">
      {/* Header */}
      <div className="h-20 border-b border-white/5 flex items-center px-4 md:px-8 bg-[#0A0A0A] z-20 sticky top-0 gap-3">
        {onBack && (
          <button 
            onClick={onBack}
            className="md:hidden p-2 text-zinc-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        )}
        <div className="relative shrink-0">
          <div className={`w-12 h-12 rounded-full border bg-[#1A1A1A] p-0.5 ${selectedUser?.premiumStatus ? 'border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-white/10'}`}>
            <div className="w-full h-full rounded-full bg-[#111] flex items-center justify-center overflow-hidden">
              {selectedUser?.profileImage ? (
                <img src={selectedUser.profileImage} alt={selectedUser.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-lg">{selectedUser.name?.charAt(0).toUpperCase() || '?'}</span>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#0A0A0A] rounded-full"></div>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-white font-medium text-base tracking-wide">{selectedUser.name || 'Anonymous'}</h3>
          <p className="text-zinc-500 text-xs mt-0.5">@{selectedUser.username}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#131313] border border-white/10 px-4 py-2 rounded-full">
            <Clock size={14} className="text-zinc-400" />
            <span className="text-xs text-zinc-400 font-medium tracking-wide">Secure Session</span>
          </div>
          <button 
            onClick={handleReport}
            title="Report User"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#131313] border border-white/10 text-zinc-500 hover:text-orange-400 hover:bg-white/5 transition-all"
          >
            <AlertTriangle size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-8 space-y-6 relative scroll-smooth custom-scrollbar"
        data-lenis-prevent
      >
        {messages.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-center">
             <div className="bg-[#131313] border border-white/10 px-8 py-8 rounded-3xl max-w-sm">
                <div className="w-14 h-14 bg-[#1A1A1A] border border-white/10 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Send size={20} className="text-zinc-500" />
                </div>
                <p className="text-xl font-normal text-white mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Say hi to {selectedUser.name}</p>
                <p className="text-zinc-500 text-sm leading-relaxed">This is a secure channel. Media and messages are automatically purged on a 6-hour cycle.</p>
             </div>
           </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === myId;
            const showAvatar = !isMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

            return (
              <div key={msg.id} className={`flex items-end gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                
                {!isMe && (
                  <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 ${!showAvatar ? 'opacity-0' : `bg-[#1A1A1A] border flex items-center justify-center ${selectedUser?.premiumStatus ? 'border-white shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'border-white/10'}`}`}>
                    {showAvatar && selectedUser?.profileImage ? (
                      <img src={selectedUser.profileImage} alt="User" className="w-full h-full object-cover" />
                    ) : showAvatar && (
                      <span className="text-xs font-bold text-white">{selectedUser.name?.charAt(0)}</span>
                    )}
                  </div>
                )}

                <div 
                  className={`max-w-[70%] px-5 pt-3 pb-2.5 relative ${
                    isMe 
                      ? 'bg-white text-black rounded-2xl rounded-br-sm' 
                      : 'bg-[#1A1A1A] text-white rounded-2xl rounded-bl-sm border border-white/10'
                  }`}
                >
                  {msg.attachmentUrl && (
                    <div className="mb-3 max-w-[250px] sm:max-w-[350px] overflow-hidden rounded-xl border border-black/10">
                      {msg.attachmentType === 'video' ? (
                         <video src={msg.attachmentUrl} controls className="w-full h-auto object-cover max-h-[300px] bg-black/10" />
                      ) : (
                        <img src={msg.attachmentUrl} alt="Attachment" className="w-full h-auto object-cover max-h-[300px] bg-black/10" />
                      )}
                    </div>
                  )}
                  {msg.message && <p className="leading-relaxed text-[15px] font-normal tracking-wide">{msg.message}</p>}
                  
                  <div className={`flex justify-end mt-1.5 ${msg.attachmentUrl && !msg.message ? 'absolute bottom-3 right-3 bg-black/40 px-2 py-0.5 rounded-full' : ''}`}>
                    <p className={`text-[11px] font-medium ${
                      (msg.attachmentUrl && !msg.message) ? 'text-white' : (isMe ? 'text-zinc-500' : 'text-zinc-500')
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {isTyping && (
          <div className="flex items-end gap-3 justify-start mt-4">
            <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 bg-[#1A1A1A] border border-white/10 flex items-center justify-center`}>
              {selectedUser?.profileImage ? (
                <img src={selectedUser.profileImage} alt="User" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-white">{selectedUser.name?.charAt(0)}</span>
              )}
            </div>
            <div className="bg-[#1A1A1A] px-4 py-3.5 rounded-2xl rounded-bl-sm border border-white/10 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input */}
      <div className="p-6 bg-[#0A0A0A] border-t border-white/5 relative z-20">
        <form onSubmit={(e) => handleSend(e)} className="relative flex items-end gap-3 max-w-4xl mx-auto">
          
          <input 
            type="file" 
            accept="image/*,video/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#131313] text-zinc-400 hover:bg-[#1A1A1A] hover:text-white transition-all duration-300 shrink-0 border border-white/10 disabled:opacity-50"
          >
            {isUploading ? <Loader2 size={22} className="animate-spin text-white" /> : <Paperclip size={22} />}
          </button>

          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              className="w-full bg-[#131313] border border-white/10 rounded-xl py-3.5 px-5 text-[15px] text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-all duration-300 resize-none"
              rows={1}
              style={{ minHeight: '52px', maxHeight: '120px' }}
            />
          </div>

          <button 
            type="submit"
            disabled={!inputText.trim() && !isUploading}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-white text-black disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all duration-300 shrink-0"
          >
            <Send size={20} className={`${!inputText.trim() ? 'opacity-50' : 'opacity-100'} ml-0.5`} />
          </button>
        </form>
      </div>
    </div>
  );
}
