import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Headphones, Mic, Shield, ArrowRight, CheckCircle2, AlertCircle, ChevronDown, Globe } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuthStore } from '@/store/useAuthStore';

export default function Lobby() {
  const navigate = useNavigate();
  const { type } = useParams<{ type: string }>();
  const isAudioOnly = type === 'audio';

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [targetCountry, setTargetCountry] = useState(() => localStorage.getItem('vibe_target_country') || 'Global');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [targetGender, setTargetGender] = useState(() => localStorage.getItem('vibe_target_gender') || 'Girl');
  const { user, isAuthenticated, guestAccessEnabled } = useAuthStore();
  
  const COMMON_COUNTRIES = [
    { name: 'Global', code: null },
    { name: 'India', code: 'in' },
    { name: 'United States', code: 'us' },
    { name: 'United Kingdom', code: 'gb' },
    { name: 'Canada', code: 'ca' },
    { name: 'Australia', code: 'au' },
    { name: 'Germany', code: 'de' },
    { name: 'France', code: 'fr' },
    { name: 'Brazil', code: 'br' },
    { name: 'Japan', code: 'jp' }
  ];

  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let animationFrame: number;

    const initMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: isAudioOnly ? false : { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: true,
        });
        
        setStream(mediaStream);
        
        if (videoRef.current && !isAudioOnly) {
          videoRef.current.srcObject = mediaStream;
        }

        // Setup Audio Analyser
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        microphone = audioContext.createMediaStreamSource(mediaStream);
        microphone.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevel = () => {
          analyser!.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          setAudioLevel(sum / dataArray.length / 255);
          animationFrame = requestAnimationFrame(updateLevel);
        };
        updateLevel();

      } catch (err) {
        console.error('Failed to get media devices:', err);
        setError('Could not access camera or microphone. Please check your browser permissions.');
      }
    };

    void initMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrame) cancelAnimationFrame(animationFrame);
      microphone?.disconnect();
      analyser?.disconnect();
      void audioContext?.close().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAudioOnly]);

  // Persist matchmaking preferences
  useEffect(() => {
    localStorage.setItem('vibe_target_country', targetCountry);
  }, [targetCountry]);

  useEffect(() => {
    localStorage.setItem('vibe_target_gender', targetGender);
  }, [targetGender]);

  const handleEnterQueue = () => {
    if (stream) {
      // Stop the tracks so the actual VideoCall component can request them fresh
      // This prevents "device in use" errors on some browsers
      stream.getTracks().forEach(track => track.stop());
    }
    
    navigate(`/call/${isAudioOnly ? 'audio' : 'video'}`, { 
      state: { 
        targetCountry: targetCountry !== 'Global' ? targetCountry : undefined,
        targetGender: (isAuthenticated && user?.premiumStatus) ? targetGender : undefined 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-[#15171B] text-white flex flex-col font-sans relative overflow-x-hidden">
      {/* ─── Dot Grid ─── */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.10]"
        style={{
          backgroundImage: 'radial-gradient(circle at center, white 1.5px, transparent 1.5px)',
          backgroundSize: '32px 32px',
        }}
      />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 gap-12 max-w-6xl mx-auto w-full">
          
          {/* Left Side: Media Preview */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-1/2 flex flex-col items-center"
          >
            <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center">
              {error ? (
                <div className="flex flex-col items-center gap-3 text-red-400 p-8 text-center">
                  <AlertCircle size={48} className="text-red-500" />
                  <p className="font-medium text-lg">{error}</p>
                </div>
              ) : isAudioOnly ? (
                <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-br from-zinc-900 to-black">
                  {/* Audio Wave Animation */}
                  <motion.div 
                    animate={{ scale: 1 + audioLevel * 1.5, opacity: Math.max(0, 0.4 - audioLevel * 0.4) }}
                    transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
                    className="absolute inset-0 m-auto w-32 h-32 rounded-full bg-zinc-800 blur-xl"
                  />
                  <div className="relative z-10 w-32 h-32 rounded-full bg-zinc-800 flex items-center justify-center shadow-[0_0_50px_rgba(39,39,42,0.8)] border border-white/10 backdrop-blur-sm">
                    <Headphones size={48} className="text-white" />
                  </div>
                </div>
              ) : (
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover mirror" 
                />
              )}

              {/* Status Overlay */}
              {!error && (
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 border border-zinc-800">
                    <div className="w-2 h-2 rounded-full bg-zinc-300 shadow-[0_0_5px_rgba(255,255,255,0.5)] animate-pulse" />
                    Preview Active
                  </div>
                </div>
              )}
            </div>

            {/* Mic Level Indicator */}
            {!error && (
              <div className="mt-6 w-full max-w-sm flex items-center gap-4 bg-zinc-900/80 p-4 rounded-2xl border border-white/5">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                  <Mic size={20} className={audioLevel > 0.05 ? "text-white" : "text-zinc-500"} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs text-zinc-400 font-medium">
                    <span>Microphone Test</span>
                    {audioLevel > 0.05 && <span className="text-white text-[10px]">Receiving audio</span>}
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-white rounded-full"
                      animate={{ width: `${Math.min(100, audioLevel * 200)}%` }}
                      transition={{ type: 'tween', duration: 0.1 }}
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Right Side: Setup & Rules */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-1/2 max-w-md flex flex-col bg-zinc-900/90 p-8 rounded-3xl border border-zinc-800 shadow-2xl"
          >
            <h1 className="text-4xl font-normal mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
              Ready to vibe?
            </h1>
            <p className="text-zinc-400 text-sm mb-8">
              You are entering the {isAudioOnly ? 'Voice Only' : 'Video'} matchmaking queue. 
              Before we connect you, please review our community rules.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 items-start">
                <Shield className="text-zinc-400 shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-medium text-sm text-white mb-1">Safe Space Policy</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Be respectful to others. Nudity, harassment, and illegal behavior will result in an immediate ban.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 items-start">
                <Video className="text-zinc-400 shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-medium text-sm text-white mb-1">Instant Connection</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Once you click enter, you will be matched instantly. Ensure your surroundings are suitable for a call.
                  </p>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-3 mb-8 cursor-pointer group">
              <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${agreed ? 'bg-white border-white' : 'bg-transparent border-zinc-600 group-hover:border-zinc-400'}`}>
                {agreed && <CheckCircle2 size={14} className="text-black" />}
              </div>
              <span className="text-sm text-zinc-300 select-none group-hover:text-white transition-colors">
                I agree to be respectful and follow the rules
              </span>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)} 
              />
            </label>

            <div className="mb-8 relative">
              {(!isAuthenticated || !user?.premiumStatus) && (
                <div className="absolute inset-0 z-50 bg-zinc-900/40 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center border border-white/10 shadow-xl">
                  <div className="bg-zinc-800 p-2.5 rounded-full mb-3 shadow-lg border border-white/5">
                    <Shield size={20} className="text-white/80" />
                  </div>
                  <p className="text-sm font-medium text-white mb-3">Premium Feature</p>
                  <button 
                    onClick={() => navigate('/pricing')} 
                    className="px-5 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-zinc-200 transition-transform active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  >
                    Upgrade to Unlock
                  </button>
                </div>
              )}
              
              <div className={`p-4 rounded-2xl border border-white/5 bg-black/20 ${(!isAuthenticated || !user?.premiumStatus) ? 'opacity-60 pointer-events-none' : ''}`}>
                <label className="text-sm text-zinc-300 font-medium mb-3 block">Matchmaking Preference</label>
                
                <div 
                  className="relative cursor-pointer mb-6"
                  onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                >
                  <div className="w-full bg-zinc-800 border border-white/10 rounded-xl py-3 px-4 text-white transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {COMMON_COUNTRIES.find(c => c.name === targetCountry)?.code ? (
                        <img 
                          src={`https://flagcdn.com/w20/${COMMON_COUNTRIES.find(c => c.name === targetCountry)?.code}.png`} 
                          alt="flag" 
                          className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm"
                        />
                      ) : (
                        <Globe className="w-5 h-5 text-zinc-500" />
                      )}
                      <span>{targetCountry}</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                <AnimatePresence>
                  {isCountryDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full mt-[-20px] bg-zinc-800 border border-white/10 rounded-xl shadow-2xl overflow-x-hidden max-h-56 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-zinc-600"
                    >
                      {COMMON_COUNTRIES.map(c => (
                        <div
                          key={c.name}
                          onClick={() => {
                            setTargetCountry(c.name);
                            setIsCountryDropdownOpen(false);
                          }}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/10 transition-colors text-sm ${targetCountry === c.name ? 'bg-white/5 text-white font-medium' : 'text-zinc-400'}`}
                        >
                          {c.code ? (
                            <img 
                              src={`https://flagcdn.com/w20/${c.code}.png`} 
                              alt={c.name} 
                              className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm"
                            />
                          ) : (
                            <Globe className="w-5 h-5 text-zinc-500" />
                          )}
                          {c.name}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Gender Preference */}
                <label className="text-sm text-zinc-300 font-medium mb-3 block">Gender Preference</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Girl', 'Boy', 'Random'].map((g) => {
                    const fullGender = g === 'Random' ? 'Random Gender' : g;
                    const isSelected = targetGender === fullGender;
                    return (
                      <button
                        key={g}
                        onClick={() => setTargetGender(fullGender)}
                        className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                            : 'bg-zinc-800 text-zinc-400 border border-white/5'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {isAudioOnly && (!isAuthenticated || !user?.premiumStatus) ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-400 font-medium flex items-center justify-center gap-2">
                  <AlertCircle size={16} />
                  Voice Calls are a Premium Feature
                </p>
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full mt-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {isAuthenticated ? 'Upgrade to Premium' : 'Sign In to Upgrade'}
                </button>
              </div>
            ) : (!isAudioOnly && !isAuthenticated && !guestAccessEnabled) ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                <p className="text-sm text-red-400 font-medium flex items-center justify-center gap-2">
                  <AlertCircle size={16} />
                  Sign In required for Video Chat
                </p>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={!agreed || !!error}
                onClick={handleEnterQueue}
                className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                  agreed && !error
                    ? 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_40px_rgba(255,255,255,0.2)]'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                Enter Matchmaking
                <ArrowRight size={18} />
              </motion.button>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
}
