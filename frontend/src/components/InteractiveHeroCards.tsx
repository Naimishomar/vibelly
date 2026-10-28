import { motion } from 'framer-motion';
import { Shield, MessageSquare, Video, Headphones, ArrowRight } from 'lucide-react';

export default function InteractiveHeroCards() {
  return (
    <div className="relative w-full h-[500px] md:h-[600px] flex justify-center items-center mt-[-40px]">
      {/* Left Card - Settings/Rules */}
      <motion.div
        className="absolute left-[2%] md:left-[10%] top-[20%] w-[260px] md:w-[320px] bg-[#131313] border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] p-5 z-10 hidden sm:block"
        initial={{ rotate: -15, x: -80, opacity: 0 }}
        whileInView={{ rotate: -8, x: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2, type: 'spring', bounce: 0.3 }}
      >
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-white">
            <Shield size={16} />
            <span className="text-sm font-semibold">Privacy Rules</span>
          </div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Status</div>
        </div>
        <div className="space-y-4">
          {[
            { name: 'End-to-End Encryption', active: true },
            { name: 'Anonymous Identity', active: true },
            { name: 'Data Retention', active: false },
            { name: 'High-Quality Media', active: true }
          ].map((item) => (
            <div key={item.name} className="flex justify-between items-center">
              <span className="text-xs text-zinc-300 flex items-center gap-2">
                <div className="w-3 h-4 bg-white/5 rounded-sm border border-white/10 flex items-center justify-center">
                  <div className="w-1.5 h-0.5 bg-white/30 rounded-full" />
                </div>
                {item.name}
              </span>
              <div className={`w-8 h-4 rounded-full relative transition-colors ${item.active ? 'bg-white' : 'bg-white/10'}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${item.active ? 'right-0.5 bg-black' : 'left-0.5 bg-zinc-500'}`} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right Card - Live Chat */}
      <motion.div
        className="absolute right-[2%] md:right-[10%] top-[15%] w-[260px] md:w-[320px] bg-[#131313] border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] p-5 z-10 hidden sm:block"
        initial={{ rotate: 15, x: 80, opacity: 0 }}
        whileInView={{ rotate: 8, x: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3, type: 'spring', bounce: 0.3 }}
      >
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-white">
            <MessageSquare size={16} />
            <span className="text-sm font-semibold">Live Chat</span>
          </div>
          <span className="text-[10px] text-zinc-500">2 connected</span>
        </div>
        <div className="space-y-3">
          <div className="flex gap-3 items-center p-2.5 rounded-xl hover:bg-white/5 border border-transparent transition-colors">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-medium shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]">S</div>
            <div className="flex-1">
              <div className="text-xs font-medium text-white flex justify-between">Stranger <span className="text-[10px] text-zinc-500 font-normal">Now</span></div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Hi there! Anyone around?</div>
            </div>
          </div>
          <div className="flex gap-3 items-center p-2.5 rounded-xl bg-white/[0.03] border border-white/10 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-medium shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]">Y</div>
            <div className="flex-1">
              <div className="text-xs font-medium text-white flex justify-between">You <span className="text-[10px] text-zinc-500 font-normal">Just now</span></div>
              <div className="text-[11px] text-zinc-400 mt-0.5">Hey! Just joined the queue.</div>
            </div>
          </div>
          <div className="flex gap-3 items-center p-2.5 rounded-xl hover:bg-white/5 border border-transparent transition-colors opacity-50">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-medium shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]">S</div>
            <div className="flex-1">
              <div className="text-xs font-medium text-white flex justify-between">Stranger</div>
              <div className="text-[11px] text-emerald-400 mt-0.5 italic">is typing...</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Center Card - Video Session (Main Focus) */}
      <motion.div
        className="absolute z-20 w-full max-w-[500px] bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.8)] overflow-hidden"
        initial={{ y: 60, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, type: 'spring', bounce: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#111]">
          <div className="flex items-center gap-2">
            <Video size={16} className="text-zinc-300" />
            <span className="text-sm font-medium text-white">Live Session</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            Match Found
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Video Feed Placeholder */}
          <div className="relative w-full aspect-video bg-[#111] rounded-xl border border-white/5 overflow-hidden mb-6 group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Video size={24} className="text-white/40" />
               </div>
               <span className="text-xs text-zinc-500 font-medium">Remote stream connected</span>
            </div>
            
            {/* Local PiP Preview */}
            <div className="absolute bottom-4 right-4 w-1/4 aspect-video bg-[#1A1A1A] rounded-lg border border-white/20 shadow-lg overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent" />
               <Video size={14} className="text-white/30" />
               <div className="absolute bottom-1 left-1.5 text-[8px] bg-black/60 px-1 rounded text-white">You</div>
            </div>
          </div>
          
          {/* Action Bar */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 bg-white/5 rounded-lg p-1 border border-white/10">
              <button aria-label="Video call" className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Video size={16} className="text-white" />
              </button>
              <button aria-label="Voice call" className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors">
                <Headphones size={16} className="text-zinc-400" />
              </button>
            </div>
            
            <div className="relative w-full max-w-[200px] ml-4">
              <input 
                aria-label="Message"
                type="text" 
                placeholder="Type a message..." 
                className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 px-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
                readOnly
              />
              <button aria-label="Send message" className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white text-black flex items-center justify-center">
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
