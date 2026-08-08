import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X } from 'lucide-react';
import ReferralModal from './ReferralModal';

interface SharePromptProps {
  open: boolean;
  onClose: () => void;
}

export default function SharePrompt({ open, onClose }: SharePromptProps) {
  const [showReferral, setShowReferral] = useState(false);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-4 z-40 max-w-[300px] sm:bottom-6 sm:right-6"
          >
            <div className="relative rounded-2xl bg-[#1A1A1A]/95 backdrop-blur-md border border-amber-400/30 shadow-2xl shadow-black/60 p-4">
              <button
                onClick={onClose}
                aria-label="Dismiss"
                className="absolute top-2.5 right-2.5 p-1 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-amber-200 via-white to-amber-400 p-[1.5px]">
                  <div className="w-full h-full rounded-[10px] bg-[#1A1A1A] flex items-center justify-center">
                    <Gift size={16} className="text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-snug">
                    Loved that chat?
                  </p>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Invite a friend to Vibelly — you both get <span className="text-white font-medium">3 days of Premium</span>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReferral(true)}
                className="mt-3 w-full bg-white text-black text-sm font-semibold py-2 rounded-xl hover:bg-white/85 transition-colors cursor-pointer"
              >
                Invite a friend
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showReferral && <ReferralModal onClose={() => setShowReferral(false)} />}
    </>
  );
}
